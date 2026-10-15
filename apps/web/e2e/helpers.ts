import { expect, type Page } from "@playwright/test";

// Conta de curadoria criada por supabase/seed.sql, válida só no banco local.
const EMAIL = process.env.E2E_EMAIL ?? "curadoria@rowle.test";
const PASSWORD = process.env.E2E_PASSWORD ?? "rowle-local-dev";

let counter = 0;
/** Sufixo único por teste, para não depender do que já está no banco nem de execuções anteriores. */
export function uniqueId(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}${Math.random().toString(36).slice(2, 5)}`;
}

export async function signIn(page: Page) {
  await page.goto("/painel/entrar");
  await page.locator("[name=email]").fill(EMAIL);
  await page.locator("[name=senha]").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
}

/** Data e hora daqui a `days` dias no formato do datetime-local (horário de Brasília). */
export function futureLocal(days: number, time = "20:00"): string {
  const date = new Date(Date.now() + days * 86_400_000);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
  return `${day}T${time}`;
}

/** Leitura pública (chave publicável, papel anon), igual à que o app vai fazer. */
export async function publicRows(path: string): Promise<unknown[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key } });
  expect(response.ok, `GET ${path} respondeu ${response.status}`).toBe(true);
  return (await response.json()) as unknown[];
}

/** Formulário de mudança de situação que contém o botão indicado. */
export function statusForm(page: Page, button: string) {
  return page.locator("form", { has: page.getByRole("button", { name: button, exact: true }) });
}
