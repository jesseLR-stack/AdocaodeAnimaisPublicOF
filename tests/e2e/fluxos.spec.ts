/**
 * Fluxos principais do AdoteAmigo, executados num navegador real contra o Supabase local
 * populado com `npm run seed` (senha das contas de demonstração: Adote@2026).
 */
import { expect, test, type Browser, type Page } from "@playwright/test";
import path from "node:path";

const PASSWORD = process.env.SEED_PASSWORD ?? "Adote@2026";

async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/painel/);
}

async function newUserPage(browser: Browser, email: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email);
  return page;
}

test.describe("páginas públicas", () => {
  test("página inicial mostra animais e seções principais", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Uma nova história começa com uma");
    await expect(page.getByText("Eles estão chamando atenção")).toBeVisible();
    await expect(page.getByText("ONGs e protetores em destaque")).toBeVisible();
  });

  test("filtros do catálogo atualizam a URL e os resultados sem recarregar", async ({ page }) => {
    await page.goto("/animais");
    const before = await page.evaluate(() => performance.getEntriesByType("navigation").length);
    await page.getByRole("complementary", { name: "Filtros" }).getByRole("button", { name: "Gatos" }).click();
    await expect(page).toHaveURL(/especie=gato/);
    await expect(page.getByRole("link", { name: "Mel", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paçoca", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(before);
  });

  test("busca por distância encontra animais próximos", async ({ page }) => {
    // Campinas (3509502) fica a ~85 km de São Paulo.
    await page.goto("/animais?ref=3509502&refuf=SP&raio=100");
    await expect(page.getByRole("link", { name: "Paçoca", exact: true })).toBeVisible();
    await page.goto("/animais?ref=1302603&refuf=AM&raio=100");
    await expect(page.getByText("Nenhum animal com esses filtros")).toBeVisible();
  });

  test("página do animal indica informações veterinárias não verificadas", async ({ page }) => {
    await page.goto("/animais?q=pacoca");
    await page.getByRole("link", { name: "Paçoca", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Paçoca", level: 1 })).toBeVisible();
    await expect(page.getByText("Informações declaradas — não verificadas")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tenho interesse em adotar" })).toBeVisible();
  });

  test("visitante é redirecionado ao login ao acessar o painel", async ({ page }) => {
    await page.goto("/painel/favoritos");
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpainel%2Ffavoritos/);
  });
});

test.describe("usuário logado", () => {
  test("favoritar e remover dos favoritos", async ({ page }) => {
    await login(page, "adotante@adoteamigo.demo");
    await page.goto("/animais?q=luna");
    await page.getByRole("button", { name: "Adicionar aos favoritos" }).first().click();
    await expect(page.getByText("Adicionado aos favoritos")).toBeVisible();
    await page.goto("/painel/favoritos");
    await expect(page.getByRole("link", { name: "Luna", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Remover dos favoritos" }).first().click();
    await expect(page.getByText("Removido dos favoritos")).toBeVisible();
  });

  test("demonstrar interesse e o anunciante recebe", async ({ browser }) => {
    const adopter = await newUserPage(browser, "adotante@adoteamigo.demo");
    await adopter.goto("/animais?q=nino");
    await adopter.getByRole("link", { name: "Nino", exact: true }).click();
    await expect(adopter.getByRole("heading", { name: "Nino", level: 1 })).toBeVisible();
    const interestButton = adopter.getByRole("button", { name: "Tenho interesse em adotar" });
    await expect(interestButton.or(adopter.getByText("Você já demonstrou interesse"))).toBeVisible();
    if (await interestButton.isVisible()) {
      await adopter.getByRole("button", { name: "Tenho interesse em adotar" }).click();
      await adopter.fill("#int-housing", "Casa com quintal");
      await adopter.getByRole("button", { name: "Enviar interesse" }).click();
      await expect(adopter.getByText("Interesse enviado!")).toBeVisible();
    }
    await adopter.goto("/painel/interesses/enviados");
    await expect(adopter.getByRole("link", { name: "Nino", exact: true })).toBeVisible();

    const owner = await newUserPage(browser, "abrigo@adoteamigo.demo");
    await owner.goto("/painel/interesses/recebidos");
    await expect(owner.getByRole("link", { name: "Nino", exact: true })).toBeVisible();
    await expect(owner.getByText("Lucas Pereira").first()).toBeVisible();
  });

  test("chat em tempo real entre adotante e anunciante", async ({ browser }) => {
    const adopter = await newUserPage(browser, "adotante@adoteamigo.demo");
    const owner = await newUserPage(browser, "ong@adoteamigo.demo");
    await adopter.goto("/painel/conversas");
    await adopter.getByRole("link", { name: /Instituto Patas Unidas/ }).first().click();
    await adopter.waitForURL(/\/painel\/conversas\/[0-9a-f-]{36}/);
    const url = adopter.url();
    await owner.goto(url.replace(/^https?:\/\/[^/]+/, ""));
    await expect(owner.getByLabel("Mensagens").getByText("Posso visitar no sábado?")).toBeVisible();
    await expect(owner.locator('[data-realtime="on"]')).toBeAttached({ timeout: 15_000 });
    await expect(adopter.locator('[data-realtime="on"]')).toBeAttached({ timeout: 15_000 });

    const text = `Mensagem de teste ${Date.now()}`;
    await adopter.fill("#chat-input", text);
    await adopter.keyboard.press("Enter");
    await expect(adopter.getByLabel("Mensagens").getByText(text)).toBeVisible();
    // A outra pessoa recebe sem recarregar a página (Supabase Realtime).
    await expect(owner.getByLabel("Mensagens").getByText(text)).toBeVisible({ timeout: 15_000 });

    await owner.fill("#chat-input", "Pode sim! Venha às 10h. Faça o PIX da taxa antes.");
    await owner.keyboard.press("Enter");
    await expect(adopter.getByText("Atenção: esta mensagem menciona pagamento").last()).toBeVisible({ timeout: 15_000 });
  });

  test("botão do WhatsApp abre conversa com mensagem sobre o animal", async ({ page, context }) => {
    await login(page, "adotante@adoteamigo.demo");
    await page.goto("/animais?q=pacoca");
    await page.getByRole("link", { name: "Paçoca", exact: true }).click();
    await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, body: "ok" }));
    const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "WhatsApp" }).click()]);
    await popup.waitForURL(/wa\.me\/5511987654321/);
    expect(decodeURIComponent(popup.url())).toContain("Paçoca");
  });

  test("criar anúncio em etapas com foto e publicar", async ({ page }) => {
    await login(page, "protetora@adoteamigo.demo");
    await page.goto("/painel/anuncios/novo");
    const name = `Teste ${Date.now().toString().slice(-5)}`;

    // 1. Básico
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Informe o nome do animal.")).toBeVisible();
    await page.fill("#name", name);
    await page.getByRole("radio", { name: "Gato" }).click();
    await page.getByRole("radio", { name: /Filhote/ }).click();
    await page.getByRole("radio", { name: "Fêmea" }).click();
    await page.getByRole("radio", { name: "Pequeno" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    // 2. Detalhes
    await page.fill("#description", "Gatinha muito carinhosa, resgatada da chuva e pronta para um lar cheio de amor.");
    await page.getByRole("button", { name: "Carinhoso" }).click();
    await page.selectOption("#vaccinated", "parcial");
    await page.getByRole("button", { name: "Continuar" }).click();

    // 3. Fotos
    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../fixtures/foto-teste.png"));
    await expect(page.getByText("Principal")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Continuar" }).click();

    // 4. Local (pré-preenchido com a cidade do perfil)
    await page.fill("#region", "Savassi");
    await page.getByRole("button", { name: "Continuar" }).click();

    // 5. Contato
    await page.getByRole("button", { name: "Continuar" }).click();

    // 6. Revisão
    await expect(page.getByText("Revisão e publicação")).toBeVisible();
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "Publicar anúncio" }).click();
    await page.waitForURL(/\/animais\/teste-/);
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
    await expect(page.getByRole("img", { name: `Foto de ${name}` }).first()).toBeVisible();
    await expect(page.getByText("Este é o seu anúncio")).toBeVisible();
  });
});

test.describe("celular @mobile", () => {
  test("barra de navegação inferior e filtros em gaveta @mobile", async ({ page }) => {
    await page.goto("/animais");
    await expect(page.getByRole("navigation", { name: "Navegação rápida" })).toBeVisible();
    await page.getByRole("button", { name: "Abrir filtros" }).click();
    await expect(page.getByRole("dialog").getByText("Filtros", { exact: true })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Cães" }).click();
    await expect(page).toHaveURL(/especie=cachorro/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
