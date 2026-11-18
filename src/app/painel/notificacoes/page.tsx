import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader, EmptyState } from "@/components/dashboard/dash-header";
import { markNotificationsRead } from "@/app/actions/account";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  const user = await requireUser("/painel/notificacoes");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const list = data ?? [];
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <>
      <DashHeader
        title="Notificações"
        description={unread ? `${unread} não lida(s)` : "Tudo em dia!"}
        action={unread > 0 ? (
          <form action={async () => { "use server"; await markNotificationsRead(); }}>
            <SubmitButton variant="outline" pendingText="Marcando…">Marcar todas como lidas</SubmitButton>
          </form>
        ) : undefined}
      />
      {list.length === 0 ? (
        <EmptyState icon={<Bell />} title="Nenhuma notificação" description="Avisaremos aqui sobre interesses, mensagens e novidades dos seus favoritos." />
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-white ring-1 ring-border/60">
          {list.map((n) => (
            <li key={n.id} className="border-b border-border/60 last:border-0">
              <Link href={n.link ?? "/painel"} className={cn("flex gap-3 p-4 transition hover:bg-cream-100", !n.read_at && "bg-apricot-100/40")}>
                <span className={cn("mt-2 size-2.5 shrink-0 rounded-full", n.read_at ? "bg-beige-300" : "bg-apricot-400")} aria-hidden />
                <span className="min-w-0">
                  <span className="block font-semibold text-sage-900">{n.title}{!n.read_at && <span className="sr-only"> (não lida)</span>}</span>
                  {n.body && <span className="block text-sm text-sage-700">{n.body}</span>}
                  <span className="block text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
