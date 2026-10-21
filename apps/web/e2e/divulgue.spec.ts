import { expect, test } from "@playwright/test";
import { futureLocal, signIn, statusPanel, uniqueId } from "./helpers";

test("produtor envia sugestão, curadoria pede informação e o protocolo mostra o recado", async ({ page }) => {
  const title = `Sarau de teste ${uniqueId()}`;

  // Envio público, sem conta.
  await page.goto("/divulgue");
  await page.locator("[name=titulo]").fill(title);
  await page.locator("[name=data]").fill(futureLocal(9, "19:30"));
  await page.locator("[name=categoria]").selectOption({ index: 1 });
  await page.locator("[name=local]").fill("Praça de teste");
  await page.locator("[name=divulgacao]").fill("https://exemplo.test/sarau");
  await page.locator("[name=email]").fill("produtora@exemplo.test");
  await page.getByRole("button", { name: "Enviar sugestão" }).click();
  await expect(page.getByRole("heading", { name: "Sugestão enviada" })).toBeVisible();
  const protocol = (await page.locator(".site-bilhete-valor").nth(0).textContent()) ?? "";
  const code = (await page.locator(".site-bilhete-valor").nth(1).textContent()) ?? "";
  expect(protocol).toMatch(/^RW-\d{6}-[A-Z2-9]{4}$/);

  // Consulta: código errado não mostra nada; o certo mostra "Recebida".
  await page.goto("/acompanhar");
  await page.locator("[name=protocolo]").fill(protocol);
  await page.locator("[name=codigo]").fill("ERRADO1234");
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page.locator(".mensagem-erro")).toHaveText("Protocolo ou código não conferem.");
  await page.locator("[name=codigo]").fill(code.toLowerCase());
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".selo")).toHaveText("Recebida");

  // A curadoria acha na fila e pede informação.
  await signIn(page);
  await page.goto("/painel/sugestoes");
  await page.getByRole("link", { name: protocol }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const ask = statusPanel(page, "Pedir informações…");
  await ask.locator("summary").click();
  await ask.locator("[name=nota]").fill("Qual é o endereço do local?");
  await ask.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.locator(".selo").first()).toHaveText("Aguardando informações");

  // O produtor vê a nova situação e o recado.
  await page.goto("/acompanhar");
  await page.locator("[name=protocolo]").fill(protocol);
  await page.locator("[name=codigo]").fill(code);
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page.locator(".selo")).toHaveText("Aguardando informações");
  await expect(page.getByText("Qual é o endereço do local?")).toBeVisible();
});

test("formulário público avisa link inválido sem perder o que foi digitado", async ({ page }) => {
  await page.goto("/divulgue");
  await page.locator("[name=titulo]").fill("Rolê com link ruim");
  await page.locator("[name=data]").fill(futureLocal(5));
  await page.locator("[name=local]").fill("Praça");
  // type="url" aceita "ftp://": quem barra é o banco.
  await page.locator("[name=ingresso]").fill("ftp://exemplo.test/x");
  await page.getByRole("button", { name: "Enviar sugestão" }).click();
  await expect(page.locator(".mensagem-erro")).toHaveText("Confira os links (começam com https://) e o e-mail.");
  await expect(page.locator("[name=titulo]")).toHaveValue("Rolê com link ruim");
});

test("política e termos abrem pelo rodapé, com o contato", async ({ page }) => {
  await page.goto("/divulgue");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacidade" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Política de privacidade" })).toBeVisible();
  await expect(page.getByRole("link", { name: "contato.rowle@gmail.com" }).first()).toHaveAttribute("href", "mailto:contato.rowle@gmail.com");
  await page.getByRole("contentinfo").getByRole("link", { name: "Termos de uso" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeVisible();
  await expect(page.getByText("O Rowlê não vende ingressos")).toBeVisible();
});
