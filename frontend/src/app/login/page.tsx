import type { Metadata } from "next";
import { AdminLogin } from "@/features/auth";

export const metadata: Metadata = {
  title: "Super Admin Portal — Tile Catalogue",
  description: "Enterprise administration portal for the Tile Catalogue Studio.",
};

export default function LoginPage() {
  return <AdminLogin />;
}
