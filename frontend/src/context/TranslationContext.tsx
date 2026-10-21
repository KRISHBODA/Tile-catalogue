"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { en, Locale, translations, TranslationKey } from "../translations";

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const value = useMemo(() => {
    const currentDict = translations[locale] || en;

    const t = (key: TranslationKey | string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = currentDict;

      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = result[k];
        } else {
          return key; // fallback to key itself if not found
        }
      }

      if (typeof result !== "string") {
        return key;
      }

      // Replace template params e.g. {count}
      if (params) {
        return Object.entries(params).reduce(
          (acc, [paramKey, paramValue]) =>
            acc.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue)),
          result
        );
      }

      return result;
    };

    return {
      locale,
      setLocale,
      t,
    };
  }, [locale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
