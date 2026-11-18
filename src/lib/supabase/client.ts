"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Cliente do Supabase para componentes do navegador (singleton). */
export function createClient() {
  browserClient ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}

/**
 * Garante que o Realtime use o token do usuário logado (necessário para que o RLS
 * libere os eventos de mensagens e notificações) antes de assinar um canal.
 */
export async function authenticateRealtime() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
  return supabase;
}
