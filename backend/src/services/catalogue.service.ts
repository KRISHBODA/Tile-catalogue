import { randomUUID } from 'node:crypto';
import { catalogueRepository } from '../repositories/catalogue.repository.js';
import type { CatalogueDesign, CatalogueOption, ICatalogueRepository } from '../types/catalogue.types.js';
import { mediaRoles } from '../types/catalogue.types.js';
import { CatalogueConstants as C } from '../constants/catalogue.constants.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/appError.js';
const filePattern=/^[a-f0-9-]{36}\.(png|jpg|webp|mp4|webm)$/;
const sizePattern=/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(?:\s*mm)?$/i;
const validSize=(value:string) => { const m=value.match(sizePattern); return m && +m[1]>0 && +m[2]>0 && +m[1]<=10000 && +m[2]<=10000; };
export class CatalogueService {
  private optionInitializations = new Map<string, Promise<void>>();
  constructor(private repo: ICatalogueRepository = catalogueRepository) {}
  list(owner:string) { return this.repo.list(owner); }
  async options(owner:string) {
    const defaults = Object.entries(C.DEFAULT_OPTIONS).flatMap(([group,values])=>values.map(value=>({id:randomUUID(),group,value,revision:1})));
    let initialization = this.optionInitializations.get(owner);
    if (!initialization) {
      initialization = this.repo.initializeOptions(owner, defaults).catch(error => { this.optionInitializations.delete(owner); throw error; });
      this.optionInitializations.set(owner, initialization);
    }
    await initialization;
    return this.repo.options(owner);
  }
  async save(owner:string, uploader:string, input:unknown) {
    if(!Array.isArray(input)||!input.length||input.length>C.MAX_BATCH) throw new BadRequestError(C.MESSAGES.LIMIT);
    const existing=await this.repo.list(owner), now=new Date().toISOString();
    const expected:number[]=[];
    const designs:CatalogueDesign[]=[];
    for(const raw of input) {
      if(!raw||typeof raw!=='object') throw new BadRequestError(C.MESSAGES.INVALID);
      const old=existing.find(d=>d.id===raw.id);
      if(raw.id && !old) throw new NotFoundError(C.MESSAGES.NOT_FOUND);
      if(old && raw.revision!==old.revision) throw new ConflictError(C.MESSAGES.CONFLICT);
      const clean:Record<string,unknown>={};
      for(const key of C.TEXT_FIELDS) {
        if(raw[key]!==undefined&&typeof raw[key]!=='string') throw new BadRequestError(C.MESSAGES.INVALID);
        clean[key]=(raw[key]||'').trim();
        if((clean[key] as string).length>(key==='description'?5000:500)) throw new BadRequestError(C.MESSAGES.INVALID);
      }
      for(const key of C.BOOL_FIELDS) { if(raw[key]!==undefined&&typeof raw[key]!=='boolean') throw new BadRequestError(C.MESSAGES.INVALID); clean[key]=raw[key]??false; }
      if(!clean.name||!clean.code||!clean.collection||!clean.surface||!validSize(clean.size as string)||!(Number(clean.thickness)>0&&Number(clean.thickness)<=100)||!C.STATUSES.includes(clean.status as never)) throw new BadRequestError(C.MESSAGES.INVALID);
      if(clean.url360 && !/^https?:\/\//i.test(clean.url360 as string)) throw new BadRequestError(C.MESSAGES.INVALID);
      if(!Array.isArray(raw.media)||raw.media.length>C.MAX_MEDIA) throw new BadRequestError(C.MESSAGES.MEDIA);
      const media=raw.media.map((m:Record<string,unknown>)=> {
        if(!m||typeof m.id!=='string'||!filePattern.test(m.id)||!mediaRoles.includes(m.role as never)||typeof m.name!=='string') throw new BadRequestError(C.MESSAGES.MEDIA);
        const video=/\.(mp4|webm)$/.test(m.id);
        if(video!==['live-video','social-video'].includes(m.role as string)) throw new BadRequestError(C.MESSAGES.MEDIA);
        return {id:m.id,role:m.role,name:m.name.slice(0,200)};
      });
      const variants=Array.isArray(raw.variants)?raw.variants:[];
      if(variants.length>30||variants.some((v:Record<string,unknown>)=>!v||typeof v.size!=='string'||!validSize(v.size)||typeof v.surface!=='string'||!v.surface.trim()||typeof v.body!=='string'||!(Number(v.thickness)>0&&Number(v.thickness)<=100))) throw new BadRequestError(C.MESSAGES.INVALID);
      designs.push({...clean,id:old?.id||randomUUID(),revision:(old?.revision||0)+1,createdAt:old?.createdAt||now,updatedAt:now,uploadedBy:old?.uploadedBy||uploader,deletedAt:raw.deletedAt?old?.deletedAt||now:null,media,variants} as CatalogueDesign);
      expected.push(old?.revision||0);
    }
    if(new Set(designs.map(d=>d.code.toLowerCase())).size!==designs.length||new Set(designs.map(d=>d.id)).size!==designs.length) throw new ConflictError(C.MESSAGES.CONFLICT);
    // Verify attachment ownership and existence before committing references.
    for(const id of new Set(designs.flatMap(d=>d.media.map(m=>m.id)))) { try { await this.repo.mediaSize(owner,id); } catch(error) { if((error as NodeJS.ErrnoException).code==='ENOENT')throw new BadRequestError(C.MESSAGES.MISSING_MEDIA);throw error; } }
    try { return await this.repo.save(owner,designs,expected); } catch { throw new ConflictError(C.MESSAGES.CONFLICT); }
  }
  async option(owner:string, raw:CatalogueOption, remove=false) {
    if(!raw||typeof raw!=='object') throw new BadRequestError(C.MESSAGES.OPTION);
    const old=(await this.repo.options(owner)).find(o=>o.id===raw.id);
    if(raw.id&&(!old||old.revision!==raw.revision)) throw new ConflictError(C.MESSAGES.CONFLICT);
    if(remove) { if(!old) throw new NotFoundError(C.MESSAGES.OPTION); return this.repo.removeOption(owner,old.id,old.revision); }
    if(!C.GROUPS.includes(raw.group as never)||typeof raw.value!=='string'||!raw.value.trim()||raw.value.length>80) throw new BadRequestError(C.MESSAGES.OPTION);
    let value=raw.value.trim();
    if(raw.group==='size') { if(!validSize(value)) throw new BadRequestError(C.MESSAGES.OPTION); const m=value.match(sizePattern)!; value=`${+m[1]} × ${+m[2]}`; }
    if(raw.group==='thickness'&&!(+value>0&&+value<=100)) throw new BadRequestError(C.MESSAGES.OPTION);
    try { return await this.repo.saveOption(owner,{id:old?.id||randomUUID(),group:raw.group,value,revision:(old?.revision||0)+1},old?.revision||0); } catch { throw new ConflictError(C.MESSAGES.CONFLICT); }
  }
  async upload(owner:string, bytes:Buffer) {
    if(!Buffer.isBuffer(bytes)||!bytes.length) throw new BadRequestError(C.MESSAGES.MEDIA);
    let ext='';
    if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ext='png';
    else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255) ext='jpg';
    else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP') ext='webp';
    else if(bytes.toString('ascii',4,8)==='ftyp'&&['isom','iso2','mp41','mp42','avc1','M4V ','iso5','iso6','dash'].includes(bytes.toString('ascii',8,12))) ext='mp4';
    else if(bytes.subarray(0,4).equals(Buffer.from([26,69,223,163]))&&bytes.subarray(0,4096).includes(Buffer.from('webm'))) ext='webm';
    if(!ext||bytes.length>(['mp4','webm'].includes(ext)?C.MAX_VIDEO_BYTES:C.MAX_IMAGE_BYTES)) throw new BadRequestError(C.MESSAGES.MEDIA);
    const id=`${randomUUID()}.${ext}`; await this.repo.putMedia(owner,id,bytes); return {id};
  }
  async uploadPart(owner:string,upload:string,index:number,bytes:Buffer) {
    if(!/^[a-f0-9-]{36}$/i.test(upload)||!Number.isInteger(index)||index<0||index>=Math.ceil(C.MAX_VIDEO_BYTES/C.MEDIA_CHUNK_BYTES)||!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>C.MEDIA_CHUNK_BYTES) throw new BadRequestError(C.MESSAGES.MEDIA);
    await this.repo.putUploadPart(owner,upload,index,bytes);
  }
  async finishUpload(owner:string,upload:string,count:number,size:number) {
    if(!/^[a-f0-9-]{36}$/i.test(upload)||!Number.isInteger(count)||count<1||count>Math.ceil(C.MAX_VIDEO_BYTES/C.MEDIA_CHUNK_BYTES)||!Number.isInteger(size)||size<1||size>C.MAX_VIDEO_BYTES||count!==Math.ceil(size/C.MEDIA_CHUNK_BYTES)) throw new BadRequestError(C.MESSAGES.MEDIA);
    const parts=await this.repo.readUploadParts(owner,upload);
    if(parts.length!==count||parts.some((part,i)=>part.index!==i||part.bytes.length!==(i===count-1?size-i*C.MEDIA_CHUNK_BYTES:C.MEDIA_CHUNK_BYTES))) throw new BadRequestError(C.MESSAGES.MEDIA);
    const result=await this.upload(owner,Buffer.concat(parts.map(part=>part.bytes),size));
    await this.repo.clearUploadParts(owner,upload);
    return result;
  }
  async mediaInfo(owner:string,id:string) {
    if(!filePattern.test(id))throw new NotFoundError(C.MESSAGES.MISSING_MEDIA);
    try{return {size:await this.repo.mediaSize(owner,id),chunkSize:C.MEDIA_CHUNK_BYTES};}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw new NotFoundError(C.MESSAGES.MISSING_MEDIA);throw error;}
  }
  async mediaPart(owner:string,id:string,index:number) {
    if(!filePattern.test(id)||!Number.isInteger(index)||index<0)throw new NotFoundError(C.MESSAGES.MISSING_MEDIA);
    const info=await this.mediaInfo(owner,id),offset=index*C.MEDIA_CHUNK_BYTES;
    if(offset>=info.size)throw new NotFoundError(C.MESSAGES.MISSING_MEDIA);
    try{return await this.repo.mediaPart(owner,id,offset,C.MEDIA_CHUNK_BYTES);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw new NotFoundError(C.MESSAGES.MISSING_MEDIA);throw error;}
  }
  async media(owner:string,id:string) { if(!filePattern.test(id)) throw new NotFoundError(C.MESSAGES.MISSING_MEDIA); try{return await this.repo.readMedia(owner,id);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw new NotFoundError(C.MESSAGES.MISSING_MEDIA);throw error;} }
}
export const catalogueService=new CatalogueService();
