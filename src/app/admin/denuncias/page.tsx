import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, ACTION_LABEL } from "@/components/admin/admin-header";
import { ReportActions } from "@/components/admin/report-actions";
import { Badge } from "@/components/ui/badge";
import { REPORT_REASON_LABEL, REPORT_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Denúncias" };
const FILTERS = [["abertas", "Abertas"], ["procedente", "Procedentes"], ["improcedente", "Improcedentes"], ["todas", "Todas"]] as const;

export default async function DenunciasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("reports.manage");
  const filter = (await searchParams).filtro ?? "abertas";
  const supabase = await createClient();
  let q = supabase
    .from("reports")
    .select("*, animals(name, slug), reported:profiles!reports_reported_user_id_fkey(id, full_name, account_status), reporter:profiles!reports_reporter_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter === "abertas") q = q.in("status", ["pendente", "em_analise"]);
  else if (filter !== "todas") q = q.eq("status", filter as "procedente" | "improcedente");
  const { data: reports } = await q;
  const ids = (reports ?? []).map((r) => r.id);
  const { data: logs } = ids.length
    ? await supabase.from("moderation_logs").select("target_id, action, reason, actor_role, created_at, metadata").in("target_id", ids).order("created_at")
    : { data: [] };

  return (
    <>
      <AdminHeader title="Central de denúncias" description="Analise denúncias de anúncios, usuários e conversas. Todas as decisões ficam registradas." />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filtro de denúncias">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={`/admin/denuncias?filtro=${v}`} className={cn("rounded-full px-4 py-2 text-sm font-semibold", filter === v ? "bg-sage-700 text-white" : "bg-white text-sage-700 ring-1 ring-border")}>{l}</Link>
        ))}
      </nav>
      {(reports?.length ?? 0) === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-muted-foreground ring-1 ring-border/60">Nenhuma denúncia neste filtro. 🎉</p>
      ) : (
        <ul className="space-y-3">
          {reports!.map((r) => {
            const animal = r.animals as unknown as { name: string; slug: string } | null;
            const reported = r.reported as unknown as { id: string; full_name: string; account_status: string } | null;
            const reporter = r.reporter as unknown as { full_name: string } | null;
            const history = (logs ?? []).filter((l) => l.target_id === r.id);
            return (
              <li key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "pendente" ? "accent" : r.status === "em_analise" ? "warning" : r.status === "procedente" ? "danger" : "outline"}>{REPORT_STATUS_LABEL[r.status]}</Badge>
                  <Badge variant="cream">{r.target_type === "animal" ? "Anúncio" : r.target_type === "conversa" ? "Conversa" : "Usuário"}</Badge>
                  <span className="font-semibold text-sage-900">{REPORT_REASON_LABEL[r.reason]}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
                </div>
                <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-3">
                  <div><dt className="text-muted-foreground">Publicação</dt><dd>{animal ? <Link href={`/animais/${animal.slug}`} className="font-semibold underline">{animal.name}</Link> : r.conversation_id ? <Link href={`/admin/conversas/${r.conversation_id}`} className="font-semibold underline">Ver conversa denunciada</Link> : "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Usuário denunciado</dt><dd>{reported ? <Link href={`/admin/usuarios/${reported.id}`} className="font-semibold underline">{reported.full_name}</Link> : "—"}{reported && reported.account_status !== "ativo" && <Badge variant="danger" className="ml-1">{reported.account_status}</Badge>}</dd></div>
                  <div><dt className="text-muted-foreground">Denunciante</dt><dd>{reporter?.full_name ?? "Conta excluída"}</dd></div>
                </dl>
                {r.description && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-sm text-sage-800">“{r.description}”</p>}
                {history.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-sage-700">Histórico de decisões ({history.length})</summary>
                    <ul className="mt-2 space-y-1 border-l-2 border-sage-200 pl-3">
                      {history.map((h, i) => (
                        <li key={i}>{formatDateTime(h.created_at)} · {h.actor_role} · {ACTION_LABEL[h.action] ?? h.action}: {(h.metadata as { to?: string }).to ?? ""}{h.reason ? ` — ${h.reason}` : ""}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {r.resolution_note && <p className="mt-2 text-sm text-muted-foreground">Decisão: {r.resolution_note}</p>}
                <div className="mt-4"><ReportActions id={r.id} status={r.status} animalId={r.animal_id} userId={reported?.id ?? null} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
