import React, { CSSProperties } from "react";
import styles from "./LoadingSpinner.module.css";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerColor = "primary" | "neutral" | "white";

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  message?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 44,
};

const strokeMap: Record<SpinnerSize, number> = {
  xs: 3,
  sm: 3,
  md: 2.75,
  lg: 2.5,
  xl: 2.25,
};

export function LoadingSpinner({
  size = "md",
  color = "neutral",
  message,
  className = "",
}: LoadingSpinnerProps) {
  const pixelSize = sizeMap[size];
  const strokeWidth = strokeMap[size];
  const colorClass = styles[color] || styles.neutral;

  return (
    <div
      className={`loading-spinner-container ${styles.container} ${colorClass} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <svg
        className={styles.spinner}
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="9.5"
          strokeWidth={strokeWidth}
        />
        <path
          className={styles.indicator}
          d="M12 2.5A9.5 9.5 0 0 1 21.5 12"
          strokeWidth={strokeWidth}
        />
      </svg>
      {message && <span className={styles.message}>{message}</span>}
      <span className="sr-only">{message || "Loading..."}</span>
    </div>
  );
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  circle = false,
  className = "",
  style = {},
}: SkeletonProps) {
  const customStyles: CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  return (
    <span
      className={`${styles.skeleton} ${circle ? styles.skeletonCircle : ""} ${className}`.trim()}
      style={customStyles}
      aria-hidden="true"
    />
  );
}

export interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className={styles.overlay} role="alert" aria-busy="true">
      <LoadingSpinner size="xl" color="primary" />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
