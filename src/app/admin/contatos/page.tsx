import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { ReasonAction } from "@/components/admin/reason-action";
import { adminMarkContactHandled } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Contatos" };

export default async function ContatosPage() {
  await requirePermission("reports.manage");
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("handled_at", { nullsFirst: true }).order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <AdminHeader title="Mensagens de contato" description="Enviadas pelo formulário da página de contato." />
      {(data?.length ?? 0) === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-muted-foreground ring-1 ring-border/60">Nenhuma mensagem.</p> : (
        <ul className="space-y-3">
          {data!.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={m.handled_at ? "outline" : "accent"}>{m.handled_at ? "Atendida" : "Nova"}</Badge>
                <span className="font-semibold text-sage-900">{m.subject}</span>
                <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="mt-1 text-sm">{m.name} · <a href={`mailto:${m.email}`} className="underline">{m.email}</a></p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-sage-800">{m.message}</p>
              {!m.handled_at && <div className="mt-3"><ReasonAction label="Marcar como atendida" title="Marcar como atendida" requireReason={false} action={() => adminMarkContactHandled(m.id)} /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
