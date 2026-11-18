import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow, title, description, href, linkLabel = "Ver todos",
}: { eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-sm font-bold tracking-wider text-apricot-500 uppercase">{eyebrow}</p>}
        <h2 className="mt-1 text-3xl font-semibold text-balance text-sage-900 sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 font-semibold text-sage-700 hover:text-sage-900">
          {linkLabel} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
