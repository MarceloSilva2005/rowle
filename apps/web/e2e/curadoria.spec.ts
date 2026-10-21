import { expect, test } from "@playwright/test";
import { futureLocal, publicRows, signIn, statusPanel, uniqueId } from "./helpers";

test.describe("acesso ao painel", () => {
  test("visitante sem login vai para a tela de entrada", async ({ page }) => {
    await page.goto("/painel/eventos");
    await expect(page).toHaveURL(/\/painel\/entrar/);
  });

  test("senha errada não entra", async ({ page }) => {
    await page.goto("/painel/entrar");
    await page.locator("[name=email]").fill("curadoria@rowle.test");
    await page.locator("[name=senha]").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "E-mail" })).toHaveText("E-mail ou senha não conferem.");
    await expect(page).toHaveURL(/\/painel\/entrar/);
  });
});

test("cadastra, revisa, publica e cancela um evento sem SQL", async ({ page }) => {
  const runId = uniqueId();
  const venue = `Galpão E2E ${runId}`;
  const title = `Samba de teste ${runId}`;
  await signIn(page);

  // Local
  await page.goto("/painel/locais");
  await page.locator("[name=nome]").fill(venue);
  await page.locator("[name=regiao]").selectOption({ label: "Plano Piloto" });
  await page.locator("[name=endereco]").fill("SCS Quadra 1, Bloco A, Asa Sul");
  await page.getByRole("button", { name: "Cadastrar local" }).click();
  await expect(page.getByText(`Local "${venue}" cadastrado.`)).toBeVisible();

  // Rascunho
  await page.goto("/painel/eventos/novo");
  await page.locator("[name=titulo]").fill(title);
  await page.locator("[name=categoria]").selectOption({ label: "Shows e música" });
  await page.locator("[name=descricao]").fill("Roda de samba criada pelo teste de ponta a ponta.");
  await page.getByRole("button", { name: "Criar rascunho" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.locator(".selo").first()).toHaveText("Rascunho");
  const slug = (await page.getByText(/^\/samba-de-teste-/).textContent())!.slice(1);
  const eventUrl = page.url();

  // Sessão
  await page.locator("[name=local]").selectOption({ label: `${venue} · Plano Piloto` });
  await page.locator("[name=inicio]").fill(futureLocal(20));
  await page.locator("[name=preco_tipo]").selectOption("fixed");
  await page.locator("[name=preco_min]").fill("30");
  await page.locator("[name=ingresso]").fill("https://exemplo.test/ingressos");
  await page.getByRole("button", { name: "Adicionar sessão" }).click();
  await expect(page.getByRole("cell", { name: "R$ 30,00" })).toBeVisible();

  // Revisão: sem fonte, não publica
  await page.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(page.locator(".selo").first()).toHaveText("Em revisão");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Para publicar, o evento precisa de pelo menos uma fonte.")).toBeVisible();
  expect(await publicRows(`events?slug=eq.${slug}&select=id`)).toHaveLength(0);

  // Fonte e publicação
  await page.locator("[name=fonte_tipo]").selectOption("official_site");
  await page.locator("[name=fonte_url]").fill("https://exemplo.test/samba");
  await page.getByRole("button", { name: "Registrar fonte" }).click();
  await expect(page.getByRole("link", { name: "https://exemplo.test/samba" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.locator(".selo").first()).toHaveText("Publicado");

  const visible = (await publicRows(`discoverable_sessions?event_slug=eq.${slug}&select=title,price_min_cents,ticket_url`)) as {
    title: string;
    price_min_cents: number;
  }[];
  expect(visible).toEqual([expect.objectContaining({ title, price_min_cents: 3000 })]);

  // Link suspeito some do app e põe o evento na fila de revalidação até a equipe liberar.
  await page.getByRole("button", { name: "Marcar suspeito" }).click();
  await expect(page.getByText("Link marcado como suspeito.")).toBeVisible();
  expect(await publicRows(`discoverable_sessions?event_slug=eq.${slug}&select=ticket_url`)).toEqual([{ ticket_url: null }]);
  await page.goto("/painel/revalidar");
  const queued = page.locator("article", { hasText: title });
  await expect(queued.getByText("Link com problema")).toBeVisible();
  await queued.getByRole("link", { name: "Ver sessões" }).click();
  await page.getByRole("button", { name: "Link funciona" }).click();
  await expect(page.getByText("Link liberado.")).toBeVisible();
  await page.goto("/painel/revalidar");
  await expect(page.getByRole("heading", { name: "Revalidar" })).toBeVisible();
  await expect(page.locator("article", { hasText: title })).toHaveCount(0);
  await page.goto(eventUrl);

  // Cancelamento com motivo
  const cancel = statusPanel(page, "Cancelar…");
  await cancel.locator("summary").click();
  await cancel.getByRole("button", { name: "Cancelar evento" }).click();
  await expect(page.locator(".selo").first()).toHaveText("Publicado");
  await cancel.locator("[name=motivo]").fill("Produção cancelou por causa da chuva.");
  await cancel.getByRole("button", { name: "Cancelar evento" }).click();
  await expect(page.locator(".selo").first()).toHaveText("Cancelado");
  await expect(page.getByText("Motivo: Produção cancelou por causa da chuva.")).toBeVisible();
  await expect(page.getByText("Publicado → Cancelado")).toBeVisible();

  // Sai da descoberta, mas continua consultável com o aviso de cancelamento.
  expect(await publicRows(`discoverable_sessions?event_slug=eq.${slug}&select=session_id`)).toHaveLength(0);
  expect(await publicRows(`events?slug=eq.${slug}&select=status,status_note`)).toEqual([
    { status: "cancelled", status_note: "Produção cancelou por causa da chuva." },
  ]);
});

test("assistente cria rascunho a partir do texto e registra o tempo", async ({ page }) => {
  const runId = uniqueId();
  const title = `Feira de trocas ${runId}`;
  const venue = `Pracinha ${runId}`;
  await signIn(page);

  await page.goto("/painel/eventos/assistente");
  await page
    .locator("[name=texto]")
    .fill(`${title}\nMudas, sementes e livros.\nDomingo, ${futureLocal(30).slice(8, 10)}/${futureLocal(30).slice(5, 7)}, a partir das 9h\nLocal: ${venue} - Quadra 2, Asa Norte\nEntrada franca`);
  await page.getByRole("button", { name: "Ler divulgação" }).click();

  await expect(page.locator("[name=titulo]")).toHaveValue(title);
  await expect(page.locator("[name=categoria]")).toHaveValue(/\d+/);
  await expect(page.locator("[name=inicio]")).toHaveValue(futureLocal(30, "09:00"));
  await expect(page.locator("[name=preco_tipo]")).toHaveValue("free");
  await expect(page.locator("[name=local]")).toHaveValue("novo");
  await expect(page.locator("[name=novo_local_nome]")).toHaveValue(venue);

  await page.locator("[name=novo_local_regiao]").selectOption({ label: "Plano Piloto" });
  await page.getByRole("button", { name: "Criar rascunho" }).click();

  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Grátis" })).toBeVisible();
  await expect(page.getByRole("cell", { name: venue })).toBeVisible();

  await page.goto("/painel");
  await expect(page.getByText(/Pelo assistente · mediana de \d+ cadastros?/)).toBeVisible();
});
