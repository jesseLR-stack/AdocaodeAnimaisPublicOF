import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type StaffRole = Database["public"]["Enums"]["staff_role"];

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Profile;
  staffRole: StaffRole | null;
  permissions: string[];
};

/** Usuário autenticado (validado no servidor) com perfil e papel da equipe. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("admin_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile) return null;

  let permissions: string[] = [];
  if (role) {
    const { data } = await supabase.from("staff_permissions").select("permission").eq("role", role.role);
    permissions = (data ?? []).map((p) => p.permission);
  }
  return {
    id: userId,
    email: (claims.claims.email as string | undefined) ?? null,
    profile,
    staffRole: role?.role ?? null,
    permissions,
  };
});

export async function requireUser(redirectTo = "/painel") {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?redirect=${encodeURIComponent(redirectTo)}`);
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireUser("/admin");
  if (!user.permissions.includes(permission)) redirect("/painel?erro=sem-permissao");
  return user;
}
