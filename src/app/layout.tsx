import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/layout/shell";
export const metadata: Metadata = {
  title: "Tile Catalogue — Product workspace",
  description: "A local tile product management foundation.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
