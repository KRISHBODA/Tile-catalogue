import React, { TextareaHTMLAttributes, forwardRef } from "react";
import { AlertCircle } from "lucide-react";
import styles from "./Textarea.module.css";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      className = "",
      id,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name;
    const currentLength = typeof value === "string" ? value.length : 0;

    const textareaClasses = [
      styles.textarea,
      error ? styles.hasError : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`textarea-group ${styles.group}`}>
        {(label || (showCount && maxLength)) && (
          <div className={styles.labelWrapper}>
            {label && (
              <label htmlFor={textareaId} className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
              </label>
            )}
            {showCount && maxLength && (
              <span className={styles.charCount}>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          required={required}
          className={textareaClasses}
          {...props}
        />
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

Textarea.displayName = "Textarea";
