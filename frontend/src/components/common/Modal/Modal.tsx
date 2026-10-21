"use client";

import React, { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  wide?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen = true,
  onClose,
  title,
  description,
  children,
  footer,
  busy = false,
  wide = false,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || busy) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const sizeKey = wide ? "lg" : maxWidth;
  const sizeClass = styles[sizeKey] || styles.md;

  return (
    <div
      className={`modal-backdrop ${styles.backdrop}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`modal-card ${styles.card} ${sizeClass} ${wide ? "modal-wide" : ""}`}>
        <div className={`modal-header ${styles.header}`}>
          <div>
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
            {description && <p className={`modal-description ${styles.description}`}>{description}</p>}
          </div>
          <button
            type="button"
            className={`modal-close ${styles.closeButton}`}
            disabled={busy}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`modal-body ${styles.body}`}>{children}</div>

        {footer && <div className={`modal-footer ${styles.footer}`}>{footer}</div>}
      </div>
    </div>
  );
}
