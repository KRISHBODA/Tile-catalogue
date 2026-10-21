import React, { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "clear";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Look up scoped class names from CSS module
    const variantClass = variant !== "secondary" && styles[variant] ? styles[variant] : "";
    const sizeClass = size !== "md" && styles[size] ? styles[size] : "";

    // Retain global button class as fallback for existing global CSS while applying scoped styles
    const combinedClasses = `button ${styles.button} ${variantClass} ${sizeClass} ${className}`.trim();

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className={styles.spinner} />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
