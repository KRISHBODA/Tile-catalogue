'use client';
import {useState} from 'react';
import {zipSync} from 'fflate';
import {useTranslation} from '@/context';
import {catalogueService} from '@/services/catalogueService';
import type {CatalogueDesign} from '../../types';
import {mediaRoles} from '../../types';
import {columnKeys,csv,saveBlob,safeFileName} from '../../utils/model';
import {Dialog} from '../Workspace/Dialog';
import styles from '../Workspace/Workspace.module.css';
export type ActionMode='columns'|'export'|'download'|'delete';
export function Actions({mode,designs,columns,onColumns,onSave,onClose}:{mode:ActionMode;designs:CatalogueDesign[];columns:string[];onColumns:(c:string[])=>void;onSave:(d:CatalogueDesign[])=>Promise<void>;onClose:()=>void}) {
 const {t}=useTranslation();const [keys,setKeys]=useState<string[]>(mode==='columns'?columns:mode==='download'?['tile-face','preview']:mode==='delete'?['design']:['name','size','collection','surface','body','thickness']);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const choices=mode==='download'?[...mediaRoles]:mode==='delete'?['design','preview','tags','body','360','live-image','live-video']:columnKeys;
 const toggle=(key:string)=>setKeys(v=>mode==='delete'?[key]:v.includes(key)?v.filter(x=>x!==key):[...v,key]);
 const label=(key:string)=>mediaRoles.includes(key as never)?t('catalogue.roles.'+key):t('catalogue.fields.'+key);
 async function run(){setBusy(true);setError('');try{
  if(mode==='columns'){onColumns(['name',...keys.filter(k=>k!=='name')]);onClose();}
  if(mode==='export'){saveBlob(new Blob([csv(designs,keys,keys.map(label))],{type:'text/csv;charset=utf-8'}),'tile-catalogue.csv');onClose();}
  if(mode==='download'){
   const files:Record<string,Uint8Array>={};let total=0;
   for(const d of designs)for(const [index,m]of d.media.entries())if(keys.includes(m.role)){
    const blob=await catalogueService.blob(m.id);total+=blob.size;if(total>200*1024*1024)throw new Error(t('catalogue.downloadLimit'));
    files[`${safeFileName(`${d.name}-${d.id}`)}/${m.role}/${index+1}-${safeFileName(m.name)}`]=new Uint8Array(await blob.arrayBuffer());
   }
   if(!Object.keys(files).length)throw new Error(t('catalogue.noDownload'));
   saveBlob(new Blob([new Uint8Array(zipSync(files,{level:0}))],{type:'application/zip'}),'tile-catalogue-media.zip');onClose();
  }
  if(mode==='delete'){
   const target=keys[0];
   const changed=designs.map(d=>target==='design'?{...d,deletedAt:new Date().toISOString()}:target==='tags'||target==='body'?{...d,[target]:''}:target==='360'?{...d,has360:false,url360:'',media:d.media.filter(m=>m.role!=='360')}:{...d,media:d.media.filter(m=>m.role!==target)});
   await onSave(changed);onClose();
  }
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <Dialog title={t('catalogue.actions.'+mode)} onClose={onClose} busy={busy} footer={<><span className={styles.count}>{mode!=='columns'&&t('catalogue.selectedCount',{count:designs.length})}</span><button disabled={busy} onClick={onClose}>{t('common.cancel')}</button><button className={styles.primary} disabled={busy||!keys.length} onClick={()=>void run()}>{t(busy?'catalogue.working':'catalogue.execute.'+mode)}</button></>}>
 {error&&<div role="alert" className={styles.error}>{error}</div>}{mode==='delete'&&<p>{t(keys[0]==='design'?'catalogue.trashHelp':'catalogue.clearHelp')}</p>}{mode==='export'&&<p className={styles.subtle}>{t('catalogue.exportHelp')}</p>}<div className={styles.options}>{choices.map(key=><label key={key}><input type={mode==='delete'?'radio':'checkbox'} name="action-choice" checked={keys.includes(key)} disabled={mode==='columns'&&key==='name'} onChange={()=>toggle(key)}/>{label(key)}</label>)}</div>
 </Dialog>;
}
