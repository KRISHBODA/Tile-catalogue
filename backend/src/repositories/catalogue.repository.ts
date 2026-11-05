import { prisma } from '../config/database.js';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { CatalogueDesign, CatalogueOption, ICatalogueRepository } from '../types/catalogue.types.js';
// Dedicated additive tables preserve the existing commerce Product schema and user tables.
let setup: Promise<void> | undefined;
async function ready() {
  if (!setup) setup = (async () => {
    await Promise.all([
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_designs (owner TEXT NOT NULL, id TEXT NOT NULL, code TEXT NOT NULL, revision INTEGER NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(owner,id), UNIQUE(owner,code))'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_option_initialization (owner TEXT PRIMARY KEY)'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_options (owner TEXT NOT NULL, id TEXT NOT NULL, category TEXT NOT NULL, normalized TEXT NOT NULL, revision INTEGER NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(owner,id), UNIQUE(owner,category,normalized))'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_media (owner TEXT NOT NULL, id TEXT NOT NULL, bytes BYTEA NOT NULL, PRIMARY KEY(owner,id))'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_media_manifest (owner TEXT NOT NULL, id TEXT NOT NULL, size INTEGER NOT NULL, PRIMARY KEY(owner,id))'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_media_blocks (owner TEXT NOT NULL, id TEXT NOT NULL, part_index INTEGER NOT NULL, bytes BYTEA NOT NULL, PRIMARY KEY(owner,id,part_index))'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_media_parts (owner TEXT NOT NULL, upload_id TEXT NOT NULL, part_index INTEGER NOT NULL, bytes BYTEA NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(owner,upload_id,part_index))')
    ]);
  })().catch(e => { setup = undefined; throw e; });
  await setup;
}
export class CatalogueRepository implements ICatalogueRepository {
  async list(owner: string) {
    await ready();
    const rows = await prisma.$queryRaw<{payload: CatalogueDesign}[]>`SELECT payload FROM catalogue_designs WHERE owner=${owner} ORDER BY payload->>'createdAt' DESC`;
    return rows.map(r => r.payload);
  }
  async save(owner: string, designs: CatalogueDesign[], expected: number[]) {
    await ready();
    await prisma.$transaction(async tx => {
      for (let i=0;i<designs.length;i++) {
        const d=designs[i];
        if (expected[i]===0) {
          await tx.$executeRaw`INSERT INTO catalogue_designs(owner,id,code,revision,payload) VALUES(${owner},${d.id},${d.code.toLowerCase()},${d.revision},${JSON.stringify(d)}::jsonb)`;
        } else {
          const count=await tx.$executeRaw`UPDATE catalogue_designs SET code=${d.code.toLowerCase()},revision=${d.revision},payload=${JSON.stringify(d)}::jsonb WHERE owner=${owner} AND id=${d.id} AND revision=${expected[i]}`;
          if (count!==1) throw new Error('CATALOGUE_CONFLICT');
        }
      }
    }, { timeout: 30000 });
    return designs;
  }
  async initializeOptions(owner: string, options: CatalogueOption[]) {
    await ready();
    await prisma.$transaction(async tx => {
      const inserted = await tx.$executeRaw`INSERT INTO catalogue_option_initialization(owner) VALUES(${owner}) ON CONFLICT DO NOTHING`;
      if (!inserted) return;
      for (const option of options) {
        await tx.$executeRaw`INSERT INTO catalogue_options(owner,id,category,normalized,revision,payload) VALUES(${owner},${option.id},${option.group},${option.value.toLowerCase()},${option.revision},${JSON.stringify(option)}::jsonb) ON CONFLICT DO NOTHING`;
      }
    }, { timeout: 30000 });
  }
  async options(owner: string) {
    await ready();
    const rows=await prisma.$queryRaw<{payload: CatalogueOption}[]>`SELECT payload FROM catalogue_options WHERE owner=${owner} ORDER BY category,normalized`;
    return rows.map(r=>r.payload);
  }
  async saveOption(owner: string, option: CatalogueOption, expected: number) {
    await ready();
    if (!expected) await prisma.$executeRaw`INSERT INTO catalogue_options(owner,id,category,normalized,revision,payload) VALUES(${owner},${option.id},${option.group},${option.value.toLowerCase()},${option.revision},${JSON.stringify(option)}::jsonb)`;
    else {
      const count=await prisma.$executeRaw`UPDATE catalogue_options SET normalized=${option.value.toLowerCase()},revision=${option.revision},payload=${JSON.stringify(option)}::jsonb WHERE owner=${owner} AND id=${option.id} AND revision=${expected} AND category=${option.group}`;
      if(count!==1) throw new Error('CATALOGUE_CONFLICT');
    }
    return this.options(owner);
  }
  async removeOption(owner: string, id: string, revision: number) {
    await ready();
    const count=await prisma.$executeRaw`DELETE FROM catalogue_options WHERE owner=${owner} AND id=${id} AND revision=${revision}`;
    if(count!==1) throw new Error('CATALOGUE_CONFLICT');
    return this.options(owner);
  }
  async putMedia(owner: string, id: string, bytes: Buffer) {
    await ready();
    const blockSize=3*1024*1024;
    await prisma.$transaction(async tx=>{
      await tx.$executeRaw`INSERT INTO catalogue_media_manifest(owner,id,size) VALUES(${owner},${id},${bytes.length})`;
      for(let offset=0,index=0;offset<bytes.length;offset+=blockSize,index++) {
        const block=bytes.subarray(offset,offset+blockSize);
        await tx.$executeRaw`INSERT INTO catalogue_media_blocks(owner,id,part_index,bytes) VALUES(${owner},${id},${index},${block})`;
      }
    },{timeout:120000});
  }
  private async storedMedia(owner: string,id: string):Promise<Buffer|null> {
    const manifests=await prisma.$queryRaw<{size:number}[]>`SELECT size FROM catalogue_media_manifest WHERE owner=${owner} AND id=${id}`;
    if(manifests.length) {
      const blocks: Buffer[]=[];
      const count=Math.ceil(Number(manifests[0].size)/(3*1024*1024));
      for(let index=0;index<count;index++) {
        const rows=await prisma.$queryRaw<{bytes:Uint8Array}[]>`SELECT bytes FROM catalogue_media_blocks WHERE owner=${owner} AND id=${id} AND part_index=${index}`;
        if(!rows.length)throw new Error('Stored media block is missing');
        blocks.push(Buffer.from(rows[0].bytes));
      }
      const result=Buffer.concat(blocks);
      if(result.length!==Number(manifests[0].size))throw new Error('Stored media is incomplete');
      return result;
    }
    const rows=await prisma.$queryRaw<{bytes:Uint8Array}[]>`SELECT bytes FROM catalogue_media WHERE owner=${owner} AND id=${id}`;
    return rows.length?Buffer.from(rows[0].bytes):null;
  }
  // Used only by the explicit, approved local-to-database media migration.
  async copyLocalMedia(owner: string, id: string, bytes: Buffer) {
    await ready();
    const existing=await this.storedMedia(owner,id);
    if(existing) {
      if(!existing.equals(bytes))throw new Error('Media ID already exists with different contents');
      return false;
    }
    await this.putMedia(owner,id,bytes);
    const stored=await this.storedMedia(owner,id);
    if(!stored||!stored.equals(bytes))throw new Error('Stored media verification failed');
    return true;
  }
  async readMedia(owner: string, id: string) {
    await ready();
    const stored=await this.storedMedia(owner,id);
    return stored??await readFile(path.resolve('data/catalogue-media',owner,id));
  }
  async mediaSize(owner: string, id: string) {
    await ready();
    const manifests=await prisma.$queryRaw<{size:number}[]>`SELECT size FROM catalogue_media_manifest WHERE owner=${owner} AND id=${id}`;
    if(manifests.length)return Number(manifests[0].size);
    const rows=await prisma.$queryRaw<{size: number}[]>`SELECT octet_length(bytes) AS size FROM catalogue_media WHERE owner=${owner} AND id=${id}`;
    if(rows.length)return Number(rows[0].size);
    return (await stat(path.resolve('data/catalogue-media',owner,id))).size;
  }
  async mediaPart(owner: string, id: string, offset: number, length: number) {
    await ready();
    const manifests=await prisma.$queryRaw<{size:number}[]>`SELECT size FROM catalogue_media_manifest WHERE owner=${owner} AND id=${id}`;
    if(manifests.length) {
      const blockIndex=Math.floor(offset/(3*1024*1024));
      const rows=await prisma.$queryRaw<{bytes:Uint8Array}[]>`SELECT bytes FROM catalogue_media_blocks WHERE owner=${owner} AND id=${id} AND part_index=${blockIndex}`;
      if(!rows.length)throw new Error('Stored media block is missing');
      return Buffer.from(rows[0].bytes).subarray(offset%(3*1024*1024),offset%(3*1024*1024)+length);
    }
    const rows=await prisma.$queryRaw<{bytes: Uint8Array}[]>`SELECT substring(bytes FROM ${offset+1} FOR ${length}) AS bytes FROM catalogue_media WHERE owner=${owner} AND id=${id}`;
    if(rows.length)return Buffer.from(rows[0].bytes);
    return (await readFile(path.resolve('data/catalogue-media',owner,id))).subarray(offset,offset+length);
  }
  async putUploadPart(owner: string, upload: string, index: number, bytes: Buffer) {
    await ready();
    await prisma.$executeRaw`DELETE FROM catalogue_media_parts WHERE owner=${owner} AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 day'`;
    await prisma.$executeRaw`INSERT INTO catalogue_media_parts(owner,upload_id,part_index,bytes) VALUES(${owner},${upload},${index},${bytes}) ON CONFLICT(owner,upload_id,part_index) DO UPDATE SET bytes=EXCLUDED.bytes,created_at=CURRENT_TIMESTAMP`;
  }
  async readUploadParts(owner: string, upload: string) {
    await ready();
    const indices=await prisma.$queryRaw<{index:number}[]>`SELECT part_index AS index FROM catalogue_media_parts WHERE owner=${owner} AND upload_id=${upload} ORDER BY part_index`;
    const parts:{index:number;bytes:Buffer}[]=[];
    for(const item of indices) {
      const index=Number(item.index);
      const rows=await prisma.$queryRaw<{bytes:Uint8Array}[]>`SELECT bytes FROM catalogue_media_parts WHERE owner=${owner} AND upload_id=${upload} AND part_index=${index}`;
      if(!rows.length)throw new Error('Upload part is missing');
      parts.push({index,bytes:Buffer.from(rows[0].bytes)});
    }
    return parts;
  }
  async clearUploadParts(owner: string, upload: string) {
    await ready();
    await prisma.$executeRaw`DELETE FROM catalogue_media_parts WHERE owner=${owner} AND upload_id=${upload}`;
  }
}
export const catalogueRepository = new CatalogueRepository();
