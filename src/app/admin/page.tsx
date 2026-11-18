import Link from "next/link";
import { AlertTriangle, BadgeCheck, Flag, PawPrint, Sparkles, UserPlus, UserX, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, ACTION_LABEL } from "@/components/admin/admin-header";
import { formatDateTime, timeAgo } from "@/lib/format";
import { PROFILE_TYPE_LABEL } from "@/lib/constants";

export default async function AdminDashboard() {
  await requirePermission("dashboard.view");
  const supabase = await createClient();
  const [{ data: stats }, { data: logs }, { data: newUsers }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.from("moderation_logs").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id, full_name, profile_type, created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  const s = (stats ?? {}) as Record<string, number>;
  const tiles = [
    { label: "Usuários", value: s.users_total, icon: Users, href: "/admin/usuarios" },
    { label: "Novos (7 dias)", value: s.users_new_7d, icon: UserPlus, href: "/admin/usuarios" },
    { label: "Contas suspensas/bloqueadas", value: s.users_suspended, icon: UserX, href: "/admin/usuarios?status=suspenso" },
    { label: "Animais cadastrados", value: s.animals_total, icon: PawPrint, href: "/admin/anuncios" },
    { label: "Disponíveis", value: s.animals_available, icon: PawPrint, href: "/admin/anuncios?status=disponivel" },
    { label: "Adotados", value: s.animals_adopted, icon: Sparkles, href: "/admin/anuncios?status=adotado" },
    { label: "Anúncios publicados", value: s.animals_published, icon: PawPrint, href: "/admin/anuncios" },
    { label: "Publicações denunciadas", value: s.reported_animals, icon: Flag, href: "/admin/denuncias", alert: true },
    { label: "Denúncias abertas", value: s.reports_open, icon: Flag, href: "/admin/denuncias", alert: true },
    { label: "Sinalizações automáticas", value: s.animals_flagged, icon: AlertTriangle, href: "/admin/anuncios?sinalizados=1", alert: true },
    { label: "Verificações pendentes", value: s.verifications_pending, icon: BadgeCheck, href: "/admin/verificacoes", alert: true },
  ];
  return (
    <>
      <AdminHeader title="Dashboard" description="Visão geral da plataforma." />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, alert }) => (
          <li key={label}>
            <Link href={href} className={`flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 transition hover:shadow-soft ${alert && value ? "ring-apricot-300" : "ring-border/60"}`}>
              <span className={`flex size-10 items-center justify-center rounded-xl ${alert && value ? "bg-apricot-100 text-apricot-600" : "bg-sage-100 text-sage-700"}`}><Icon className="size-5" /></span>
              <span>
                <span className="block font-display text-2xl leading-none font-semibold text-sage-900">{value ?? 0}</span>
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
          <h2 className="mb-3 text-lg font-semibold text-sage-900">Atividade recente da moderação</h2>
          {(logs?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ação registrada.</p> : (
            <ul className="divide-y divide-border/60 text-sm">
              {logs!.map((l) => (
                <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                  <span><strong className="text-sage-900">{ACTION_LABEL[l.action] ?? l.action}</strong> · {l.target_type}{l.reason ? ` — ${l.reason}` : ""}</span>
                  <span className="text-muted-foreground">{l.actor_role} · {formatDateTime(l.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
          <h2 className="mb-3 text-lg font-semibold text-sage-900">Novos cadastros</h2>
          <ul className="divide-y divide-border/60 text-sm">
            {(newUsers ?? []).map((u) => (
              <li key={u.id} className="flex justify-between gap-2 py-2.5">
                <Link href={`/admin/usuarios/${u.id}`} className="font-semibold text-sage-900 hover:underline">{u.full_name}</Link>
                <span className="text-muted-foreground">{PROFILE_TYPE_LABEL[u.profile_type]} · {timeAgo(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
