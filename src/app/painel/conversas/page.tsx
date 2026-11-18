import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader, EmptyState } from "@/components/dashboard/dash-header";
import { ConversationList, type ConversationSummary } from "@/components/chat/conversation-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Conversas" };

export default async function ConversasPage() {
  await requireUser("/painel/conversas");
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_conversations");
  const items = (data ?? []) as ConversationSummary[];
  return (
    <>
      <DashHeader title="Conversas" description="Mensagens entre você e anunciantes ou interessados." />
      {items.length === 0 ? (
        <EmptyState icon={<MessageCircle />} title="Nenhuma conversa ainda" description="Use o botão “Conversar” na página de um animal para falar com o anunciante."
          action={<Button asChild><Link href="/animais">Ver animais</Link></Button>} />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-border/60"><ConversationList items={items} /></div>
      )}
    </>
  );
}
