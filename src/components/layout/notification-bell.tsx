"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Sino de notificações com atualização em tempo real (Supabase Realtime). */
export function NotificationBell({ userId, initialCount }: { userId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => setCount(initialCount), [initialCount]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setCount((c) => c + 1);
          const n = payload.new as { title: string; body: string | null };
          toast(n.title, { description: n.body ?? undefined });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/painel/notificacoes"
      className="relative inline-flex size-10 items-center justify-center rounded-full text-sage-800 transition hover:bg-sage-100"
      aria-label={count > 0 ? `${count} notificações não lidas` : "Notificações"}
    >
      <Bell className="size-5" />
      {count > 0 && (
        <span
          key={count}
          className={cn(
            "absolute top-1 right-1 flex min-w-5 animate-pop items-center justify-center rounded-full bg-apricot-500 px-1 text-[11px] font-bold text-white ring-2 ring-cream-100",
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
