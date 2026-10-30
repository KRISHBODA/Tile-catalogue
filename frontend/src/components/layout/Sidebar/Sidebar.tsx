"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid2X2,
  BookOpen,
  History,
  Layers,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth, useTranslation } from "@/context";
import styles from "./Sidebar.module.css";

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const path = usePathname();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: t("nav.productManager") || "Product Manager",
      href: "/products",
      icon: Grid2X2,
      badge: null,
    },
    {
      label: t("nav.catalogueBuilder") || "Catalogue Builder",
      href: "/catalogues/builder",
      icon: Layers,
      badge: "SOON",
    },
    {
      label: t("nav.catalogueHistory") || "Catalogue History",
      href: "/catalogues/history",
      icon: History,
      badge: "SOON",
    },
  ];

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SA";

  return (
    <>
      {isMobileOpen && <div className={styles.overlay} onClick={onCloseMobile} />}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${
          isMobileOpen ? styles.mobileOpen : ""
        }`}
      >
        {/* Header / Brand with 3-Horizontal Lines Menu Button */}
        <div
          className={`${styles.header} ${isCollapsed ? styles.headerCollapsed : ""}`}
        >
          {isCollapsed ? (
            <button
              type="button"
              className={styles.hamburgerBtnRail}
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          ) : (
            <>
              <Link
                href="/products"
                className={styles.brand}
                onClick={onCloseMobile}
              >
                <div className={styles.logoIcon}>
                  <Layers size={26} />
                </div>

                <div className={styles.brandText}>
                  <span className={styles.brandName}>Tile Catalogue</span>
                  <span className={styles.brandSub}>THE MATERIAL WORKSPACE</span>
                </div>
              </Link>

              {/* 3 Horizontal Lines Toggle Button inside Left Sidebar Header */}
              <button
                type="button"
                className={styles.hamburgerBtn}
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <Menu size={18} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Section */}
        <div className={styles.navScroll}>
          <div className={styles.sectionLabel}>
            {isCollapsed ? "•••" : "WORKSPACE"}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = path === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>
                  <Icon size={20} />
                </span>

                {!isCollapsed && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge && (
                      <span className={styles.badgeSoon}>{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer: User Profile + Bottom Left Sign Out Button */}
        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              <span>{userInitials}</span>
            </div>

            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user?.name || "Super Admin"}
                </span>
                <span className={styles.userRole}>
                  {user?.role?.name || "SUPER ADMIN"}
                </span>
              </div>
            )}
          </div>

          {/* Left-Bottom Sign Out Button */}
          <button
            type="button"
            className={styles.signOutButton}
            onClick={logout}
            aria-label={t("auth.logout")}
            title={t("auth.logout")}
          >
            <LogOut size={16} />
            {!isCollapsed && (
              <span className={styles.signOutText}>{t("auth.logout")}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
