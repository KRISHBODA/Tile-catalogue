import { prisma } from '../config/database.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CatalogueDesign, CatalogueOption, ICatalogueRepository } from '../types/catalogue.types.js';
// Dedicated additive tables preserve the existing commerce Product schema and user tables.
let setup: Promise<void> | undefined;
async function ready() {
  if (!setup) setup = (async () => {
    await Promise.all([
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_designs (owner TEXT NOT NULL, id TEXT NOT NULL, code TEXT NOT NULL, revision INTEGER NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(owner,id), UNIQUE(owner,code))'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_option_initialization (owner TEXT PRIMARY KEY)'),
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_options (owner TEXT NOT NULL, id TEXT NOT NULL, category TEXT NOT NULL, normalized TEXT NOT NULL, revision INTEGER NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(owner,id), UNIQUE(owner,category,normalized))')
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
    const folder=path.resolve('data/catalogue-media',owner);
    await mkdir(folder,{recursive:true});
    await writeFile(path.join(folder,id),bytes,{flag:'wx',mode:0o600});
  }
  async readMedia(owner: string, id: string) { return readFile(path.resolve('data/catalogue-media',owner,id)); }
}
export const catalogueRepository = new CatalogueRepository();
