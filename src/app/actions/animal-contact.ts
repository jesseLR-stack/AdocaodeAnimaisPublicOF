"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

type Result = { ok: true; data?: unknown } | { ok: false; error: string; login?: boolean };

function dbError(message: string) {
  if (message.includes("Limite")) return "Você atingiu o limite de ações por agora. Tente novamente mais tarde.";
  if (message.includes("adoption_interests_one_active") || message.includes("duplicate")) return "Você já demonstrou interesse neste animal.";
  // Mensagens das funções do banco já estão em português e são seguras para exibir.
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^{}]*\.$/.test(message)) return message;
  return "Não foi possível concluir a ação. Tente novamente.";
}

async function requireLogin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: (data?.claims?.sub as string | undefined) ?? null };
}

const interestSchema = z.object({
  animalId: z.uuid(),
  message: z.string().trim().min(10, "Escreva pelo menos 10 caracteres.").max(1500),
  housing: z.string().trim().max(500).optional(),
});

export async function registerInterest(input: z.input<typeof interestSchema>): Promise<Result> {
  const parsed = interestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };
  const { supabase, userId } = await requireLogin();
  if (!userId) return { ok: false, error: "Entre na sua conta para demonstrar interesse.", login: true };
  const { error } = await supabase.from("adoption_interests").insert({
    animal_id: parsed.data.animalId, interested_id: userId,
    message: parsed.data.message, housing_info: parsed.data.housing || null,
    // owner_id é preenchido pelo banco (gatilho) a partir do anúncio; o cliente não pode defini-lo.
  } as TablesInsert<"adoption_interests">);
  if (error) return { ok: false, error: dbError(error.message) };
  revalidatePath("/painel/interesses/enviados");
  return { ok: true };
}

export async function startConversation(animalId: string, message?: string): Promise<Result> {
  if (!z.uuid().safeParse(animalId).success) return { ok: false, error: "Anúncio inválido." };
  const text = message?.trim().slice(0, 2000) || null;
  const { supabase, userId } = await requireLogin();
  if (!userId) return { ok: false, error: "Entre na sua conta para conversar.", login: true };
  const { data, error } = await supabase.rpc("start_conversation", { p_animal: animalId, p_message: text ?? "" });
  if (error) return { ok: false, error: dbError(error.message) };
  redirect(`/painel/conversas/${data}`);
}

export async function revealWhatsapp(animalId: string): Promise<Result> {
  if (!z.uuid().safeParse(animalId).success) return { ok: false, error: "Anúncio inválido." };
  const { supabase, userId } = await requireLogin();
  if (!userId) return { ok: false, error: "Entre na sua conta para falar pelo WhatsApp.", login: true };
  const { data, error } = await supabase.rpc("get_animal_whatsapp", { p_animal: animalId });
  if (error) return { ok: false, error: dbError(error.message) };
  return { ok: true, data };
}

const reportSchema = z.object({
  targetType: z.enum(["animal", "usuario", "conversa"]),
  targetId: z.uuid(),
  reason: z.enum(["golpe", "venda_de_animal", "maus_tratos", "informacao_falsa", "spam", "conteudo_inadequado", "assedio", "outro"]),
  description: z.string().trim().max(2000).optional(),
});

export async function submitReport(input: z.input<typeof reportSchema>): Promise<Result> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Selecione um motivo." };
  const { supabase, userId } = await requireLogin();
  if (!userId) return { ok: false, error: "Entre na sua conta para denunciar.", login: true };
  const d = parsed.data;
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    target_type: d.targetType,
    animal_id: d.targetType === "animal" ? d.targetId : null,
    reported_user_id: d.targetType === "usuario" ? d.targetId : null,
    conversation_id: d.targetType === "conversa" ? d.targetId : null,
    reason: d.reason,
    description: d.description || null,
  });
  if (error) {
    if (error.message.includes("reports_one_open_per_reporter") || error.code === "23505")
      return { ok: false, error: "Você já tem uma denúncia em análise para este conteúdo." };
    return { ok: false, error: dbError(error.message) };
  }
  return { ok: true };
}
