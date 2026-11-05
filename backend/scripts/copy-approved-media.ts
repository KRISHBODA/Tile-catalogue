/** Copies only the four approved, currently referenced local photos. */
import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {catalogueRepository} from '../src/repositories/catalogue.repository.js';
import {db} from '../src/config/database.js';

const response=await fetch('http://127.0.0.1:5000/api/v1/auth/login',{
 method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({email:process.env.SUPER_ADMIN_EMAIL,password:process.env.SUPER_ADMIN_PASSWORD}),
});
if(!response.ok)throw new Error('Could not authenticate to identify the catalogue owner.');
const result=await response.json() as {data:{user:{id:string}}};
const owner=result.data.user.id;
try {
 const designs=await catalogueRepository.list(owner);
 const ids=[...new Set(designs.filter(d=>!d.deletedAt).flatMap(d=>d.media.map(m=>m.id)))];
 if(ids.length!==4)throw new Error(`Expected exactly four referenced files; found ${ids.length}. No files were copied.`);
 const input=await Promise.all(ids.map(async id=>{
   if(!/^[a-f0-9-]{36}\.(png|jpg|webp|mp4|webm)$/.test(id))throw new Error('Unexpected media ID.');
   return {id,bytes:await readFile(path.resolve('data/catalogue-media',owner,id))};
 }));
 let copied=0;
 for(const item of input)if(await catalogueRepository.copyLocalMedia(owner,item.id,item.bytes))copied++;
 console.log(`Verified ${input.length} approved image files in PostgreSQL (${copied} newly copied).`);
} finally {await db.disconnect();}
