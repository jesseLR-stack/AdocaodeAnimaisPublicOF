import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page, total, pageSize, basePath, searchParams,
}: { page: number; total: number; pageSize: number; basePath: string; searchParams: Record<string, string | string[] | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && k !== "pagina") sp.set(k, v);
    if (p > 1) sp.set("pagina", String(p));
    return `${basePath}${sp.size ? `?${sp}` : ""}`;
  };
  const window = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const item = "flex size-11 items-center justify-center rounded-full text-sm font-semibold transition";
  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "bg-white ring-1 ring-border hover:bg-sage-50")} aria-label="Página anterior"><ChevronLeft className="size-5" /></Link>
      ) : <span className={cn(item, "opacity-40")}><ChevronLeft className="size-5" /></span>}
      {window.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - window[i - 1]! > 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-sage-600 text-white" : "bg-white ring-1 ring-border hover:bg-sage-50")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(item, "bg-white ring-1 ring-border hover:bg-sage-50")} aria-label="Próxima página"><ChevronRight className="size-5" /></Link>
      ) : <span className={cn(item, "opacity-40")}><ChevronRight className="size-5" /></span>}
    </nav>
  );
}
