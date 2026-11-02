import {unzipSync} from 'fflate';
import type {MediaRole} from '../types';
export interface ImportItem {name:string;surface:string;files:{file:File;role:MediaRole}[];}
const roles:Record<string,MediaRole>={preview:'preview',previews:'preview',ambience:'preview',live_photo:'live-image',live_image:'live-image',live_video:'live-video',channel:'channel',closeup:'closeup','360':'360',social_image:'social-image',social_video:'social-video','3d':'3d'};
const supported=/\.(png|jpe?g|webp|mp4|webm)$/i;
export async function prepareImport(files:File[]):Promise<{items:ImportItem[];ignored:number}> {
 const entries:{path:string;file:File}[]=[];let total=0,ignored=0;
 for(const file of files) {
  if(/\.zip$/i.test(file.name)) {
   if(file.size>100*1024*1024)throw new Error('IMPORT_LIMIT');
   let count=0;
   const data=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter(info){
    if(!supported.test(info.name)||info.name.includes('__MACOSX/')){if(!info.name.endsWith('/'))ignored++;return false;}
    total+=info.originalSize;count++;
    if(count>500||total>200*1024*1024||info.originalSize>50*1024*1024)throw new Error('IMPORT_LIMIT');return true;
   }});
   for(const [name,bytes]of Object.entries(data))entries.push({path:name,file:new File([new Uint8Array(bytes)],name.split('/').pop()!)});
  }else if(supported.test(file.name)){total+=file.size;entries.push({path:file.webkitRelativePath||file.name,file});}else ignored++;
 }
 if(entries.length>500||total>200*1024*1024)throw new Error('IMPORT_LIMIT');
 const grouped=new Map<string,ImportItem>();
 for(const {path,file}of entries) {
  const parts=path.split('/').filter(Boolean);if(parts.some(s=>s==='..'||s.startsWith('.'))) {ignored++;continue;}
  let parent=parts.length-2;
  let role:MediaRole='tile-face';
  if(parent>=0&&roles[parts[parent].toLowerCase()]){role=roles[parts[parent].toLowerCase()];parent--;}
  if(/\.(mp4|webm)$/i.test(file.name))role=role==='social-video'?'social-video':'live-video';
  const name=parent>=0?parts[parent]:file.name.replace(/\.[^.]+$/,'').replace(/[_-](?:face[_-]?)?\d+$/i,'');
  const surface=parent>0?parts[parent-1]:'';
  const key=name.toLowerCase();
  if(!grouped.has(key))grouped.set(key,{name,surface,files:[]});
  grouped.get(key)!.files.push({file,role});
 }
 return {items:[...grouped.values()],ignored};
}
