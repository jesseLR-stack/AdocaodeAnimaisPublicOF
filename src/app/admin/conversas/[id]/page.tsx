import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Conversa denunciada" };

/** Leitura (somente) de conversa denunciada. O RLS só libera conversas com denúncia. */
export default async function AdminConversaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("conversations.review");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: parts }, { data: msgs }] = await Promise.all([
    supabase.from("conversation_participants").select("user_id, profiles(full_name)").eq("conversation_id", id),
    supabase.from("messages").select("id, sender_id, body, created_at, flagged").eq("conversation_id", id).order("created_at"),
  ]);
  if (!parts?.length) notFound();
  const names = new Map(parts.map((p) => [p.user_id, (p.profiles as unknown as { full_name: string } | null)?.full_name ?? "Usuário"]));
  return (
    <>
      <AdminHeader title="Conversa denunciada" description="Acesso restrito à moderação e registrado. Somente leitura." />
      <ol className="space-y-2 rounded-2xl bg-white p-5 ring-1 ring-border/60">
        {(msgs ?? []).map((m) => (
          <li key={m.id} className={`rounded-xl p-3 text-sm ${m.flagged ? "bg-apricot-100" : "bg-cream-100"}`}>
            <p className="font-semibold text-sage-900">{m.sender_id ? names.get(m.sender_id) ?? "Usuário" : "Usuário removido"} <span className="font-normal text-muted-foreground">· {formatDateTime(m.created_at)}</span></p>
            <p className="whitespace-pre-wrap text-sage-800">{m.body}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
