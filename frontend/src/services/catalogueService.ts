import { apiClient } from './apiClient';
import type { CatalogueDesign, CatalogueOption } from '@/features/catalogue';
const base='/catalogue';
const blobs=new Map<string,Promise<string>>();
function mediaResponse(id:string) { return apiClient.request<Blob>(base+'/media/'+encodeURIComponent(id),{method:'GET',responseType:'blob'}); }
export const catalogueService={
 list:()=>apiClient.get<CatalogueDesign[]>(base),
 save:(designs:Partial<CatalogueDesign>[])=>apiClient.post<CatalogueDesign[]>(base,{designs}),
 options:()=>apiClient.get<CatalogueOption[]>(base+'/options'),
 option:(option:Partial<CatalogueOption>,remove=false)=>apiClient.post<CatalogueOption[]>(base+'/options',{option,remove}),
 async upload(file:File) {
   const result=await apiClient.request<{id:string}>(base+'/media',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});
   return result.id;
 },
 blob:mediaResponse,
 url(id:string) { if(!blobs.has(id)) blobs.set(id,mediaResponse(id).then(blob=>URL.createObjectURL(blob)).catch(e=>{blobs.delete(id);throw e;}));return blobs.get(id)!; },
 clearMedia() { blobs.forEach(p=>void p.then(URL.revokeObjectURL).catch(()=>{}));blobs.clear(); },
};
