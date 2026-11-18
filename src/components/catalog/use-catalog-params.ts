"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Lê e atualiza os filtros do catálogo na URL (compartilhável e sem recarregar a página). */
export function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Record<string, string | string[] | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        const v = Array.isArray(value) ? value.join(",") : value;
        if (v) next.set(key, v);
        else next.delete(key);
      }
      if (!("pagina" in changes)) next.delete("pagina");
      startTransition(() => {
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggle = (key: string, value: string) => {
    const current = list(key);
    update({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };
  const clear = () => startTransition(() => router.replace(pathname, { scroll: false }));

  return { params, update, list, toggle, clear, pending };
}
