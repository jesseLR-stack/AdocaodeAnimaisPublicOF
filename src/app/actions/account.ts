"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordSchema, translateAuthError } from "@/lib/validation/auth";
import type { FormState } from "./auth";

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub as string | undefined, email: data?.claims?.email as string | undefined };
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome.").max(80),
  bio: z.string().trim().max(600).optional(),
  profile_type: z.enum(["pessoa_fisica", "protetor_independente", "ong_abrigo", "organizacao_parceira"]),
  city_id: z.coerce.number().int().positive("Selecione a cidade."),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v === "" || (v.length >= 10 && v.length <= 11), "Telefone inválido.").optional(),
  org_name: z.string().trim().max(120).optional(),
  org_description: z.string().trim().max(2000).optional(),
  org_website: z.union([z.literal(""), z.url("URL inválida.").max(200).refine((u) => u.startsWith("https://") || u.startsWith("http://"), "Use http(s)://")]).optional(),
  org_instagram: z.string().trim().max(40).regex(/^@?[\w.]*$/, "Usuário inválido.").optional(),
  org_cnpj: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v === "" || v.length === 14, "CNPJ deve ter 14 dígitos.").optional(),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, userId } = await session();
  if (!userId) return { error: "Sessão expirada." };
  const d = parsed.data;
  const { error } = await supabase.from("profiles").update({
    full_name: d.full_name, bio: d.bio || null, profile_type: d.profile_type, city_id: d.city_id,
  }).eq("id", userId);
  if (error) return { error: "Não foi possível salvar o perfil." };
  await supabase.from("profiles_private").update({ phone: d.phone || null }).eq("id", userId);

  if (d.profile_type === "ong_abrigo" || d.profile_type === "organizacao_parceira") {
    const org = {
      name: d.org_name || d.full_name, description: d.org_description || null, website: d.org_website || null,
      instagram: d.org_instagram ? d.org_instagram.replace(/^@?/, "@") : null, cnpj: d.org_cnpj || null, city_id: d.city_id,
    };
    const { data: existing } = await supabase.from("organizations").select("id").eq("owner_id", userId).maybeSingle();
    const res = existing
      ? await supabase.from("organizations").update(org).eq("id", existing.id)
      : await supabase.from("organizations").insert({ ...org, owner_id: userId } as never);
    if (res.error) return { error: "Perfil salvo, mas não foi possível salvar os dados da organização." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil atualizado!" };
}

export async function setAvatar(path: string | null) {
  const { supabase, userId } = await session();
  if (!userId) return { ok: false as const, error: "Sessão expirada." };
  if (path && !new RegExp(`^${userId}/avatar-[\\w-]+\\.webp$`).test(path)) return { ok: false as const, error: "Imagem inválida." };
  const { data: current } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single();
  const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
  if (error) return { ok: false as const, error: "Não foi possível atualizar a foto." };
  if (current?.avatar_url && current.avatar_url !== path) await supabase.storage.from("avatars").remove([current.avatar_url]);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function requestVerification(message: string) {
  const { supabase, userId } = await session();
  if (!userId) return { ok: false as const, error: "Sessão expirada." };
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", userId).maybeSingle();
  if (!org) return { ok: false as const, error: "Salve os dados da organização antes de solicitar a verificação." };
  const { error } = await supabase.from("organization_verifications").insert({
    organization_id: org.id, requested_by: userId, message: message.trim().slice(0, 2000) || null,
  });
  if (error) return { ok: false as const, error: error.code === "23505" ? "Já existe uma solicitação em análise." : "Não foi possível enviar a solicitação." };
  revalidatePath("/painel/perfil");
  return { ok: true as const };
}

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Informe a senha atual."),
  password: passwordSchema,
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { path: ["confirm_password"], message: "As senhas não conferem." });

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, email } = await session();
  if (!email) return { error: "Sessão expirada." };
  const check = await supabase.auth.signInWithPassword({ email, password: parsed.data.current_password });
  if (check.error) return { fieldErrors: { current_password: ["Senha atual incorreta."] } };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: translateAuthError(error.message) };
  return { ok: true, message: "Senha alterada com sucesso." };
}

export async function exportMyData() {
  const { supabase, userId } = await session();
  if (!userId) return { ok: false as const, error: "Sessão expirada." };
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return { ok: false as const, error: "Não foi possível gerar a exportação." };
  return { ok: true as const, data };
}

/** Exclusão definitiva da conta (LGPD art. 18, VI). Exige a senha e a confirmação por texto. */
export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  const confirmText = String(formData.get("confirm") ?? "");
  const password = String(formData.get("password") ?? "");
  if (confirmText.trim().toUpperCase() !== "EXCLUIR") return { fieldErrors: { confirm: ["Digite EXCLUIR para confirmar."] } };
  const { supabase, userId, email } = await session();
  if (!userId || !email) return { error: "Sessão expirada." };
  const check = await supabase.auth.signInWithPassword({ email, password });
  if (check.error) return { fieldErrors: { password: ["Senha incorreta."] } };

  const admin = createAdminClient();
  const { data: role } = await admin.from("admin_roles").select("role").eq("user_id", userId).maybeSingle();
  if (role?.role === "admin") return { error: "Contas de administrador devem ser removidas por outro administrador." };

  // Remove arquivos do usuário no Storage (fotos de anúncios e avatar).
  for (const bucket of ["animal-images", "avatars"]) {
    const folders = bucket === "avatars" ? [userId] : [userId, ...((await admin.storage.from(bucket).list(userId)).data ?? []).map((f) => `${userId}/${f.name}`)];
    for (const folder of folders) {
      const { data: files } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
      const paths = (files ?? []).filter((f) => f.id).map((f) => `${folder}/${f.name}`);
      if (paths.length) await admin.storage.from(bucket).remove(paths);
    }
  }
  // Apaga o usuário no Auth: o banco remove em cascata perfil, anúncios, favoritos e interesses.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Não foi possível excluir a conta. Tente novamente ou fale conosco." };
  await supabase.auth.signOut();
  redirect("/?conta-excluida=1");
}

export async function markNotificationsRead(ids?: string[]) {
  const { supabase, userId } = await session();
  if (!userId) return;
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  await q;
  revalidatePath("/painel", "layout");
}
