import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
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
      <span className="eyebrow">THE NEXT CHAPTER</span>
      <h1>Catalogue {section === "builder" ? "Builder" : "History"}</h1>
      <span className="badge">Coming next</span>
      <p>
        {section === "builder"
          ? "Compose branded catalogues from your product library."
          : "A home for catalogue drafts and generated editions."}
        <br />
        This destination is reserved for a future milestone.
      </p>
      <Link className="button primary" href="/products">
        <ArrowLeft size={16} /> Back to products
      </Link>
      <small>
        PDF generation, uploads and storage are outside this foundation.
      </small>
    </div>
  );
}
