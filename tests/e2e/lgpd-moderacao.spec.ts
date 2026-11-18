/**
 * Direitos do titular (exportar e excluir conta) e fluxo de moderação.
 */
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";

config({ path: ".env.local" });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const LEGAL = { termos_uso: "1.0", politica_privacidade: "1.0", diretrizes_comunidade: "1.0", politica_adocao: "1.0" };

test("titular exporta os dados e exclui a conta", async ({ page }) => {
  const email = `lgpd-${Date.now()}@teste.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: "SenhaForte1", email_confirm: true,
    user_metadata: { full_name: "Titular Teste", birth_date: "1990-01-01", city_id: 3550308, accepted_terms: LEGAL },
  });
  expect(error).toBeNull();
  const userId = data.user!.id;

  await page.goto("/entrar");
  await page.fill("#email", email);
  await page.fill("#password", "SenhaForte1");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/painel/);
  await page.goto("/painel/configuracoes");
  await expect(page.getByText("Termos de Uso (v1.0)")).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Baixar meus dados/ }).click()]);
  const json = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(json.perfil.full_name).toBe("Titular Teste");
  expect(json.aceites).toHaveLength(4);

  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  await page.fill("#del-password", "SenhaForte1");
  await page.fill("#del-confirm", "EXCLUIR");
  await page.getByRole("button", { name: "Excluir permanentemente" }).click();
  await page.waitForURL(/conta-excluida/);
  const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  expect(profile).toBeNull();
});

test("moderador suspende anúncio denunciado e a ação fica na auditoria", async ({ page }) => {
  await page.goto("/entrar");
  await page.fill("#email", "admin@adoteamigo.demo");
  await page.fill("#password", process.env.SEED_PASSWORD ?? "Adote@2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/painel/);
  await page.goto("/admin/anuncios?q=Fred");
  await page.getByRole("button", { name: "Suspender", exact: true }).first().click();
  await page.fill("#reason", "Teste automatizado de moderação");
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Ação registrada.")).toBeVisible();
  await expect(page.getByText("Motivo: Teste automatizado de moderação").first()).toBeVisible();

  // Anúncio some do catálogo público.
  const anon = await page.context().browser()!.newContext();
  const pub = await anon.newPage();
  await pub.goto("/animais?q=fred");
  await expect(pub.getByText("Nenhum animal com esses filtros")).toBeVisible();
  await anon.close();

  await page.goto("/admin/auditoria");
  await expect(page.getByRole("cell", { name: "Teste automatizado de moderação" }).first()).toBeVisible();

  // Restaura para manter os dados de demonstração.
  await page.goto("/admin/anuncios?q=Fred");
  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Ação registrada.")).toBeVisible();
});
