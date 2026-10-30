"use client";

import React, { forwardRef } from "react";
import styles from "./Switch.module.css";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onChange,
      label,
      description,
      disabled = false,
      id,
      name,
      className = "",
    },
    ref
  ) => {
    const handleToggle = () => {
      if (!disabled) {
        onChange(!checked);
      }
    };

    return (
      <label
        htmlFor={id}
        className={`${styles.container} ${disabled ? styles.disabled : ""} ${className}`.trim()}
      >
        <button
          ref={ref}
          id={id}
          name={name}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          className={`${styles.track} ${checked ? styles.checked : ""}`}
        >
          <span className={styles.thumb} />
        </button>

        {(label || description) && (
          <div className={styles.textWrapper}>
            {label && <span className={styles.label}>{label}</span>}
            {description && (
              <span className={styles.description}>{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
