"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type R = { ok: true } | { ok: false; error: string };
const reason = z.string().trim().min(3, "Informe o motivo (mínimo 3 caracteres).").max(500);

function fail(message: string): R {
  if (message.includes("Permissão negada")) return { ok: false, error: "Você não tem permissão para esta ação." };
  if (/^[A-ZÁÉÍÓÚ][^{}]*\.$/.test(message)) return { ok: false, error: message };
  return { ok: false, error: "Não foi possível concluir a ação." };
}

function done(): R {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminSetAnimalStatus(id: string, status: "disponivel" | "pausado" | "adotado" | "suspenso" | "removido", why: string): Promise<R> {
  const p = z.object({ id: z.uuid(), why: reason }).safeParse({ id, why });
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const { error } = await (await createClient()).rpc("admin_set_animal_status", { p_animal: id, p_status: status, p_reason: why });
  return error ? fail(error.message) : done();
}

export async function adminFlagInappropriate(id: string, why: string): Promise<R> {
  const p = z.object({ id: z.uuid(), why: reason }).safeParse({ id, why });
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const { error } = await (await createClient()).rpc("admin_flag_inappropriate", { p_animal: id, p_reason: why });
  return error ? fail(error.message) : done();
}

export async function adminClearFlags(id: string, why: string): Promise<R> {
  const { error } = await (await createClient()).rpc("admin_clear_animal_flags", { p_animal: id, p_reason: why || "Sinalização revisada" });
  return error ? fail(error.message) : done();
}

export async function adminSetHealthVerified(id: string, verified: boolean, why: string): Promise<R> {
  const { error } = await (await createClient()).rpc("admin_set_health_verified", { p_animal: id, p_verified: verified, p_reason: why || "Documentos conferidos" });
  return error ? fail(error.message) : done();
}

export async function adminEditAnimal(id: string, name: string, description: string, why: string): Promise<R> {
  const p = z.object({
    name: z.string().trim().min(1).max(60), description: z.string().trim().min(20, "Descrição muito curta.").max(3000), why: reason,
  }).safeParse({ name, description, why });
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const { error } = await (await createClient()).rpc("admin_update_animal", { p_animal: id, p_name: name, p_description: description, p_reason: why });
  return error ? fail(error.message) : done();
}

export async function adminSetUserStatus(id: string, status: "ativo" | "suspenso" | "bloqueado", why: string): Promise<R> {
  const p = z.object({ id: z.uuid(), why: reason }).safeParse({ id, why });
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const { error } = await (await createClient()).rpc("admin_set_user_status", { p_user: id, p_status: status, p_reason: why });
  return error ? fail(error.message) : done();
}

export async function adminSetVerified(id: string, verified: boolean, why: string): Promise<R> {
  const { error } = await (await createClient()).rpc("admin_set_profile_verified", { p_user: id, p_verified: verified, p_reason: why || (verified ? "Verificação aprovada" : "Verificação recusada") });
  return error ? fail(error.message) : done();
}

export async function adminUpdateReport(id: string, status: "pendente" | "em_analise" | "procedente" | "improcedente", note: string): Promise<R> {
  const { error } = await (await createClient()).rpc("admin_update_report", { p_report: id, p_status: status, p_note: note || "" });
  return error ? fail(error.message) : done();
}

export async function adminMarkContactHandled(id: string): Promise<R> {
  const { error } = await (await createClient()).rpc("admin_mark_contact_handled", { p_id: id });
  return error ? fail(error.message) : done();
}
