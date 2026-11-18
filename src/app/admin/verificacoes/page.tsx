import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { ReasonAction } from "@/components/admin/reason-action";
import { adminSetVerified } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Verificações" };

export default async function VerificacoesPage() {
  await requirePermission("organizations.verify");
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_verifications")
    .select("id, message, created_at, organizations(name, website, instagram, cnpj, description, owner_id, profiles(full_name, slug))")
    .eq("status", "pendente")
    .order("created_at");
  return (
    <>
      <AdminHeader title="Verificação de organizações" description="Confira site, redes sociais e CNPJ antes de conceder o selo." />
      {(data?.length ?? 0) === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-muted-foreground ring-1 ring-border/60">Nenhuma solicitação pendente.</p>
      ) : (
        <ul className="space-y-3">
          {data!.map((v) => {
            const o = v.organizations as unknown as { name: string; website: string | null; instagram: string | null; cnpj: string | null; description: string | null; owner_id: string; profiles: { full_name: string; slug: string } | null };
            return (
              <li key={v.id} className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
                <p className="font-display text-lg font-semibold text-sage-900">{o.name}</p>
                <p className="text-sm text-muted-foreground">Solicitado por <Link href={`/admin/usuarios/${o.owner_id}`} className="underline">{o.profiles?.full_name}</Link> em {formatDateTime(v.created_at)}</p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-muted-foreground">Site</dt><dd>{o.website ? <a href={o.website} target="_blank" rel="noopener noreferrer nofollow" className="underline">{o.website}</a> : "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Instagram</dt><dd>{o.instagram ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">CNPJ</dt><dd>{o.cnpj ?? "—"}</dd></div>
                </dl>
                {v.message && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-sm">“{v.message}”</p>}
                <div className="mt-4 flex gap-2">
                  <ReasonAction label="Aprovar" title={`Verificar ${o.name}`} variant="default" requireReason={false} defaultReason="Dados conferidos" action={(r) => adminSetVerified(o.owner_id, true, r)} />
                  <ReasonAction label="Recusar" title={`Recusar verificação de ${o.name}`} variant="ghost" description="O motivo será exibido para o solicitante." action={(r) => adminSetVerified(o.owner_id, false, r)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
