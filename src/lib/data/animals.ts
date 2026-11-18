import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { PAGE_SIZE } from "@/lib/constants";

type Enums = Database["public"]["Enums"];
export type AnimalCardData = Database["public"]["Functions"]["search_animals"]["Returns"][number];

export type CatalogFilters = {
  q?: string;
  especie?: Enums["animal_species"][];
  sexo?: Enums["animal_sex"];
  porte?: Enums["animal_size"][];
  idade?: Enums["animal_age_group"][];
  raca?: string;
  uf?: string;
  cidade?: number;
  raio?: number;
  ref?: number;
  castrado?: boolean;
  vacinado?: boolean;
  especiais?: boolean;
  ordem?: string;
  pagina?: number;
};

const SPECIES: Enums["animal_species"][] = ["cachorro", "gato", "outro"];
const SIZES: Enums["animal_size"][] = ["pequeno", "medio", "grande"];
const AGES: Enums["animal_age_group"][] = ["filhote", "jovem", "adulto", "idoso"];

function list<T extends string>(value: string | string[] | undefined, allowed: T[]): T[] | undefined {
  const raw = (Array.isArray(value) ? value : (value ?? "").split(",")).filter(Boolean);
  const valid = raw.filter((v): v is T => (allowed as string[]).includes(v));
  return valid.length ? valid : undefined;
}
const bool = (v: string | string[] | undefined) => (v === "sim" ? true : v === "nao" ? false : undefined);
const int = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 80) || undefined;

/** Converte os parâmetros da URL em filtros validados. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const sexo = str(sp.sexo);
  const uf = str(sp.uf)?.toUpperCase();
  return {
    q: str(sp.q),
    especie: list(sp.especie, SPECIES),
    sexo: sexo === "macho" || sexo === "femea" ? sexo : undefined,
    porte: list(sp.porte, SIZES),
    idade: list(sp.idade, AGES),
    raca: str(sp.raca),
    uf: uf && /^[A-Z]{2}$/.test(uf) ? uf : undefined,
    cidade: int(sp.cidade),
    raio: int(sp.raio),
    ref: int(sp.ref),
    castrado: bool(sp.castrado),
    vacinado: bool(sp.vacinado),
    especiais: bool(sp.especiais),
    ordem: str(sp.ordem),
    pagina: int(sp.pagina) ?? 1,
  };
}

export async function searchAnimals(
  filters: CatalogFilters,
  opts: { status?: Enums["animal_status"]; pageSize?: number } = {},
) {
  const supabase = await createClient();
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const page = filters.pagina ?? 1;
  const { data, error } = await supabase.rpc("search_animals", {
    p_query: filters.q,
    p_species: filters.especie,
    p_sex: filters.sexo,
    p_size: filters.porte,
    p_age_group: filters.idade,
    p_breed: filters.raca,
    p_uf: filters.uf,
    p_city: filters.cidade,
    p_ref_city: filters.ref,
    p_radius_km: filters.ref ? filters.raio : undefined,
    p_neutered: filters.castrado,
    p_vaccinated: filters.vacinado,
    p_special_needs: filters.especiais,
    p_status: opts.status ?? "disponivel",
    p_sort: filters.ordem ?? "recentes",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) {
    console.error("searchAnimals", error);
    return { items: [] as AnimalCardData[], total: 0, page, pageSize, error: true };
  }
  const items = data ?? [];
  return { items, total: Number(items[0]?.total_count ?? 0), page, pageSize, error: false };
}

/** IDs dos animais favoritados pelo usuário (para pintar os corações). */
export async function getFavoriteIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("animal_id").eq("user_id", userId);
  return new Set((data ?? []).map((f) => f.animal_id));
}
