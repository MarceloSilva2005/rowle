import { defineConfig, devices } from "@playwright/test";

// Os testes de ponta a ponta rodam contra o Supabase local (npm run db:start) e
// leem a URL e a chave pública do mesmo .env.local usado pelo painel.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No CI as variáveis já vêm do ambiente.
}

const PORT = Number(process.env.E2E_PORT ?? 3000);
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // No CI, a versão de produção; localmente, aproveita o servidor de desenvolvimento se já estiver no ar.
    command: CI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/painel/entrar`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
