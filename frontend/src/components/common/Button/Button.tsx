import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost"
  | "subtle"
  | "clear";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon" | "iconSm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = styles[variant] || "";
    const sizeClass = styles[size] || styles.md;

    const combinedClasses = `button ${styles.button} ${variantClass} ${sizeClass} ${className}`.trim();

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          leftIcon && <span className={styles.iconWrapper}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={styles.iconWrapper}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
