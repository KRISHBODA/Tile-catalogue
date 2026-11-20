import { notFound } from "next/navigation";
import { CatalogueBuilder } from "@/features/catalogue-builder";
import { CatalogueHistory } from "@/features/catalogue-builder";

export default async function CatalogueSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "builder") return <CatalogueBuilder />;
  if (section === "history") return <CatalogueHistory />;
  notFound();
}
