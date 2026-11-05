import { apiClient } from './apiClient';
import type { CatalogueDesign, CatalogueOption } from '@/features/catalogue';
const base='/catalogue';
const blobs=new Map<string,Promise<string>>();
async function mediaResponse(id:string) {
 const path=base+'/media/'+encodeURIComponent(id);
 const info=await apiClient.get<{size:number;chunkSize:number}>(path+'/info');
 const parts:Blob[]=[];
 for(let index=0;index<Math.ceil(info.size/info.chunkSize);index++)parts.push(await apiClient.request<Blob>(path+'/parts/'+index,{method:'GET',responseType:'blob',timeoutMs:60000}));
 return new Blob(parts,{type:parts[0]?.type||'application/octet-stream'});
}
export const catalogueService={
 list:()=>apiClient.get<CatalogueDesign[]>(base),
 save:(designs:Partial<CatalogueDesign>[])=>apiClient.post<CatalogueDesign[]>(base,{designs}),
 options:()=>apiClient.get<CatalogueOption[]>(base+'/options'),
 option:(option:Partial<CatalogueOption>,remove=false)=>apiClient.post<CatalogueOption[]>(base+'/options',{option,remove}),
 async upload(file:File) {
   const chunkSize=3*1024*1024, upload=crypto.randomUUID(),count=Math.ceil(file.size/chunkSize);
   for(let index=0;index<count;index++)await apiClient.request(base+'/media/uploads/'+upload+'/'+index,{method:'POST',timeoutMs:60000,headers:{'Content-Type':'application/octet-stream'},body:file.slice(index*chunkSize,(index+1)*chunkSize)});
   const result=await apiClient.request<{id:string}>(base+'/media/uploads/'+upload+'/finish',{method:'POST',timeoutMs:180000,body:JSON.stringify({count,size:file.size})});
   return result.id;
 },
 blob:mediaResponse,
 url(id:string) { if(!blobs.has(id)) blobs.set(id,mediaResponse(id).then(blob=>URL.createObjectURL(blob)).catch(e=>{blobs.delete(id);throw e;}));return blobs.get(id)!; },
 clearMedia() { blobs.forEach(p=>void p.then(URL.revokeObjectURL).catch(()=>{}));blobs.clear(); },
};
