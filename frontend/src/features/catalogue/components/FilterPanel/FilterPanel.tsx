'use client';
import {useState} from 'react';
import {useTranslation} from '@/context';
import type {CatalogueDesign} from '../../types';
import {mediaRoles} from '../../types';
import {facetValues,emptyFilters,matches,type Filters} from '../../utils/model';
import {Dialog} from '../Workspace/Dialog';
import styles from '../Workspace/Workspace.module.css';
export function FilterPanel({designs,filters,searchText,onApply,onClose}:{designs:CatalogueDesign[];filters:Filters;searchText:string;onApply:(v:Filters)=>void;onClose:()=>void}) {
 const [draft,setDraft]=useState(()=>structuredClone(filters));const {t}=useTranslation();const [search,setSearch]=useState<Record<string,string>>({});
 const keys=['size','collection','surface','body','tags','thickness','extraName','colours','status'];
 const extra=['showInPdf','private','has360',...mediaRoles.map(r=>'media:'+r),'availableSize','availableCollection','availableSurface','availableBody','availableThickness','inDisplay'];
 const toggle=(key:string,value:string)=>setDraft(d=>({...d,values:{...d.values,[key]:(d.values[key]||[]).includes(value)?d.values[key].filter(v=>v!==value):[...(d.values[key]||[]),value]}}));
 return <Dialog title={t('catalogue.filters')} onClose={onClose} footer={<><span className={styles.count}>{t('catalogue.matchCount',{count:designs.filter(d=>matches(d,draft,searchText)).length})}</span><button onClick={()=>setDraft(emptyFilters())}>{t('catalogue.clearFilters')}</button><button className={styles.primary} onClick={()=>onApply(draft)}>{t('catalogue.applyFilters')}</button></>}><div className={styles.filters}>{keys.map(key=>{
 const values=[...new Set(designs.flatMap(d=>facetValues(d,key)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 return <section className={styles.list} key={key}><h3>{t('catalogue.fields.'+key)}</h3><input type="search" aria-label={t('catalogue.searchOption',{group:t('catalogue.fields.'+key)})} placeholder={t('common.search')} value={search[key]||''} onChange={e=>setSearch({...search,[key]:e.target.value})}/><div className={styles.listValues}>{values.filter(v=>v.toLowerCase().includes((search[key]||'').toLowerCase())).map(value=><button key={value} aria-pressed={draft.values[key]?.includes(value)||false} onClick={()=>toggle(key,value)}>{value}</button>)}</div></section>;
 })}<section className={styles.list}><h3>{t('catalogue.extraFilters')}</h3><div className={styles.listValues}>{extra.map(key=><label key={key}>{t(key.startsWith('media:')?'catalogue.roles.'+key.slice(6):'catalogue.fields.'+key)}<select aria-label={t('catalogue.presence',{field:t(key.startsWith('media:')?'catalogue.roles.'+key.slice(6):'catalogue.fields.'+key)})} value={draft.presence[key]||'all'} onChange={e=>setDraft({...draft,presence:{...draft.presence,[key]:e.target.value}})}>{['all','yes','no'].map(v=><option key={v} value={v}>{t('common.'+v)}</option>)}</select></label>)}</div></section></div></Dialog>;
}
