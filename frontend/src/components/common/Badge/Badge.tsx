import React, { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "outline";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  const variantClass = styles[variant] || styles.default;
  const sizeClass = styles[size] || styles.md;

  return (
    <span
      className={`badge ${styles.badge} ${variantClass} ${sizeClass} ${className}`.trim()}
    >
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
