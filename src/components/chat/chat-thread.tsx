"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Ban, Flag, Loader2, MoreVertical, SendHorizontal, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { setBlocked } from "@/app/actions/chat";
import { ReportDialog } from "@/components/animals/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatTime, initials, storageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ChatMessage = { id: string; sender_id: string | null; body: string; created_at: string; flagged: boolean };

const PAGE = 40;

export function ChatThread({
  conversationId, me, other, animal, initialMessages, initialHasMore, blockedByMe, blockedMe,
}: {
  conversationId: string;
  me: string;
  other: { id: string | null; name: string; avatar: string | null; slug: string | null };
  animal: { name: string; slug: string } | null;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  blockedByMe: boolean;
  blockedMe: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [blocked, setBlockedState] = useState(blockedByMe);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const markRead = useCallback(() => {
    supabase.rpc("mark_conversation_read", { p_conversation: conversationId }).then(() => router.refresh());
  }, [supabase, conversationId, router]);

  useEffect(() => {
    markRead();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== me) markRead();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, me, markRead]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function loadOlder() {
    const oldest = messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    const el = scroller.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const { data } = await supabase
      .from("messages").select("id, sender_id, body, created_at, flagged")
      .eq("conversation_id", conversationId).lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false }).limit(PAGE);
    const older = (data ?? []).reverse();
    stickToBottom.current = false;
    setMessages((prev) => [...older, ...prev]);
    setHasMore(older.length === PAGE);
    setLoadingOlder(false);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
      stickToBottom.current = true;
    });
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: me, body })
      .select("id, sender_id, body, created_at, flagged")
      .single();
    setSending(false);
    if (error) {
      toast.error(error.message.includes("Limite") ? "Você está enviando mensagens rápido demais. Aguarde um pouco." :
        error.message.includes("bloque") || error.message.includes("Não é possível") ? "Não é possível enviar mensagens nesta conversa." :
        "Mensagem não enviada. Tente novamente.");
      return;
    }
    stickToBottom.current = true;
    setText("");
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
  }

  async function toggleBlock() {
    if (!other.id) return;
    const next = !blocked;
    if (next && !confirm(`Bloquear ${other.name}? Nenhum de vocês poderá enviar mensagens nesta conversa.`)) return;
    const res = await setBlocked(other.id, next);
    if (!res.ok) return void toast.error(res.error);
    setBlockedState(next);
    toast.success(next ? "Usuário bloqueado." : "Usuário desbloqueado.");
  }

  const cannotSend = blocked || blockedMe || !other.id;
  const dayLabels = messages.map((m, i) => {
    const day = formatDate(m.created_at);
    return i === 0 || formatDate(messages[i - 1]!.created_at) !== day ? day : null;
  });

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-border/60 lg:h-[calc(100dvh-9rem)]">
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 border-b border-border/70 px-3 py-3 sm:px-4">
        <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="Voltar para conversas">
          <Link href="/painel/conversas"><ArrowLeft className="size-5" /></Link>
        </Button>
        <Avatar className="size-11">
          {other.avatar && <AvatarImage src={storageUrl(other.avatar, { bucket: "avatars" }) ?? undefined} alt="" />}
          <AvatarFallback>{initials(other.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {other.slug ? (
            <Link href={`/protetores/${other.slug}`} className="block truncate font-semibold text-sage-900 hover:underline">{other.name}</Link>
          ) : <p className="truncate font-semibold text-sage-900">{other.name}</p>}
          {animal && <Link href={`/animais/${animal.slug}`} className="block truncate text-xs font-semibold text-apricot-600 hover:underline">sobre {animal.name}</Link>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Opções da conversa"><MoreVertical className="size-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {other.id && (
              <DropdownMenuItem onSelect={toggleBlock}><Ban /> {blocked ? "Desbloquear usuário" : "Bloquear usuário"}</DropdownMenuItem>
            )}
            <ReportDialog
              targetType="conversa"
              targetId={conversationId}
              isLoggedIn
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Flag /> Denunciar conversa</DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mensagens */}
      <div ref={scroller} className="flex-1 overflow-y-auto bg-cream-50 px-3 py-4 sm:px-6" aria-live="polite" aria-label="Mensagens">
        <div className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-2xl bg-sage-50 p-3 text-xs text-sage-800 ring-1 ring-sage-100">
          <ShieldCheck className="size-4 shrink-0 text-sage-600" />
          <p>Por segurança, não compartilhe senhas ou dados bancários e <strong>nunca faça pagamentos</strong> para adotar.</p>
        </div>
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder && <Loader2 className="animate-spin" />} Carregar mensagens anteriores
            </Button>
          </div>
        )}
        <ol className="space-y-1.5">
          {messages.map((m, i) => {
            const mine = m.sender_id === me;
            const day = dayLabels[i];
            return (
              <li key={m.id}>
                {day && <p className="my-4 text-center text-xs font-semibold text-muted-foreground">{day}</p>}
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[82%] animate-fade-up rounded-3xl px-4 py-2.5 shadow-soft sm:max-w-[70%]",
                    mine ? "rounded-br-lg bg-sage-600 text-white" : "rounded-bl-lg bg-white text-sage-900 ring-1 ring-border/60",
                  )}>
                    <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{m.body}</p>
                    <p className={cn("mt-0.5 text-right text-[11px]", mine ? "text-sage-100" : "text-muted-foreground")}>
                      <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
                    </p>
                  </div>
                </div>
                {m.flagged && !mine && (
                  <p className="mt-1 ml-2 flex items-center gap-1 text-xs font-medium text-apricot-600">
                    <AlertTriangle className="size-3.5" /> Atenção: esta mensagem menciona pagamento, links ou telefone. Desconfie de cobranças.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Envio */}
      {cannotSend ? (
        <p className="border-t border-border/70 p-4 text-center text-sm text-muted-foreground">
          {blocked ? "Você bloqueou este usuário. Desbloqueie para voltar a conversar." :
            blockedMe ? "Não é possível enviar mensagens nesta conversa." : "Este usuário não está mais disponível."}
        </p>
      ) : (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-border/70 p-3">
          <label htmlFor="chat-input" className="sr-only">Mensagem</label>
          <textarea
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Escreva uma mensagem…"
            className="max-h-36 min-h-12 flex-1 resize-none rounded-3xl border-2 border-input bg-white px-4 py-3 text-[15px] outline-none field-sizing-content focus-visible:border-sage-400"
          />
          <Button type="submit" size="icon" className="size-12 shrink-0" disabled={!text.trim() || sending} aria-label="Enviar">
            {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </Button>
        </form>
      )}
    </div>
  );
}
