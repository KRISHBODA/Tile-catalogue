import React, { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import styles from "./Card.module.css";

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  className = "",
  onClick,
}: CardProps) {
  const cardClasses = [
    styles.card,
    onClick ? styles.interactive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle || headerAction) && (
        <div className={`card-header ${styles.header}`}>
          <div className={styles.titleArea}>
            {title && <h3 className={`card-title ${styles.title}`}>{title}</h3>}
            {subtitle && (
              <p className={`card-subtitle ${styles.subtitle}`}>{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className={styles.headerAction}>{headerAction}</div>
          )}
        </div>
      )}
      <div className={`card-body ${styles.body}`}>{children}</div>
      {footer && <div className={`card-footer ${styles.footer}`}>{footer}</div>}
    </div>
  );
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  change,
  isPositive = true,
  subtext,
  className = "",
}: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles.statCard} ${className}`.trim()}>
      <div className={styles.statTop}>
        <span className={styles.statTitle}>{title}</span>
        {icon && <span className={styles.statIcon}>{icon}</span>}
      </div>
      <div className={styles.statValue}>{value}</div>
      {(change || subtext) && (
        <div className={styles.statBottom}>
          {change && (
            <span
              className={`${styles.trendBadge} ${isPositive ? styles.trendUp : styles.trendDown}`}
            >
              {isPositive ? (
                <ArrowUpRight size={12} strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={12} strokeWidth={2.5} />
              )}
              {change}
            </span>
          )}
          {subtext && <span className={styles.statNote}>{subtext}</span>}
        </div>
      )}
    </div>
  );
}
