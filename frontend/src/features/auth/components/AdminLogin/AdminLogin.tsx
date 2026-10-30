"use client";

import React from "react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Layers, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/context";
import { Button, Input, Checkbox, Notice } from "@/components/common";
import { useLogin } from "../../hooks/useLogin";
import styles from "./AdminLogin.module.css";

export function AdminLogin() {
  const { t } = useTranslation();
  const {
    form,
    errors,
    errorMessage,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleInputChange,
    fillDemoCredentials,
    handleSubmit,
  } = useLogin();

  return (
    <div className={styles.page}>
      <div className={styles.ambientGlow} />

      <div className={styles.cardContainer}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.brandIcon}>
              <Layers size={24} />
            </div>

            <div className={styles.brandBadge}>
              <span className={styles.brandDot} />
              <span>{t("auth.badgeLabel")}</span>
            </div>

            <div className={styles.titleArea}>
              <h1 className={styles.title}>{t("auth.signInTitle")}</h1>
              <p className={styles.subtitle}>{t("auth.signInSubtitle")}</p>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <Notice
              type="error"
              message={errorMessage}
            />
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Input
              type="email"
              label={t("auth.emailLabel")}
              placeholder={t("auth.emailPlaceholder")}
              value={form.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={errors.email}
              required
              leftIcon={<Mail size={16} />}
              autoComplete="email"
              autoFocus
            />

            <Input
              type={showPassword ? "text" : "password"}
              label={t("auth.passwordLabel")}
              placeholder={t("auth.passwordPlaceholder")}
              value={form.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={errors.password}
              required
              leftIcon={<Lock size={16} />}
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className={styles.optionsRow}>
              <Checkbox
                checked={form.rememberMe}
                onChange={(checked) => handleInputChange("rememberMe", checked)}
                label={t("auth.rememberMe")}
              />

              <button
                type="button"
                className={styles.demoLink}
                onClick={fillDemoCredentials}
              >
                {t("auth.demoHint")}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck size={18} />}
              className={styles.submitBtn}
            >
              {isSubmitting ? t("auth.authenticating") : t("auth.signInButton")}
            </Button>
          </form>

          {/* Security Guarantee Footer */}
          <div className={styles.securityFooter}>
            <ShieldAlert size={14} className={styles.securityIcon} />
            <span>{t("auth.securityFooter")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
