"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function setBlocked(userId: string, blocked: boolean) {
  if (!z.uuid().safeParse(userId).success) return { ok: false as const, error: "Usuário inválido." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims?.sub as string | undefined;
  if (!me) return { ok: false as const, error: "Sessão expirada." };
  const { error } = blocked
    ? await supabase.from("user_blocks").upsert({ blocker_id: me, blocked_id: userId }, { ignoreDuplicates: true })
    : await supabase.from("user_blocks").delete().eq("blocker_id", me).eq("blocked_id", userId);
  if (error) return { ok: false as const, error: "Não foi possível atualizar o bloqueio." };
  revalidatePath("/painel/conversas", "layout");
  return { ok: true as const };
}
