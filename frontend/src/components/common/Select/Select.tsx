import React, { SelectHTMLAttributes, forwardRef } from "react";
import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = "", id, children, ...props }, ref) => {
    const selectId = id || props.name;

    const selectClasses = [styles.select, error ? styles.hasError : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`select-group ${styles.group}`}>
        {label && (
          <label htmlFor={selectId} className={`select-label ${styles.label}`}>
            {label}
          </label>
        )}
        <select id={selectId} ref={ref} className={selectClasses} {...props}>
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className={`select-error ${styles.errorText}`}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
