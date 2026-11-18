"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { NativeSelect } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SORT_OPTIONS } from "@/lib/constants";
import { useCatalogParams } from "./use-catalog-params";
import { CatalogFilters } from "./catalog-filters";

const FILTER_KEYS = ["especie", "idade", "sexo", "porte", "raca", "uf", "cidade", "ref", "castrado", "vacinado", "especiais"];

export function CatalogToolbar({ total, userCity }: { total: number; userCity?: { id: number; uf: string } | null }) {
  const { params, update, pending } = useCatalogParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q: q.trim() || null });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="catalog-q" className="sr-only">Buscar</label>
          <input
            id="catalog-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, raça ou característica…"
            className="h-12 w-full rounded-2xl border-2 border-input bg-white pr-10 pl-12 text-[15px] outline-none focus-visible:border-sage-400 focus-visible:ring-4 focus-visible:ring-sage-200/60"
          />
          {pending ? (
            <Loader2 className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-sage-500" aria-label="Carregando" />
          ) : q ? (
            <button type="button" onClick={() => setQ("")} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-sage-50" aria-label="Limpar busca">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 rounded-2xl lg:hidden" aria-label="Abrir filtros">
              <SlidersHorizontal className="size-5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-apricot-500 text-[11px] text-white">{activeCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="px-5 pt-6">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription className="sr-only">Refine a busca de animais</SheetDescription>
            <CatalogFilters userCity={userCity} />
            <div className="sticky bottom-0 -mx-5 border-t border-border bg-cream-50 px-5 py-3">
              <SheetTrigger asChild>
                <Button size="lg" className="w-full">Ver {total} {total === 1 ? "resultado" : "resultados"}</Button>
              </SheetTrigger>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <strong className="text-sage-900">{total}</strong> {total === 1 ? "animal encontrado" : "animais encontrados"}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="ordem" className="text-sm text-muted-foreground">Ordenar:</label>
          <NativeSelect
            id="ordem"
            value={params.get("ordem") ?? "recentes"}
            onChange={(e) => update({ ordem: e.target.value === "recentes" ? null : e.target.value })}
            className="h-10 w-auto rounded-full text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} disabled={o.value === "proximos" && !params.get("ref")}>
                {o.label}{o.value === "proximos" && !params.get("ref") ? " (defina a distância)" : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
    </div>
  );
}

/** Esmaece os resultados enquanto a nova busca é carregada. */
export function CatalogResults({ children }: { children: React.ReactNode }) {
  const { pending } = useCatalogParams();
  return <div className={pending ? "opacity-50 transition-opacity" : "transition-opacity"} aria-busy={pending}>{children}</div>;
}
