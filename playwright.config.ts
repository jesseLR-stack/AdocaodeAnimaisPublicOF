import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta. Requer o Supabase local (`npm run db:start`) com dados de
 * demonstração (`npm run seed`) e o app rodando em http://localhost:3000 (`npm run dev`).
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "off", locale: "pt-BR" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
