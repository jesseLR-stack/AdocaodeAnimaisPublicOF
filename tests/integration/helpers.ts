import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const CITY = { saoPaulo: 3550308, campinas: 3509502, rio: 3304557, manaus: 1302603 };

export const LEGAL = {
  termos_uso: "1.0",
  politica_privacidade: "1.0",
  diretrizes_comunidade: "1.0",
  politica_adocao: "1.0",
};

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, noSession);
}

export function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, noSession);
}

export type TestUser = { id: string; email: string; client: SupabaseClient };

const run = Date.now().toString(36);
let counter = 0;

export async function createUser(
  overrides: Record<string, unknown> = {},
): Promise<TestUser> {
  const email = `teste-${run}-${counter++}@adoteamigo.test`;
  const password = "SenhaForte!123";
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Pessoa Teste",
      birth_date: "1995-05-10",
      city_id: CITY.saoPaulo,
      profile_type: "pessoa_fisica",
      accepted_terms: LEGAL,
      ...overrides,
    },
  });
  if (error) throw error;
  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, email, client };
}

export function animalPayload(ownerId: string, extra: Record<string, unknown> = {}) {
  return {
    owner_id: ownerId,
    name: "Bolinha",
    species: "cachorro",
    age_group: "adulto",
    sex: "macho",
    size: "medio",
    description: "Cachorro muito dócil, adora brincar e passear no parque.",
    city_id: CITY.saoPaulo,
    vaccinated: "sim",
    neutered: "sim",
    ...extra,
  };
}
