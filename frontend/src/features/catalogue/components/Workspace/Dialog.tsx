'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
import {useTranslation} from '@/context';
import styles from './Workspace.module.css';
export function Dialog({title,onClose,children,footer,busy=false}:{title:string;onClose:()=>void;children:ReactNode;footer?:ReactNode;busy?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null);const {t}=useTranslation();
 useEffect(()=>{const node=ref.current;node?.showModal();return()=>node?.close();},[]);
 return <dialog ref={ref} className={`${styles.dialog} ${styles.workspace}`} aria-label={title} onCancel={e=>{e.preventDefault();e.stopPropagation();if(!busy)onClose();}}><header><h2>{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label={t('common.close')}><X size={20}/></button></header><div className={styles.dialogBody}>{children}</div>{footer&&<footer>{footer}</footer>}</dialog>;
}
