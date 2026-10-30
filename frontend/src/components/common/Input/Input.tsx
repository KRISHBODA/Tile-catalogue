import React, { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { X, AlertCircle } from "lucide-react";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      className = "",
      id,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    const showClear = clearable && Boolean(value) && onClear;

    const inputClasses = [
      styles.input,
      error ? styles.hasError : "",
      leftIcon ? styles.hasLeftIcon : "",
      rightIcon || showClear ? styles.hasRightIcon : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`input-group ${styles.group}`}>
        {label && (
          <div className={styles.labelWrapper}>
            <label htmlFor={inputId} className={`input-label ${styles.label}`}>
              {label}
              {required && <span className={styles.required}>*</span>}
            </label>
          </div>
        )}
        <div className={`input-wrapper ${styles.wrapper}`}>
          {leftIcon && (
            <span className={`${styles.icon} ${styles.left}`} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            value={value}
            required={required}
            className={inputClasses}
            {...props}
          />
          {showClear ? (
            <span className={`${styles.icon} ${styles.right}`}>
              <button
                type="button"
                className={styles.clearButton}
                onClick={onClear}
                aria-label="Clear input"
              >
                <X size={15} />
              </button>
            </span>
          ) : (
            rightIcon && (
              <span className={`${styles.icon} ${styles.right}`} aria-hidden="true">
                {rightIcon}
              </span>
            )
          )}
        </div>
        {error && (
          <p className={`input-error ${styles.errorText}`} role="alert">
            <AlertCircle size={13} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className={`input-helper ${styles.helperText}`}>{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
