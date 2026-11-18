import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, ACTION_LABEL } from "@/components/admin/admin-header";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Auditoria" };

export default async function AuditoriaPage() {
  await requirePermission("logs.view");
  const supabase = await createClient();
  const { data } = await supabase.from("moderation_logs").select("*").order("created_at", { ascending: false }).limit(200);
  const actorIds = [...new Set((data ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name").in("id", actorIds) : { data: [] };
  const names = new Map((actors ?? []).map((a) => [a.id, a.full_name]));
  return (
    <>
      <AdminHeader title="Registro de auditoria" description="Todas as ações administrativas. Os registros não podem ser editados nem apagados pela interface." />
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-border/60">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cream-100 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr><th className="p-3">Data</th><th className="p-3">Responsável</th><th className="p-3">Ação</th><th className="p-3">Alvo</th><th className="p-3">Motivo</th><th className="p-3">Detalhes</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(data ?? []).map((l) => (
              <tr key={l.id}>
                <td className="p-3 whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                <td className="p-3">{l.actor_id ? names.get(l.actor_id) ?? "Conta removida" : "Sistema"} <span className="text-muted-foreground">({l.actor_role})</span></td>
                <td className="p-3 font-semibold">{ACTION_LABEL[l.action] ?? l.action}</td>
                <td className="p-3">{l.target_type}</td>
                <td className="p-3">{l.reason ?? "—"}</td>
                <td className="max-w-xs truncate p-3 font-mono text-xs text-muted-foreground" title={JSON.stringify(l.metadata)}>{JSON.stringify(l.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
