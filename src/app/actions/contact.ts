"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clientIpHash } from "@/lib/request";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.email("E-mail inválido.").max(160),
  subject: z.string().trim().min(2, "Informe o assunto.").max(120),
  message: z.string().trim().min(10, "Escreva pelo menos 10 caracteres.").max(4000),
  website: z.string().max(0).optional(), // honeypot anti-robô
});

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[]> };

export async function sendContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true };
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const admin = createAdminClient();
  const ipHash = await clientIpHash();

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("contact_messages").select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash).gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: "Você enviou muitas mensagens. Tente novamente em uma hora." };

  const { website: _hp, ...data } = parsed.data;
  const { error } = await admin.from("contact_messages").insert({
    ...data, ip_hash: ipHash, user_id: (claims?.claims?.sub as string | undefined) ?? null,
  });
  if (error) return { error: "Não foi possível enviar agora. Tente novamente." };
  return { ok: true };
}
