import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { BR_STATES, PROFILE_TYPE_LABEL } from "@/lib/constants";
import { initials, storageUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "ONGs e protetores",
  description: "Conheça ONGs, abrigos e protetores independentes que anunciam animais para adoção no AdoteAmigo.",
  alternates: { canonical: "/protetores" },
};

type SP = Record<string, string | string[] | undefined>;
const TYPES = ["ong_abrigo", "protetor_independente", "organizacao_parceira"] as const;

export default async function ProtetoresPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tipo = TYPES.find((t) => t === sp.tipo);
  const uf = typeof sp.uf === "string" && /^[A-Z]{2}$/.test(sp.uf) ? sp.uf : undefined;
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, slug, full_name, avatar_url, bio, profile_type, is_verified, uf, cities(name), animals!animals_owner_id_fkey(count)")
    .in("profile_type", tipo ? [tipo] : [...TYPES])
    .eq("account_status", "ativo")
    .order("is_verified", { ascending: false })
    .order("full_name")
    .limit(60);
  if (uf) query = query.eq("uf", uf);
  const { data } = await query;
  const list = (data ?? []).map((p) => ({ ...p, count: (p.animals as unknown as { count: number }[])[0]?.count ?? 0 }));

  return (
    <>
      <PageHeader eyebrow="Comunidade" title="ONGs, abrigos e protetores" description="Pessoas e instituições que dedicam seu tempo a resgatar, cuidar e encontrar lares para animais." />
      <div className="container-page py-10">
        <form className="mb-8 flex flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-border/60 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-sage-900">
            Tipo
            <NativeSelect name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos</option>
              {TYPES.map((t) => <option key={t} value={t}>{PROFILE_TYPE_LABEL[t]}</option>)}
            </NativeSelect>
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-sage-900">
            Estado
            <NativeSelect name="uf" defaultValue={uf ?? ""}>
              <option value="">Todos os estados</option>
              {BR_STATES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </NativeSelect>
          </label>
          <Button type="submit" size="lg">Filtrar</Button>
        </form>

        {list.length === 0 ? (
          <p className="rounded-3xl bg-white p-8 text-center text-muted-foreground ring-1 ring-border/60">Nenhum perfil encontrado com esses filtros.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id}>
                <Link href={`/protetores/${p.slug}`} className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border/60 transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-14 ring-4 ring-sage-50">
                      {p.avatar_url && <AvatarImage src={storageUrl(p.avatar_url, { bucket: "avatars" }) ?? undefined} alt="" />}
                      <AvatarFallback className="text-base">{initials(p.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 font-semibold text-sage-900">
                        <span className="truncate">{p.full_name}</span>
                        {p.is_verified && <BadgeCheck className="size-4 shrink-0 text-sage-500" aria-label="Verificado" />}
                      </p>
                      <Badge variant="cream" className="mt-1">{PROFILE_TYPE_LABEL[p.profile_type]}</Badge>
                    </div>
                  </div>
                  {p.bio && <p className="mt-3 line-clamp-3 text-sm text-sage-700">{p.bio}</p>}
                  <p className="mt-auto flex items-center justify-between pt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="size-4" />{(p.cities as unknown as { name: string } | null)?.name ?? "—"}{p.uf ? `, ${p.uf}` : ""}</span>
                    <span className="font-semibold text-sage-700">{p.count} {p.count === 1 ? "anúncio" : "anúncios"}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
