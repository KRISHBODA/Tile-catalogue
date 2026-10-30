"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/context";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = "",
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1 && !totalItems) return null;

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem =
    totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  const renderPages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === "...") {
        return (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            …
          </span>
        );
      }

      const pageNum = Number(page);
      const isActive = pageNum === currentPage;

      return (
        <button
          key={pageNum}
          type="button"
          onClick={() => onPageChange(pageNum)}
          className={`${styles.pageBtn} ${isActive ? styles.active : ""}`}
          aria-current={isActive ? "page" : undefined}
          aria-label={`${t("common.page")} ${pageNum}`}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <div className={`${styles.container} ${className}`.trim()} role="navigation" aria-label="Pagination">
      {totalItems !== undefined && startItem && endItem ? (
        <div className={styles.summary}>
          <span>{t("common.showing")}</span>
          <span className={styles.highlight}>{startItem}</span>
          <span>{t("common.to")}</span>
          <span className={styles.highlight}>{endItem}</span>
          <span>{t("common.of")}</span>
          <span className={styles.highlight}>{totalItems}</span>
          <span>{t("common.results")}</span>
        </div>
      ) : (
        <div />
      )}

      <div className={styles.controls}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={styles.pageBtn}
          aria-label={t("common.previous")}
        >
          <ChevronLeft size={16} />
        </button>

        <div className={styles.pageButtons}>{renderPages()}</div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={styles.pageBtn}
          aria-label={t("common.next")}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
