import React from "react";
import styles from "./LoadingSpinner.module.css";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", message, className = "" }: LoadingSpinnerProps) {
  const pixelSize = {
    sm: 16,
    md: 24,
    lg: 36,
  }[size];

  return (
    <div
      className={`loading-spinner-container ${styles.container} ${className}`.trim()}
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
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {message && <span className={`loading-message ${styles.message}`}>{message}</span>}
      <span className="sr-only">{message || "Loading..."}</span>
    </div>
  );
}
