import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import { en } from "@/translations";
import { APP_ROUTES } from "@/constants";

export default async function Milestone({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!["builder", "history"].includes(section)) notFound();

  return (
    <div className="placeholder">
      <BookOpen size={36} />
      <span className="eyebrow">{en.catalogues.nextChapter}</span>
      <h1>
        Catalogue {section === "builder" ? "Builder" : "History"}
      </h1>
      <span className="badge">{en.catalogues.comingNext}</span>
      <p>
        {section === "builder"
          ? en.catalogues.builderDesc
          : en.catalogues.historyDesc}
        <br />
        {en.catalogues.reservedNotice}
      </p>
      <Link className="button primary" href={APP_ROUTES.PRODUCTS}>
        <ArrowLeft size={16} /> {en.catalogues.backToProducts}
      </Link>
      <small>{en.catalogues.outsideNotice}</small>
    </div>
  );
}
