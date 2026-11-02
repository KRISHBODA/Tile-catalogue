'use client';
import {useState,type InputHTMLAttributes} from 'react';
import {useTranslation} from '@/context';
import {catalogueService} from '@/services/catalogueService';
import type {CatalogueDesign,CatalogueOption} from '../../types';
import {blank,groups,valid} from '../../utils/model';
import {prepareImport,type ImportItem} from '../../utils/import';
import {Dialog} from '../Workspace/Dialog';
import styles from '../Workspace/Workspace.module.css';
export function BatchImport({designs,options,onSaved,onClose}:{designs:CatalogueDesign[];options:CatalogueOption[];onSaved:(d:CatalogueDesign[])=>void;onClose:()=>void}) {
 const {t}=useTranslation();const [items,setItems]=useState<ImportItem[]>([]),[defaults,setDefaults]=useState(blank),[ignored,setIgnored]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState(''),[duplicate,setDuplicate]=useState('skip');
 async function stage(files:File[]) {setBusy(true);setError('');try{const r=await prepareImport(files);if(r.items.length>100)throw new Error('IMPORT_LIMIT');setItems(r.items);setIgnored(r.ignored);}catch(e){setError((e as Error).message==='IMPORT_LIMIT'?t('catalogue.importLimit'):(e as Error).message);}finally{setBusy(false);}}
 const existing=(name:string)=>designs.find(d=>d.code.toLowerCase()===name.toLowerCase()||d.name.toLowerCase()===name.toLowerCase());
 async function run() {setBusy(true);setError('');try {
  if(!valid({...defaults,name:'import',code:'import'}))throw new Error(t('catalogue.invalid'));
  const pending:CatalogueDesign[]=[];let done=0;
  const targets=items.filter(item=>!existing(item.name)?.deletedAt&&!(existing(item.name)&&duplicate==='skip'));
  for(const item of targets){const old=existing(item.name);const d=old?structuredClone(old):{...structuredClone(defaults),name:item.name,code:item.name};
   if(old&&old.deletedAt)continue;
   for(const entry of item.files){setProgress(t('catalogue.importProgress',{current:++done,total:targets.reduce((n,i)=>n+i.files.length,0),name:item.name}));const id=await catalogueService.upload(entry.file);d.media.push({id,role:entry.role,name:entry.file.name});}
   pending.push(d);
  }
  if(!pending.length){setProgress(t('catalogue.allSkipped'));return;}
  const saved=await catalogueService.save(pending);onSaved(saved);setProgress(t('catalogue.importComplete',{count:saved.length}));setItems([]);
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <Dialog title={t('catalogue.importTitle')} onClose={onClose} busy={busy} footer={<><span className={styles.count}>{progress}</span><button disabled={busy} onClick={onClose}>{t('common.close')}</button><button className={styles.primary} disabled={busy||!items.length} onClick={()=>void run()}>{t('catalogue.importNow')}</button></>}>
 {error&&<div role="alert" className={styles.error}>{error}</div>}<p>{t('catalogue.folderHelp')}</p><p className={styles.subtle}>{t('catalogue.importLimit')}</p>
 <div className={styles.fieldGrid}>{groups.map(key=><label key={key}>{t('catalogue.fields.'+key)}<input value={defaults[key]} list={'import-'+key} onChange={e=>setDefaults({...defaults,[key]:e.target.value})}/><datalist id={'import-'+key}>{options.filter(o=>o.group===key).map(o=><option key={o.id} value={o.value}/>)}</datalist></label>)}<label>{t('catalogue.duplicates')}<select value={duplicate} onChange={e=>setDuplicate(e.target.value)}><option value="skip">{t('catalogue.skipExisting')}</option><option value="append">{t('catalogue.appendMedia')}</option></select></label><label><input type="checkbox" checked={defaults.bookmatch} onChange={e=>setDefaults({...defaults,bookmatch:e.target.checked})}/>{t('catalogue.fields.bookmatch')}</label></div>
 <div className={styles.upload} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)void stage(Array.from(e.dataTransfer.files));}}><label>{t('catalogue.chooseFiles')}<input type="file" multiple disabled={busy} accept=".zip,.jpg,.jpeg,.png,.webp,.mp4,.webm" onChange={e=>{void stage(Array.from(e.target.files||[]));e.target.value='';}}/></label><label>{t('catalogue.chooseFolder')}<input type="file" {...({webkitdirectory:'',directory:''} as InputHTMLAttributes<HTMLInputElement>)} multiple disabled={busy} onChange={e=>{void stage(Array.from(e.target.files||[]));e.target.value='';}}/></label></div>
 <p role="status">{t('catalogue.importReview',{count:items.length,ignored})}</p>
 {!!items.length&&<table className={styles.importTable}><thead><tr><th>{t('catalogue.fields.name')}</th><th>{t('catalogue.files')}</th><th>{t('catalogue.result')}</th></tr></thead><tbody>{items.map(i=><tr key={i.name}><td>{i.name}</td><td>{i.files.length}</td><td>{t(existing(i.name)?duplicate==='skip'||existing(i.name)?.deletedAt?'catalogue.willSkip':'catalogue.willAppend':'catalogue.willCreate')}</td></tr>)}</tbody></table>}
 </Dialog>;
}
