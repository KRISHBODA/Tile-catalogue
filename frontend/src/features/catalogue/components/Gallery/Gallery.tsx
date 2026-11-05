'use client';
import {useEffect,useState,useRef} from 'react';
import Image from 'next/image';
import {X,ChevronLeft,ChevronRight,ImageOff} from 'lucide-react';
import {catalogueService} from '@/services/catalogueService';
import {ApiError} from '@/services/apiClient';
import {useTranslation} from '@/context';
import type {CatalogueMedia} from '../../types';
import {isVideo} from '../../utils/model';
import styles from '../Workspace/Workspace.module.css';
export function Asset({asset,large=false}:{asset:CatalogueMedia;large?:boolean}) {
 const [url,setUrl]=useState(''),[errorKey,setErrorKey]=useState(''),[visible,setVisible]=useState(large);const ref=useRef<HTMLSpanElement>(null);
 const {t}=useTranslation();
 useEffect(()=>{if(large||visible)return;const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'300px'});observer.observe(node);return()=>observer.disconnect();},[large,visible]);
 useEffect(()=>{if(!visible&&!large)return;let active=true;catalogueService.url(asset.id).then(u=>{if(active)setUrl(u);}).catch(error=>{if(active)setErrorKey(error instanceof ApiError&&error.statusCode===401?'catalogue.mediaSignIn':error instanceof ApiError&&error.statusCode===404?'catalogue.mediaMissing':'catalogue.mediaError');});return()=>{active=false;};},[asset.id,large,visible]);
 if(errorKey)return <span className={styles.mediaError} title={t(errorKey)}>{t(errorKey)}</span>;
 if(!url)return <span ref={ref} className={styles.placeholder}>{visible?t('common.loading'):null}</span>;
 return isVideo(asset)?<video src={url} controls={large} preload="metadata" playsInline className={large?styles.largeImage:styles.thumbImage}/>:<Image src={url} alt={asset.name} width={large?1600:220} height={large?1200:124} unoptimized className={large?styles.largeImage:styles.thumbImage}/>;
}
export function Thumb({assets,onOpen}:{assets:CatalogueMedia[];onOpen:()=>void}) {
 const {t}=useTranslation();
 return assets.length?<button type="button" className={styles.thumb} onClick={onOpen} aria-label={t('catalogue.openPhotos',{count:assets.length})}><Asset asset={assets[0]}/><span className={styles.photoCount}>{assets.length}</span></button>:<span className={styles.placeholder}><ImageOff size={20}/>{t('catalogue.noMedia')}</span>;
}
export function Gallery({assets,title,onClose}:{assets:CatalogueMedia[];title:string;onClose:()=>void}) {
 const [index,setIndex]=useState(0);const ref=useRef<HTMLDialogElement>(null);const {t}=useTranslation();
 const move=(step:number)=>setIndex(i=>(i+step+assets.length)%assets.length);
 useEffect(()=>{const el=ref.current;el?.showModal();return()=>el?.close();},[]);
 return <dialog ref={ref} className={styles.gallery} aria-label={title} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose();}} onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}}}>
 <header><strong>{title}</strong><button type="button" onClick={onClose} aria-label={t('common.close')}><X/></button></header>
 <div className={styles.imageStage}><Asset key={assets[index].id} asset={assets[index]} large/>{assets.length>1&&<><button className={styles.previous} onClick={()=>move(-1)} aria-label={t('common.previous')}><ChevronLeft/></button><button className={styles.next} onClick={()=>move(1)} aria-label={t('common.next')}><ChevronRight/></button></>}</div>
 <p role="status">{t('catalogue.photoCounter',{current:index+1,total:assets.length})}</p><div className={styles.thumbnails}>{assets.map((a,i)=><button key={a.id} aria-label={t('catalogue.showPhoto',{number:i+1})} aria-pressed={i===index} onClick={()=>setIndex(i)}><Asset asset={a}/></button>)}</div>
 </dialog>;
}
