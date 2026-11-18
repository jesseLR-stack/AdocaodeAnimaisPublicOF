"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cat, Dog, Rabbit, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIES = [
  { value: "", label: "Todos", icon: Search },
  { value: "cachorro", label: "Cães", icon: Dog },
  { value: "gato", label: "Gatos", icon: Cat },
  { value: "outro", label: "Outros", icon: Rabbit },
];

export function HeroSearch() {
  const router = useRouter();
  const [species, setSpecies] = useState("");
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (species) params.set("especie", species);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/animais${params.size ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={submit} role="search" className="w-full max-w-xl rounded-[1.75rem] bg-white p-2.5 shadow-lift ring-1 ring-border/60">
      <div className="flex gap-1.5 overflow-x-auto p-1 scrollbar-none" role="radiogroup" aria-label="Espécie">
        {SPECIES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={species === value}
            onClick={() => setSpecies(value)}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition",
              species === value ? "bg-sage-600 text-white" : "bg-cream-100 text-sage-700 hover:bg-sage-100",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <label htmlFor="hero-q" className="sr-only">Buscar por nome, raça ou característica</label>
        <input
          id="hero-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nome, raça ou jeitinho (ex.: calmo)"
          className="h-12 min-w-0 flex-1 rounded-2xl bg-transparent px-3 text-[15px] outline-none placeholder:text-muted-foreground/80"
        />
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-2xl bg-apricot-400 px-5 font-semibold text-white transition hover:bg-apricot-500 active:scale-95"
        >
          <Search className="size-5" /> <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>
    </form>
  );
}
