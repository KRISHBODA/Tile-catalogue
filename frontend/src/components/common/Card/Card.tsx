import React, { ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ title, subtitle, children, footer, className = "", onClick }: CardProps) {
  const cardClasses = [
    styles.card,
    onClick ? styles.interactive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <div className={`card-header ${styles.header}`}>
          {title && <h3 className={`card-title ${styles.title}`}>{title}</h3>}
          {subtitle && <p className={`card-subtitle ${styles.subtitle}`}>{subtitle}</p>}
        </div>
      )}
      <div className={`card-body ${styles.body}`}>{children}</div>
      {footer && <div className={`card-footer ${styles.footer}`}>{footer}</div>}
    </div>
  );
}
