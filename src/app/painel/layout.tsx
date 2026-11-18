import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormAlert } from "@/components/forms/form-alert";
import { ACCOUNT_STATUS_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: { default: "Meu painel", template: "%s · Painel AdoteAmigo" }, robots: { index: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();
  const [interests, messages, notifications] = await Promise.all([
    supabase.from("adoption_interests").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "enviado"),
    supabase.rpc("unread_messages_count"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  const counts = {
    interests: interests.count ?? 0,
    messages: Number(messages.data ?? 0),
    notifications: notifications.count ?? 0,
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="container-page flex-1 py-6 pb-28 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DashboardNav counts={counts} isStaff={Boolean(user.staffRole)} />
        </aside>
        <main id="conteudo" className="min-w-0">
          {user.profile.account_status !== "ativo" && (
            <FormAlert className="mb-6">
              Sua conta está <strong>{ACCOUNT_STATUS_LABEL[user.profile.account_status].toLowerCase()}</strong>
              {user.profile.status_reason ? `: ${user.profile.status_reason}` : "."} Enquanto isso, você não pode
              publicar anúncios nem enviar mensagens. Se acredita que houve um engano, entre em contato.
            </FormAlert>
          )}
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
