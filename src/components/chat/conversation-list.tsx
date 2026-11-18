import Link from "next/link";
import { Ban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, storageUrl, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ConversationSummary = {
  conversation_id: string; animal_name: string | null; other_user_name: string; other_user_avatar: string | null;
  last_message_at: string; last_message_preview: string | null; unread_count: number; is_blocked: boolean;
};

export function ConversationList({ items, activeId }: { items: ConversationSummary[]; activeId?: string }) {
  return (
    <ul className="divide-y divide-border/70">
      {items.map((c) => (
        <li key={c.conversation_id}>
          <Link
            href={`/painel/conversas/${c.conversation_id}`}
            aria-current={c.conversation_id === activeId ? "page" : undefined}
            className={cn("flex gap-3 px-4 py-3.5 transition hover:bg-cream-100", c.conversation_id === activeId && "bg-sage-50")}
          >
            <Avatar className="size-12">
              {c.other_user_avatar && <AvatarImage src={storageUrl(c.other_user_avatar, { bucket: "avatars" }) ?? undefined} alt="" />}
              <AvatarFallback>{initials(c.other_user_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={cn("truncate text-sage-900", c.unread_count > 0 ? "font-bold" : "font-semibold")}>{c.other_user_name}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
              </div>
              {c.animal_name && <p className="truncate text-xs font-semibold text-apricot-600">sobre {c.animal_name}</p>}
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate text-sm", c.unread_count > 0 ? "text-sage-900" : "text-muted-foreground")}>
                  {c.is_blocked ? <span className="flex items-center gap-1"><Ban className="size-3.5" /> Bloqueado</span> : c.last_message_preview ?? "Conversa iniciada"}
                </p>
                {c.unread_count > 0 && (
                  <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-apricot-400 px-1.5 text-[11px] font-bold text-white">{c.unread_count}</span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
