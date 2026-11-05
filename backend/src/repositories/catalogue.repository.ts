import { prisma } from '../config/database.js';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CatalogueDesign, CatalogueOption, ICatalogueRepository } from '../types/catalogue.types.js';
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { r2Client, isR2Configured } from '../config/r2.js';
import { env } from '../config/env.js';

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    default: return 'application/octet-stream';
  }
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const s = stream as { transformToByteArray?: () => Promise<Uint8Array>; on?: (event: string, fn: (...args: any[]) => void) => void } | null;
  if (s && typeof s.transformToByteArray === 'function') {
    const bytes = await s.transformToByteArray();
    return Buffer.from(bytes);
  }
  return new Promise<Buffer>((resolve, reject) => {
    if (!s || typeof s.on !== 'function') {
      return resolve(Buffer.alloc(0));
    }
    const chunks: Buffer[] = [];
    s.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    s.on('error', reject);
    s.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Dedicated additive tables preserve the existing commerce Product schema and user tables.
let setup: Promise<void> | undefined;
async function ready() {
  if (!setup) setup = (async () => {
    await Promise.all([
      prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_designs (owner TEXT NOT NULL, id TEXT NOT NULL, code TEXT NOT NULL, revision INTEGER NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(owner,id), UNIQUE(owner,code))'),
      prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_option_initialization (owner TEXT PRIMARY KEY)'),
      prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS catalogue_options (owner TEXT NOT NULL, id TEXT NOT NULL, category TEXT NOT NULL, normalized TEXT NOT NULL, revision INTEGER NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(owner,id), UNIQUE(owner,category,normalized))'),
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

  async putMedia(owner: string, id: string, bytes: Buffer): Promise<void> {
    if (isR2Configured()) {
      const key = `${owner}/${id}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
          Body: bytes,
          ContentType: getContentType(id),
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      return;
    }
    // Local disk fallback for local development when R2 credentials are not set
    const folder = path.resolve('data/catalogue-media', owner);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, id), bytes);
  }

  // Used by media migration / sync script
  async copyLocalMedia(owner: string, id: string, bytes: Buffer): Promise<boolean> {
    try {
      const size = await this.mediaSize(owner, id);
      if (size === bytes.length) {
        return false;
      }
    } catch {
      // Not yet present, proceed to upload
    }
    await this.putMedia(owner, id, bytes);
    return true;
  }

  async readMedia(owner: string, id: string): Promise<Buffer> {
    if (isR2Configured()) {
      try {
        const key = `${owner}/${id}`;
        const res = await r2Client.send(
          new GetObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: key,
          })
        );
        return await streamToBuffer(res.Body);
      } catch (err: unknown) {
        const awsErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (awsErr?.name !== 'NoSuchKey' && awsErr?.$metadata?.httpStatusCode !== 404) {
          throw err;
        }
      }
    }
    // Fallback: check local disk
    try {
      return await readFile(path.resolve('data/catalogue-media', owner, id));
    } catch {
      const enoent = new Error('Media not found') as NodeJS.ErrnoException;
      enoent.code = 'ENOENT';
      throw enoent;
    }
  }

  async mediaSize(owner: string, id: string): Promise<number> {
    if (isR2Configured()) {
      try {
        const key = `${owner}/${id}`;
        const res = await r2Client.send(
          new HeadObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: key,
          })
        );
        if (typeof res.ContentLength === 'number') {
          return res.ContentLength;
        }
      } catch (err: unknown) {
        const awsErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (awsErr?.name !== 'NoSuchKey' && awsErr?.$metadata?.httpStatusCode !== 404) {
          throw err;
        }
      }
    }
    try {
      return (await stat(path.resolve('data/catalogue-media', owner, id))).size;
    } catch {
      const enoent = new Error('Media not found') as NodeJS.ErrnoException;
      enoent.code = 'ENOENT';
      throw enoent;
    }
  }

  async mediaPart(owner: string, id: string, offset: number, length: number): Promise<Buffer> {
    if (isR2Configured()) {
      try {
        const key = `${owner}/${id}`;
        const end = offset + length - 1;
        const res = await r2Client.send(
          new GetObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: key,
            Range: `bytes=${offset}-${end}`,
          })
        );
        return await streamToBuffer(res.Body);
      } catch (err: unknown) {
        const awsErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (awsErr?.name !== 'NoSuchKey' && awsErr?.$metadata?.httpStatusCode !== 404) {
          throw err;
        }
      }
    }
    try {
      const file = await readFile(path.resolve('data/catalogue-media', owner, id));
      return file.subarray(offset, offset + length);
    } catch {
      const enoent = new Error('Media part not found') as NodeJS.ErrnoException;
      enoent.code = 'ENOENT';
      throw enoent;
    }
  }

  async putUploadPart(owner: string, upload: string, index: number, bytes: Buffer): Promise<void> {
    if (isR2Configured()) {
      const key = `uploads/${owner}/${upload}/${String(index).padStart(6, '0')}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
          Body: bytes,
          ContentType: 'application/octet-stream',
        })
      );
      return;
    }
    const folder = path.resolve('data/catalogue-uploads', owner, upload);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, String(index)), bytes);
  }

  async readUploadParts(owner: string, upload: string): Promise<{ index: number; bytes: Buffer }[]> {
    if (isR2Configured()) {
      const prefix = `uploads/${owner}/${upload}/`;
      const listRes = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: env.R2_BUCKET_NAME,
          Prefix: prefix,
        })
      );
      const objects = (listRes.Contents || []).sort((a, b) => (a.Key || '').localeCompare(b.Key || ''));
      const parts: { index: number; bytes: Buffer }[] = [];
      for (const obj of objects) {
        if (!obj.Key) continue;
        const partIndex = parseInt(obj.Key.split('/').pop() || '0', 10);
        const partRes = await r2Client.send(
          new GetObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: obj.Key,
          })
        );
        const partBytes = await streamToBuffer(partRes.Body);
        parts.push({ index: partIndex, bytes: partBytes });
      }
      return parts;
    }
    const folder = path.resolve('data/catalogue-uploads', owner, upload);
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(folder).catch(() => []);
    const parts: { index: number; bytes: Buffer }[] = [];
    for (const f of files.sort((a, b) => Number(a) - Number(b))) {
      const bytes = await readFile(path.join(folder, f));
      parts.push({ index: Number(f), bytes });
    }
    return parts;
  }

  async clearUploadParts(owner: string, upload: string): Promise<void> {
    if (isR2Configured()) {
      const prefix = `uploads/${owner}/${upload}/`;
      const listRes = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: env.R2_BUCKET_NAME,
          Prefix: prefix,
        })
      );
      if (listRes.Contents && listRes.Contents.length > 0) {
        for (const obj of listRes.Contents) {
          if (obj.Key) {
            await r2Client.send(
              new DeleteObjectCommand({
                Bucket: env.R2_BUCKET_NAME,
                Key: obj.Key,
              })
            );
          }
        }
      }
      return;
    }
    const folder = path.resolve('data/catalogue-uploads', owner, upload);
    const { rm } = await import('node:fs/promises');
    await rm(folder, { recursive: true, force: true }).catch(() => {});
  }
}

export const catalogueRepository = new CatalogueRepository();
