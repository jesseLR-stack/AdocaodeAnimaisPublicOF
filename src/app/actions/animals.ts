"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { animalSchema, type AnimalFormInput } from "@/lib/validation/animal";
import { thumbPath, toWhatsappNumber } from "@/lib/format";
import type { TablesInsert } from "@/types/database";

type SaveResult = { ok: true; slug: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function friendly(message: string) {
  if (message.includes("Limite")) return "Você atingiu o limite de anúncios por dia. Tente novamente amanhã.";
  if (message.includes("bloqueado pela moderação")) return "Este anúncio está bloqueado pela moderação e não pode ser editado.";
  if (message.includes("não pode publicar") || message.includes("não pode editar")) return "Sua conta não pode publicar ou editar anúncios no momento.";
  if (message.includes("10 fotos")) return "Limite de 10 fotos por animal.";
  return "Não foi possível salvar o anúncio. Revise os dados e tente novamente.";
}

export async function saveAnimal(input: AnimalFormInput, mode: "create" | "update"): Promise<SaveResult> {
  const parsed = animalSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Revise os campos destacados.", fieldErrors };
  }
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const { id, basic, details, photos, location, contact } = parsed.data;
  const prefix = `${userId}/${id}/`;
  if (photos.images.some((img) => !img.path.startsWith(prefix))) return { ok: false, error: "Imagem inválida." };

  const fields = {
    ...basic,
    ...details,
    city_id: location.city_id,
    region: location.region,
    contact_preference: contact.contact_preference,
    accepts_messages: contact.accepts_messages,
    special_needs_details: details.special_needs ? details.special_needs_details : null,
    species_other: basic.species === "outro" ? basic.species_other : null,
  };

  let slug: string;
  if (mode === "create") {
    const { data, error } = await supabase
      .from("animals")
      .insert({ id, owner_id: userId, ...fields } as TablesInsert<"animals">)
      .select("slug")
      .single();
    if (error) return { ok: false, error: friendly(error.message) };
    slug = data.slug;
  } else {
    const { data, error } = await supabase.from("animals").update(fields).eq("id", id).eq("owner_id", userId).select("slug").maybeSingle();
    if (error) return { ok: false, error: friendly(error.message) };
    if (!data) return { ok: false, error: "Anúncio não encontrado." };
    slug = data.slug;
  }

  // Contato: o número só é guardado se o anunciante autorizou o WhatsApp.
  if (contact.contact_preference === "chat") {
    await supabase.from("animal_contacts").delete().eq("animal_id", id);
  } else {
    const { error } = await supabase.from("animal_contacts").upsert({ animal_id: id, whatsapp: toWhatsappNumber(contact.whatsapp ?? "") });
    if (error) return { ok: false, error: "WhatsApp inválido." };
  }

  // Fotos: remove as excluídas, adiciona as novas e reordena.
  const { data: existing } = await supabase.from("animal_images").select("id, storage_path").eq("animal_id", id);
  const keep = new Set(photos.images.map((i) => i.path));
  const removed = (existing ?? []).filter((e) => !keep.has(e.storage_path));
  if (removed.length) {
    await supabase.from("animal_images").delete().in("id", removed.map((r) => r.id));
    await supabase.storage.from("animal-images").remove(removed.flatMap((r) => [r.storage_path, thumbPath(r.storage_path)]));
  }
  const existingPaths = new Map((existing ?? []).map((e) => [e.storage_path, e.id]));
  const toInsert = photos.images
    .map((img, position) => ({ img, position }))
    .filter(({ img }) => !existingPaths.has(img.path))
    .map(({ img, position }) => ({
      animal_id: id, storage_path: img.path, position, is_primary: false,
      width: img.width ?? null, height: img.height ?? null, alt_text: `Foto de ${basic.name}`,
    }));
  if (toInsert.length) {
    const { error } = await supabase.from("animal_images").insert(toInsert);
    if (error) return { ok: false, error: friendly(error.message) };
  }
  for (const [position, img] of photos.images.entries()) {
    const imgId = existingPaths.get(img.path);
    if (imgId) await supabase.from("animal_images").update({ position }).eq("id", imgId);
  }
  const primaryPath = photos.primary && keep.has(photos.primary) ? photos.primary : photos.images[0]?.path;
  if (primaryPath) {
    const { data: primary } = await supabase.from("animal_images").select("id").eq("animal_id", id).eq("storage_path", primaryPath).single();
    if (primary) await supabase.rpc("set_primary_image", { p_image: primary.id });
  }

  revalidatePath("/painel/anuncios");
  revalidatePath(`/animais/${slug}`);
  revalidatePath("/");
  return { ok: true, slug };
}

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["disponivel", "pausado", "adotado", "removido"]),
});

export async function setAnimalStatus(id: string, status: string) {
  const parsed = statusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false as const, error: "Status inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("animals").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("slug").maybeSingle();
  if (error) return { ok: false as const, error: friendly(error.message) };
  if (!data) return { ok: false as const, error: "Anúncio não encontrado." };
  revalidatePath("/painel/anuncios");
  revalidatePath(`/animais/${data.slug}`);
  return { ok: true as const };
}

const storySchema = z.object({
  animalId: z.uuid(),
  title: z.string().trim().min(3, "Informe um título.").max(100),
  body: z.string().trim().min(20, "Conte um pouco mais (mínimo 20 caracteres).").max(2000),
});

export async function publishStory(input: z.input<typeof storySchema>) {
  const parsed = storySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]!.message };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { ok: false as const, error: "Sessão expirada." };
  const { error } = await supabase.from("adoption_stories").insert({
    animal_id: parsed.data.animalId, author_id: userId, title: parsed.data.title, body: parsed.data.body,
  });
  if (error) return { ok: false as const, error: "Não foi possível publicar a história." };
  revalidatePath("/adotados");
  revalidatePath("/");
  return { ok: true as const };
}
