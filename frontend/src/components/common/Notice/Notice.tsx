import React from "react";
import { X } from "lucide-react";
import styles from "./Notice.module.css";

export interface NoticeProps {
  type?: "info" | "error" | "success";
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Notice({ type = "info", message, onDismiss, className = "" }: NoticeProps) {
  if (!message) return null;

  const typeClass = styles[type] || "";

  return (
    <div
      className={`library-notice ${styles.notice} ${typeClass} ${className}`.trim()}
      role={type === "error" ? "alert" : "status"}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss message"
          className={styles.dismissButton}
          onClick={onDismiss}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
