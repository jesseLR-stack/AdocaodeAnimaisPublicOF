import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ACCOUNT_STATUS_LABEL, PROFILE_TYPE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("users.view");
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("profiles")
    .select("id, full_name, profile_type, account_status, is_verified, uf, created_at, cities(name), animals!animals_owner_id_fkey(count), reports!reports_reported_user_id_fkey(count)")
    .order("created_at", { ascending: false })
    .limit(80);
  if (sp.q) q = q.ilike("full_name", `%${sp.q.replace(/[%_]/g, "")}%`);
  if (sp.status === "suspenso") q = q.neq("account_status", "ativo");
  if (sp.tipo) q = q.eq("profile_type", sp.tipo as "ong_abrigo");
  const { data } = await q;

  return (
    <>
      <AdminHeader title="Usuários" description="Pesquise perfis, consulte anúncios e histórico de denúncias." />
      <form className="mb-5 flex flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-border/60 sm:flex-row">
        <Input name="q" defaultValue={sp.q} placeholder="Buscar por nome" className="h-11" aria-label="Buscar por nome" />
        <NativeSelect name="tipo" defaultValue={sp.tipo ?? ""} className="h-11 sm:w-56" aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {Object.entries(PROFILE_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={sp.status ?? ""} className="h-11 sm:w-48" aria-label="Status">
          <option value="">Qualquer status</option>
          <option value="suspenso">Suspensos/bloqueados</option>
        </NativeSelect>
        <Button type="submit">Filtrar</Button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-border/60">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream-100 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr><th className="p-3">Nome</th><th className="p-3">Tipo</th><th className="p-3">Local</th><th className="p-3">Anúncios</th><th className="p-3">Denúncias</th><th className="p-3">Status</th><th className="p-3">Desde</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(data ?? []).map((u) => {
              const animals = (u.animals as unknown as { count: number }[])[0]?.count ?? 0;
              const reports = (u.reports as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <tr key={u.id} className="hover:bg-cream-50">
                  <td className="p-3"><Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-1 font-semibold text-sage-900 hover:underline">{u.full_name}{u.is_verified && <BadgeCheck className="size-4 text-sage-500" />}</Link></td>
                  <td className="p-3">{PROFILE_TYPE_LABEL[u.profile_type]}</td>
                  <td className="p-3">{(u.cities as { name: string } | null)?.name ?? "—"}{u.uf ? `/${u.uf}` : ""}</td>
                  <td className="p-3">{animals}</td>
                  <td className="p-3">{reports > 0 ? <Badge variant="danger">{reports}</Badge> : 0}</td>
                  <td className="p-3"><Badge variant={u.account_status === "ativo" ? "success" : "danger"}>{ACCOUNT_STATUS_LABEL[u.account_status]}</Badge></td>
                  <td className="p-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
