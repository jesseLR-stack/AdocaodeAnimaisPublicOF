"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { chatFromInterest, updateInterest } from "@/app/actions/interests";
import { Button } from "@/components/ui/button";

export function ReceivedInterestActions({ id, status, conversationId }: { id: string; status: string; conversationId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string } | void>, success?: string) =>
    start(async () => {
      const res = await fn();
      if (res && !res.ok) return void toast.error(res.error);
      if (success) toast.success(success);
      router.refresh();
    });

  if (status === "cancelado") return <p className="text-sm text-muted-foreground">O interessado cancelou.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {conversationId ? (
        <Button size="sm" onClick={() => router.push(`/painel/conversas/${conversationId}`)}><MessageCircle /> Abrir conversa</Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => run(() => chatFromInterest(id))}><MessageCircle /> Conversar</Button>
      )}
      {status !== "aceito" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => updateInterest({ id, status: "aceito" }), "Interesse aceito para conversa.")}>
          <Check /> Aceitar
        </Button>
      )}
      {status !== "recusado" && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => {
          if (confirm("Marcar este interesse como não seguido adiante? O interessado será avisado de forma gentil.")) run(() => updateInterest({ id, status: "recusado" }), "Interesse atualizado.");
        }}>
          <X /> Recusar
        </Button>
      )}
      {pending && <Loader2 className="size-4 animate-spin self-center text-sage-500" />}
    </div>
  );
}

export function CancelInterestButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => {
      if (!confirm("Cancelar seu interesse neste animal?")) return;
      start(async () => {
        const res = await updateInterest({ id, status: "cancelado" });
        if (!res.ok) return void toast.error(res.error);
        toast.success("Interesse cancelado.");
        router.refresh();
      });
    }}>
      <X /> Cancelar interesse
    </Button>
  );
}

/** Marca como "visualizado" os interesses novos ao abrir a página. */
export function MarkInterestsSeen({ ids }: { ids: string[] }) {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || ids.length === 0) return;
    done.current = true;
    Promise.all(ids.map((id) => updateInterest({ id, status: "visualizado" }))).then(() => router.refresh());
  }, [ids, router]);
  return null;
}
