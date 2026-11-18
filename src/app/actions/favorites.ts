"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ animalId: z.uuid(), favorite: z.boolean() });

export async function toggleFavorite(input: { animalId: string; favorite: boolean }) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { ok: false as const, error: "login" };

  const { animalId, favorite } = parsed.data;
  const { error } = favorite
    ? await supabase.from("favorites").upsert({ user_id: userId, animal_id: animalId }, { onConflict: "user_id,animal_id", ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", userId).eq("animal_id", animalId);
  if (error) return { ok: false as const, error: "Não foi possível atualizar seus favoritos." };
  revalidatePath("/painel/favoritos");
  return { ok: true as const };
}
