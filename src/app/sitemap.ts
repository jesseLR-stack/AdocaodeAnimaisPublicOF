import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

const STATIC = [
  ["", 1, "daily"], ["/animais", 0.9, "hourly"], ["/adotados", 0.7, "daily"], ["/protetores", 0.7, "daily"],
  ["/sobre", 0.5, "monthly"], ["/faq", 0.5, "monthly"], ["/contato", 0.4, "yearly"], ["/adocao-responsavel", 0.6, "monthly"],
  ["/diretrizes", 0.3, "yearly"], ["/termos", 0.2, "yearly"], ["/privacidade", 0.2, "yearly"], ["/cookies", 0.2, "yearly"],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`, lastModified: now, priority, changeFrequency,
  }));
  try {
    const supabase = createPublicClient();
    const [{ data: animals }, { data: profiles }] = await Promise.all([
      supabase.from("animals").select("slug, updated_at, status").in("status", ["disponivel", "adotado"]).order("updated_at", { ascending: false }).limit(5000),
      supabase.from("profiles").select("slug, updated_at").in("profile_type", ["ong_abrigo", "protetor_independente", "organizacao_parceira"]).limit(2000),
    ]);
    for (const a of animals ?? []) {
      entries.push({ url: `${SITE_URL}/animais/${a.slug}`, lastModified: new Date(a.updated_at), priority: a.status === "disponivel" ? 0.8 : 0.4, changeFrequency: "weekly" });
    }
    for (const p of profiles ?? []) {
      entries.push({ url: `${SITE_URL}/protetores/${p.slug}`, lastModified: new Date(p.updated_at), priority: 0.5, changeFrequency: "weekly" });
    }
  } catch {
    // Sem banco disponível (ex.: build sem variáveis): publica apenas as páginas estáticas.
  }
  return entries;
}
