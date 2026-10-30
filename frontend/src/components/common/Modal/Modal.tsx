"use client";

import React, { useEffect, ReactNode } from "react";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "../Button";
import { useTranslation } from "@/context";
import styles from "./Modal.module.css";

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  wide?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
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
  className = "",
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
      <div
        className={`modal-card ${styles.card} ${sizeClass} ${wide ? "modal-wide" : ""} ${className}`.trim()}
      >
        <div className={`modal-header ${styles.header}`}>
          <div className={styles.headerContent}>
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
            {description && (
              <p className={`modal-description ${styles.description}`}>
                {description}
              </p>
            )}
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

        {footer && (
          <div className={`modal-footer ${styles.footer}`}>{footer}</div>
        )}
      </div>
    </div>
  );
}

export interface ConfirmModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen = true,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const resolvedConfirmLabel = confirmLabel || (variant === "danger" ? t("common.delete") : t("common.confirm"));
  const resolvedCancelLabel = cancelLabel || t("common.cancel");

  const iconMap = {
    danger: <AlertCircle size={24} />,
    warning: <AlertTriangle size={24} />,
    info: <Info size={24} />,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="sm"
      busy={isLoading}
      footer={
        <>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {resolvedConfirmLabel}
          </Button>
        </>
      }
    >
      <div className={`${styles.confirmIconWrapper} ${styles[variant]}`}>
        {iconMap[variant]}
      </div>
      <h3 className={styles.title} style={{ marginBottom: "0.5rem" }}>
        {title}
      </h3>
      <p className={styles.description} style={{ color: "#475569" }}>
        {description}
      </p>
    </Modal>
  );
}
