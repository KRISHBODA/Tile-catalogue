"use client";

import React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { useTranslation } from "@/context";
import styles from "./Notice.module.css";

export type NoticeVariant = "info" | "success" | "warning" | "error";

export interface NoticeProps {
  type?: NoticeVariant;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const ICONS: Record<NoticeVariant, React.ComponentType<{ size?: number; className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function Notice({
  type = "info",
  title,
  message,
  children,
  onDismiss,
  action,
  className = "",
}: NoticeProps) {
  const { t } = useTranslation();
  if (!message && !children && !title) return null;

  const IconComponent = ICONS[type] || Info;
  const typeClass = styles[type] || styles.info;

  return (
    <div
      className={`library-notice ${styles.notice} ${typeClass} ${className}`.trim()}
      role={type === "error" ? "alert" : "status"}
    >
      <div className={styles.iconWrapper}>
        <IconComponent size={18} className={styles.icon} />
      </div>

      <div className={styles.content}>
        {title && <h5 className={styles.title}>{title}</h5>}
        {message && <p className={styles.message}>{message}</p>}
        {children}
      </div>

      {action && <div className={styles.action}>{action}</div>}

      {onDismiss && (
        <button
          type="button"
          aria-label={t("common.dismiss")}
          className={styles.dismissButton}
          onClick={onDismiss}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
