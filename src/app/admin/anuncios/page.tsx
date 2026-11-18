import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AnimalAdminActions } from "@/components/admin/animal-admin-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RISK_FLAG_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Anúncios" };
const STATUSES = ["disponivel", "adotado", "pausado", "suspenso", "removido"] as const;

export default async function AdminAnunciosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("animals.moderate");
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("animals")
    .select("id, slug, name, description, status, status_reason, risk_flags, health_verified, view_count, created_at, uf, cities(name), owner:profiles!animals_owner_id_fkey(id, full_name), reports(count)")
    .order("created_at", { ascending: false })
    .limit(60);
  const status = STATUSES.find((s) => s === sp.status);
  if (status) q = q.eq("status", status);
  if (sp.sinalizados) q = q.not("risk_flags", "eq", "{}");
  if (sp.q) q = q.ilike("name", `%${sp.q.replace(/[%_]/g, "")}%`);
  const { data } = await q;

  return (
    <>
      <AdminHeader title="Anúncios" description="Todas as publicações, incluindo pausadas, suspensas e removidas." />
      <form className="mb-5 flex flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-border/60 sm:flex-row">
        <Input name="q" defaultValue={sp.q} placeholder="Buscar por nome" className="h-11" aria-label="Buscar por nome" />
        <NativeSelect name="status" defaultValue={sp.status ?? ""} className="h-11 sm:w-48" aria-label="Status">
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </NativeSelect>
        <label className="flex items-center gap-2 px-2 text-sm font-semibold whitespace-nowrap text-sage-800">
          <input type="checkbox" name="sinalizados" value="1" defaultChecked={!!sp.sinalizados} className="size-4 accent-sage-600" /> Só sinalizados
        </label>
        <Button type="submit">Filtrar</Button>
      </form>
      <ul className="space-y-3">
        {(data ?? []).map((a) => {
          const owner = a.owner as unknown as { id: string; full_name: string } | null;
          const reports = (a.reports as unknown as { count: number }[])[0]?.count ?? 0;
          return (
            <li key={a.id} className="rounded-2xl bg-white p-4 ring-1 ring-border/60">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/animais/${a.slug}`} className="font-display text-lg font-semibold text-sage-900 hover:underline">{a.name}</Link>
                <Badge variant={a.status === "disponivel" ? "success" : a.status === "suspenso" || a.status === "removido" ? "danger" : "cream"}>{STATUS_LABEL[a.status]}</Badge>
                {a.risk_flags.map((f) => <Badge key={f} variant="warning">{RISK_FLAG_LABEL[f] ?? f}</Badge>)}
                {reports > 0 && <Link href="/admin/denuncias?filtro=todas"><Badge variant="danger">{reports} denúncia(s)</Badge></Link>}
                {a.health_verified && <Badge variant="success">Saúde verificada</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {owner ? <Link href={`/admin/usuarios/${owner.id}`} className="underline">{owner.full_name}</Link> : "—"} · {(a.cities as { name: string } | null)?.name}/{a.uf} · {formatDate(a.created_at)} · {a.view_count} visitas
              </p>
              {a.status_reason && <p className="mt-1 text-sm text-destructive">Motivo: {a.status_reason}</p>}
              <p className="mt-2 line-clamp-2 text-sm text-sage-800">{a.description}</p>
              <div className="mt-3"><AnimalAdminActions animal={a} /></div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
