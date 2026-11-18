"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { LEGAL_VERSIONS } from "@/lib/constants";
import {
  emailSchema, resetPasswordSchema, safeRedirect, signInSchema, signUpSchema, translateAuthError,
} from "@/lib/validation/auth";

export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const fields = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.includes("password") && !k.startsWith("$")).map(([k, v]) => [k, String(v)]));

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: fields(formData) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translateAuthError(error.message), values: fields(formData) };
  revalidatePath("/", "layout");
  redirect(safeRedirect(formData.get("redirect")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: fields(formData) };
  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/painel`,
      data: {
        full_name: d.full_name,
        birth_date: d.birth_date,
        city_id: d.city_id,
        profile_type: d.profile_type,
        phone: d.phone || null,
        // O banco valida estas versões e registra data/versão do aceite em terms_acceptances.
        accepted_terms: LEGAL_VERSIONS,
      },
    },
  });
  if (error) return { error: translateAuthError(error.message), values: fields(formData) };
  // Supabase não revela se o e-mail já existe (proteção contra enumeração): identities vazio.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.", values: fields(formData) };
  }
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/painel?bem-vindo=1");
  }
  return { ok: true, message: d.email };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: fields(formData) };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/redefinir-senha`,
  });
  // Mesmo em caso de e-mail inexistente respondemos igual (evita enumeração de contas).
  if (error && error.message.toLowerCase().includes("rate")) return { error: translateAuthError(error.message) };
  return { ok: true };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Link expirado. Solicite uma nova recuperação de senha." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: translateAuthError(error.message) };
  return { ok: true };
}

export async function resendConfirmation(email: string) {
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup", email: parsed.data.email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/painel` },
  });
  return { ok: !error, error: error ? translateAuthError(error.message) : undefined };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
