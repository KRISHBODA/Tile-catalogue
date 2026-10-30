import React, { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      className = "",
      id,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    const selectClasses = [
      styles.select,
      error ? styles.hasError : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`select-group ${styles.group}`}>
        {label && (
          <div className={styles.labelWrapper}>
            <label htmlFor={selectId} className={styles.label}>
              {label}
              {required && <span className={styles.required}>*</span>}
            </label>
          </div>
        )}
        <div className={styles.wrapper}>
          <select id={selectId} ref={ref} required={required} className={selectClasses} {...props}>
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className={styles.chevron} aria-hidden="true">
            <ChevronDown size={16} />
          </span>
        </div>
        {error && (
          <p className={styles.errorText} role="alert">
            <AlertCircle size={13} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className={styles.helperText}>{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
