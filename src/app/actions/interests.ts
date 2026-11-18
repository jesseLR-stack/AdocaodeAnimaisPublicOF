"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(["visualizado", "aceito", "recusado", "cancelado"]),
  note: z.string().trim().max(500).optional(),
});

export async function updateInterest(input: z.input<typeof updateSchema>) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const supabase = await createClient();
  const patch: { status: typeof parsed.data.status; owner_note?: string | null } = { status: parsed.data.status };
  if (parsed.data.status !== "cancelado" && parsed.data.note !== undefined) patch.owner_note = parsed.data.note || null;
  const { error } = await supabase.from("adoption_interests").update(patch).eq("id", parsed.data.id);
  if (error) return { ok: false as const, error: "Não foi possível atualizar o interesse." };
  revalidatePath("/painel/interesses/recebidos");
  revalidatePath("/painel/interesses/enviados");
  return { ok: true as const };
}

export async function chatFromInterest(id: string) {
  if (!z.uuid().safeParse(id).success) return { ok: false as const, error: "Interesse inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation_from_interest", { p_interest: id });
  if (error) return { ok: false as const, error: "Não foi possível iniciar a conversa." };
  redirect(`/painel/conversas/${data}`);
}
