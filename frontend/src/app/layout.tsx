import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/layout/shell";
import { TranslationProvider, AuthProvider } from "@/context";

export const metadata: Metadata = {
  title: "Tile Catalogue — Product workspace",
  description: "A production-grade tile product management foundation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TranslationProvider defaultLocale="en">
          <AuthProvider>
            <Shell>{children}</Shell>
          </AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
