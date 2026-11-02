import {mediaRoles} from '../types';
import type { CatalogueDesign, CatalogueMedia } from '../types';
export const textFields=['name','code','size','collection','surface','body','thickness','extraName','alternateName','bodyDetails','tags','colours','group','description','availableSize','availableCollection','availableSurface','availableBody','availableThickness','hsnCode','url360'] as const;
export const boolFields=['showInPdf','private','has360','bookmatch','border','borderShadow','background','inDisplay'] as const;
export const mainFields=['name','code','size','collection','surface','body','thickness','tags'] as const;
export const groups=['size','collection','surface','body','tags','thickness'] as const;
export const statuses=['Active','Inactive','Draft','Archived'];
export type TextField=typeof textFields[number];
export type BoolField=typeof boolFields[number];
export const defaultColumns=['tile-face','preview','name','code','size','collection','surface','body','thickness','faces','status'];
export const columnKeys=[...defaultColumns,...mediaRoles.filter(r=>!['tile-face','preview'].includes(r)),'extraName','alternateName','bodyDetails','tags','colours','group','has360','url360','availableSize','availableCollection','availableSurface','availableBody','availableThickness','hsnCode','showInPdf','private','bookmatch','border','borderShadow','background','inDisplay','createdAt','uploadedBy'];
export const blank=():CatalogueDesign=>({ ...Object.fromEntries(textFields.map(k=>[k,''])),...Object.fromEntries(boolFields.map(k=>[k,false])),id:'',revision:0,createdAt:'',updatedAt:'',uploadedBy:'',status:'Draft',size:'600 × 1200',thickness:'9',surface:'Matt',body:'Porcelain',media:[],variants:[] } as unknown as CatalogueDesign);
export function display(d:CatalogueDesign,key:string):string {
 if(key==='faces')return String(d.media.filter(m=>m.role==='tile-face').length);
 if(mediaRoles.includes(key as never))return String(d.media.filter(m=>m.role===key).length);
 const value=d[key as keyof CatalogueDesign];
 return typeof value==='string'?value:typeof value==='boolean'?String(value):'';
}
export function valid(d:CatalogueDesign) {
 const m=d.size.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(?:\s*mm)?$/i);
 return !!(d.name.trim()&&d.code.trim()&&d.collection.trim()&&d.surface.trim()&&m&&+m[1]>0&&+m[2]>0&&+m[1]<=10000&&+m[2]<=10000&&+d.thickness>0&&+d.thickness<=100);
}
export const variantFields = ['size','surface','body','thickness'] as const;
export function facetValues(d:CatalogueDesign,key:string):string[] {
 const value=display(d,key);
 if(variantFields.includes(key as never)) return [value,...d.variants.map(v=>v[key as keyof typeof v])].filter(Boolean);
 return ['tags','colours'].includes(key)?value.split(',').map(v=>v.trim()).filter(Boolean):[value].filter(Boolean);
}
export type Filters={ values:Record<string,string[]>; presence:Record<string,string>; sort:string };
export const emptyFilters=():Filters=>({values:{},presence:{},sort:'latest'});
export function matches(d:CatalogueDesign,filters:Filters,search='') {
 if(search&&!`${d.name} ${d.code} ${d.extraName} ${d.alternateName}`.toLowerCase().includes(search.toLowerCase()))return false;
 const variantFilters=Object.entries(filters.values).filter(([k,v])=>variantFields.includes(k as never)&&v.length);
 if(variantFilters.length&&![{size:d.size,surface:d.surface,body:d.body,thickness:d.thickness},...d.variants].some(spec=>variantFilters.every(([key,values])=>values.some(v=>spec[key as keyof typeof spec].toLowerCase()===v.toLowerCase()))))return false;
 for(const [key,values]of Object.entries(filters.values))if(values.length&&!variantFields.includes(key as never)&&!values.some(v=>facetValues(d,key).some(x=>x.toLowerCase()===v.toLowerCase())))return false;
 for(const [k,choice]of Object.entries(filters.presence))if(choice&&choice!=='all'){
  const actual=k.startsWith('media:')?d.media.some(m=>m.role===k.slice(6)):typeof d[k as keyof CatalogueDesign]==='boolean'?!!d[k as keyof CatalogueDesign]:!!display(d,k).trim();
  if(actual!==(choice==='yes'))return false;
 }
 return true;
}
export function sortDesigns(designs:CatalogueDesign[],sort:string) {return [...designs].sort((a,b)=>sort==='az'?a.name.localeCompare(b.name,undefined,{numeric:true}):sort==='za'?b.name.localeCompare(a.name,undefined,{numeric:true}):b.createdAt.localeCompare(a.createdAt));}
export const safeFileName=(s:string)=>s.replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,100)||'design';
export function saveBlob(blob:Blob,name:string) {const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function csv(designs:CatalogueDesign[],keys:string[],labels:string[]) {
 const quote=(v:string)=>'"'+(/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
 return '\ufeff'+[labels,...designs.map(d=>keys.map(k=>display(d,k)))].map(row=>row.map(quote).join(',')).join('\r\n');
}
export const isVideo=(m:CatalogueMedia)=>['live-video','social-video'].includes(m.role);
