import React, { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    const inputClasses = [
      styles.input,
      error ? styles.hasError : "",
      leftIcon ? styles.hasLeftIcon : "",
      rightIcon ? styles.hasRightIcon : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`input-group ${styles.group}`}>
        {label && (
          <label htmlFor={inputId} className={`input-label ${styles.label}`}>
            {label}
          </label>
        )}
        <div className={`input-wrapper ${styles.wrapper}`}>
          {leftIcon && <span className={`${styles.icon} ${styles.left}`}>{leftIcon}</span>}
          <input id={inputId} ref={ref} className={inputClasses} {...props} />
          {rightIcon && <span className={`${styles.icon} ${styles.right}`}>{rightIcon}</span>}
        </div>
        {error && <p className={`input-error ${styles.errorText}`}>{error}</p>}
        {!error && helperText && <p className={`input-helper ${styles.helperText}`}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
