import React, { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantClass = variant !== "default" && styles[variant] ? styles[variant] : "";
  return (
    <span className={`badge ${styles.badge} ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
