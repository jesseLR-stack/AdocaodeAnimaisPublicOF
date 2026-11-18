import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader, ACTION_LABEL } from "@/components/admin/admin-header";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_STATUS_LABEL, PROFILE_TYPE_LABEL, REPORT_REASON_LABEL, REPORT_STATUS_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Usuário" };

export default async function AdminUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requirePermission("users.view");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: p }, { data: priv }, { data: animals }, { data: reports }, { data: logs }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("*, cities(name)").eq("id", id).maybeSingle(),
    supabase.from("profiles_private").select("phone, birth_date").eq("id", id).maybeSingle(),
    supabase.from("animals").select("id, slug, name, status, created_at").eq("owner_id", id).order("created_at", { ascending: false }),
    supabase.from("reports").select("id, reason, status, created_at, description").eq("reported_user_id", id).order("created_at", { ascending: false }),
    supabase.from("moderation_logs").select("*").eq("target_id", id).order("created_at", { ascending: false }),
    supabase.from("admin_roles").select("role").eq("user_id", id).maybeSingle(),
  ]);
  if (!p) notFound();
  // E-mail vem do Auth (somente servidor, somente equipe).
  const { data: authUser } = await createAdminClient().auth.admin.getUserById(id);

  return (
    <>
      <AdminHeader title={p.full_name} description={`${PROFILE_TYPE_LABEL[p.profile_type]} · cadastrado em ${formatDate(p.created_at)}`}>
        <Link href={`/protetores/${p.slug}`} className="text-sm font-semibold text-sage-700 underline">Ver perfil público</Link>
      </AdminHeader>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
          <div className="flex flex-wrap gap-2">
            <Badge variant={p.account_status === "ativo" ? "success" : "danger"}>Conta {ACCOUNT_STATUS_LABEL[p.account_status].toLowerCase()}</Badge>
            {p.is_verified && <Badge variant="success">Verificado</Badge>}
            {role && <Badge variant="dark">{role.role}</Badge>}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">E-mail</dt><dd className="break-all">{authUser?.user?.email ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">E-mail confirmado</dt><dd>{authUser?.user?.email_confirmed_at ? "Sim" : "Não"}</dd></div>
            <div><dt className="text-muted-foreground">Telefone</dt><dd>{priv?.phone ? formatPhone(priv.phone) : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Nascimento</dt><dd>{priv?.birth_date ? formatDate(`${priv.birth_date}T12:00:00`) : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Cidade</dt><dd>{(p.cities as { name: string } | null)?.name ?? "—"}{p.uf ? `/${p.uf}` : ""}</dd></div>
            <div><dt className="text-muted-foreground">Último acesso</dt><dd>{authUser?.user?.last_sign_in_at ? formatDateTime(authUser.user.last_sign_in_at) : "—"}</dd></div>
          </dl>
          {p.status_reason && <p className="mt-3 text-sm text-destructive">Motivo do status: {p.status_reason}</p>}
          {p.bio && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-sm">{p.bio}</p>}
          {staff.id !== p.id && role?.role !== "admin" && (
            <div className="mt-5">
              <UserAdminActions user={p} canBlock={staff.permissions.includes("users.block")} canVerify={staff.permissions.includes("organizations.verify")} />
            </div>
          )}
        </section>
        <section className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
          <h2 className="font-semibold text-sage-900">Anúncios ({animals?.length ?? 0})</h2>
          <ul className="mt-2 divide-y divide-border/60 text-sm">
            {(animals ?? []).map((a) => (
              <li key={a.id} className="flex justify-between py-2"><Link href={`/animais/${a.slug}`} className="underline">{a.name}</Link><span>{STATUS_LABEL[a.status]} · {formatDate(a.created_at)}</span></li>
            ))}
          </ul>
          <h2 className="mt-6 font-semibold text-sage-900">Histórico de denúncias ({reports?.length ?? 0})</h2>
          <ul className="mt-2 divide-y divide-border/60 text-sm">
            {(reports ?? []).map((r) => (
              <li key={r.id} className="py-2">{REPORT_REASON_LABEL[r.reason]} · {REPORT_STATUS_LABEL[r.status]} · {formatDate(r.created_at)}{r.description ? ` — “${r.description}”` : ""}</li>
            ))}
          </ul>
          <h2 className="mt-6 font-semibold text-sage-900">Ações de moderação</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {(logs ?? []).map((l) => (
              <li key={l.id}>{formatDateTime(l.created_at)} · {l.actor_role} · {ACTION_LABEL[l.action] ?? l.action}{l.reason ? ` — ${l.reason}` : ""}</li>
            ))}
            {(logs?.length ?? 0) === 0 && <li className="text-muted-foreground">Nenhuma ação registrada.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
