/** Run explicitly from backend: node --import tsx scripts/import-legacy.ts
 * Additive one-time migration. Uses the configured seed administrator as owner.
 * Existing matching design codes are skipped. The old SQLite library is read-only.
 */
import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readLegacyCatalogue} from '../src/repositories/legacy-catalogue.repository.js';
import {catalogueRepository} from '../src/repositories/catalogue.repository.js';
import {catalogueService} from '../src/services/catalogue.service.js';
import {db} from '../src/config/database.js';
import {mediaRoles, type CatalogueDesign, type CatalogueMedia, type MediaRole} from '../src/types/catalogue.types.js';

const root=path.resolve('..');
const sharp=createRequire(path.join(root,'frontend/package.json'))('sharp');
const response=await fetch('http://127.0.0.1:5000/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.SUPER_ADMIN_EMAIL,password:process.env.SUPER_ADMIN_PASSWORD})});
if(!response.ok)throw new Error('Administrator authentication failed');
const login=await response.json() as {data:{user:{id:string;name:string}}};
const owner=login.data.user.id;
const legacy=readLegacyCatalogue(path.join(root,'data/catalogue.sqlite'));
const options=legacy.options.map(o=>({...o,id:randomUUID(),group:o.group==='tag'?'tags':o.group,value:o.group==='size'?o.value.replace(/x/i,' × '):o.value}));
await catalogueRepository.initializeOptions(owner,options);
const currentOptions=await catalogueRepository.options(owner);
for(const option of options)if(!currentOptions.some(o=>o.group===option.group&&o.value.toLowerCase()===option.value.toLowerCase()))await catalogueService.option(owner,{...option,id:''});
const existing=await catalogueRepository.list(owner);const codes=new Set(existing.map(d=>d.code.toLowerCase()));
let imported=0,skipped=0;
try {
 for(const raw of legacy.products) {
  if(codes.has(String(raw.code).toLowerCase())){skipped++;continue;}
  const variants=(raw.variants as {widthMm:number;heightMm:number;surface:string;body:string;thicknessMm:number}[]).map(v=>({size:`${v.widthMm} × ${v.heightMm}`,surface:v.surface,body:v.body,thickness:String(v.thicknessMm)}));
  const media:CatalogueMedia[]=[];
  for(const m of [...(raw.faces as Record<string,unknown>[]||[]),...(raw.media as Record<string,unknown>[]||[])]) {
   const uri=String(m.originalUrl||m.previewUrl);let bytes:Buffer;
   if(/^\/samples\/tile-[0-5]\.svg$/.test(uri))bytes=await sharp(path.join(root,'frontend/public',uri)).png().toBuffer();
   else if(/^\/api\/media\/[a-f0-9-]{36}\.(png|jpg|jpeg|webp|mp4|webm)$/.test(uri))bytes=await readFile(path.join(root,'data/media',path.basename(uri)));
   else throw new Error('Unrecognized legacy media location; source was left unchanged');
   const role=m.role==='room-preview'?'preview':m.role as MediaRole;
   if(!mediaRoles.includes(role))throw new Error('Unrecognized legacy media role');
   const {id}=await catalogueService.upload(owner,bytes);
   media.push({id,role,name:String(m.alt||path.basename(uri)).replace(/\.svg$/,'.png')});
  }
  const input={...raw,...variants[0],id:undefined,revision:0,tags:(raw.tags as string[]||[]).join(', '),colours:(raw.colours as string[]||[]).join(', '),variants:variants.slice(1),media};
  const [saved]=await catalogueService.save(owner,String(raw.uploadedBy||login.data.user.name),[input]);
  const createdAt=String(raw.createdAt||raw.updatedAt||saved.createdAt),updatedAt=String(raw.updatedAt||createdAt);
  if(Number.isFinite(Date.parse(createdAt))&&Number.isFinite(Date.parse(updatedAt)))await catalogueRepository.save(owner,[{...saved,createdAt,updatedAt,revision:saved.revision+1} as CatalogueDesign],[saved.revision]);
  codes.add(saved.code.toLowerCase());imported++;
 }
 console.log(`Legacy catalogue: ${imported} imported; ${skipped} existing codes skipped. Original library unchanged.`);
}finally{await db.disconnect();}
