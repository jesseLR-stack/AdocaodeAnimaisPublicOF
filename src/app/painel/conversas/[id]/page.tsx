import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/chat/chat-thread";
import { ConversationList, type ConversationSummary } from "@/components/chat/conversation-list";

export const metadata: Metadata = { title: "Conversa" };

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/painel/conversas/${id}`);
  const supabase = await createClient();

  // RLS: só participantes (ou a moderação, se denunciada) enxergam a conversa.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, animals(name, slug), conversation_participants(user_id, profiles(id, full_name, avatar_url, slug))")
    .eq("id", id)
    .maybeSingle();
  const participants = (conv?.conversation_participants ?? []) as unknown as {
    user_id: string; profiles: { id: string; full_name: string; avatar_url: string | null; slug: string } | null;
  }[];
  if (!conv || !participants.some((p) => p.user_id === user.id)) notFound();

  const otherP = participants.find((p) => p.user_id !== user.id);
  const [{ data: msgs }, { data: list }, { data: blockedBetween }, { data: myBlock }] = await Promise.all([
    supabase.from("messages").select("id, sender_id, body, created_at, flagged").eq("conversation_id", id).order("created_at", { ascending: false }).limit(40),
    supabase.rpc("my_conversations"),
    otherP ? supabase.rpc("is_blocked_between", { a: user.id, b: otherP.user_id }) : Promise.resolve({ data: false }),
    otherP ? supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", otherP.user_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const animal = conv.animals as unknown as { name: string; slug: string } | null;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="hidden max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-3xl bg-white ring-1 ring-border/60 lg:block">
        <p className="px-4 pt-4 pb-2 font-display text-lg font-semibold text-sage-900">Conversas</p>
        <ConversationList items={(list ?? []) as ConversationSummary[]} activeId={id} />
      </aside>
      <ChatThread
        key={id}
        conversationId={id}
        me={user.id}
        other={{
          id: otherP?.profiles?.id ?? null,
          name: otherP?.profiles?.full_name ?? "Usuário removido",
          avatar: otherP?.profiles?.avatar_url ?? null,
          slug: otherP?.profiles?.slug ?? null,
        }}
        animal={animal}
        initialMessages={(msgs ?? []).reverse()}
        initialHasMore={(msgs?.length ?? 0) === 40}
        blockedByMe={!!myBlock}
        blockedMe={!!blockedBetween && !myBlock}
      />
    </div>
  );
}
