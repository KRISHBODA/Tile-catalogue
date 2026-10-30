"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";
import { Check, Minus } from "lucide-react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      indeterminate = false,
      onChange,
      label,
      description,
      disabled = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const handleChange = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    return (
      <label
        htmlFor={checkboxId}
        className={`${styles.container} ${disabled ? styles.disabled : ""} ${className}`.trim()}
      >
        <span
          className={`${styles.box} ${checked ? styles.checked : ""} ${indeterminate ? styles.indeterminate : ""}`}
        >
          {indeterminate ? (
            <Minus size={12} strokeWidth={3} />
          ) : checked ? (
            <Check size={12} strokeWidth={3} />
          ) : null}
        </span>
        <input
          id={checkboxId}
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
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

Checkbox.displayName = "Checkbox";
