"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { useAuth, useTranslation } from "@/context";
import { Button } from "@/components/common";
import styles from "./Topbar.module.css";

export interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({ onToggleSidebar, isSidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const getPageTitle = (path: string): string => {
    if (path === "/products") return t("nav.productManager") || "Product Manager";
    if (path.startsWith("/catalogues/builder"))
      return t("nav.catalogueBuilder") || "Catalogue Builder";
    if (path.startsWith("/catalogues/history"))
      return t("nav.catalogueHistory") || "Catalogue History";
    return "Product Manager";
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        {/* Three Horizontal Lines Menu Toggle */}
        <button
          type="button"
          className={styles.hamburgerBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={!isSidebarCollapsed}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={19} />
        </button>

        {/* Breadcrumb Navigation matching screenshot: Workspace > Product Manager */}
        <nav className={styles.breadcrumbContainer} aria-label="Breadcrumb">
          <span className={styles.breadcrumbRoot}>{t("common.workspace")}</span>
          <ChevronRight size={13} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent}>{getPageTitle(pathname)}</span>
        </nav>
      </div>

      <div className={styles.rightSection}>
        {/* Database Status Indicator */}
        <div className={styles.dbStatusPill} title="TiDB Serverless PostgreSQL Online">
          <span className={styles.liveIndicator} />
          <span>TiDB Cloud</span>
        </div>

        {/* Super Admin Status Badge (No signout in top corner - signout is in left sidebar bottom) */}
        {isAuthenticated && user ? (
          <div className={styles.userProfileArea}>
            <span className={styles.superAdminBadge}>
              <span className={styles.badgeDot} />
              {user.role?.name || "SUPER_ADMIN"}
            </span>
            <span className={styles.userName}>{user.name || "Super Admin"}</span>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm">
              {t("auth.signInButton")}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
