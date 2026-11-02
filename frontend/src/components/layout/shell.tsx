"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useTranslation } from "@/context";
import { LoadingSpinner } from "@/components/common";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./shell.module.css";

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore sidebar collapse state from storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Authentication Guard: Disallow entering without login
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && path !== "/login") {
        router.replace("/login");
      } else if (isAuthenticated && path === "/login") {
        router.replace("/products");
      }
    }
  }, [isLoading, isAuthenticated, path, router]);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("sidebar_collapsed", next ? "true" : "false");
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  // 1. Initial Auth Loading State
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg, #F5F3EE)",
        }}
      >
        <LoadingSpinner size="lg" message={t("common.loading")} />
      </div>
    );
  }

  // 2. Unauthenticated user on protected route: hold and redirect
  if (!isAuthenticated && path !== "/login") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg, #F5F3EE)",
        }}
      >
        <LoadingSpinner size="lg" message={t("common.loading")} />
      </div>
    );
  }

  // 3. For /login, render full clean view without navigation shell
  if (path === "/login") {
    return <>{children}</>;
  }

  return (
    <div className={styles.layoutContainer}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      {/* Modern Luxury Studio Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Shell Viewport */}
      <div
        className={`${styles.mainContent} ${isCollapsed ? styles.collapsed : ""}`}
      >
        {/* Modern Topbar with 3 Horizontal Lines Menu Toggle */}
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />

        <main id="main-content" className={`${styles.main} ${path === "/products" ? styles.productMain : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
