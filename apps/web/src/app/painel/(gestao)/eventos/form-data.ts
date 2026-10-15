import { parseReaisToCents, validatePrice, type Price } from "@rowle/core";

// Leitura e validação dos formulários de evento, comuns ao cadastro manual e ao assistente.

export const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const optional = (fd: FormData, key: string) => text(fd, key) || null;

export function eventFields(fd: FormData) {
  const title = text(fd, "titulo");
  const categoryId = Number(fd.get("categoria"));
  const organizationId = optional(fd, "organizacao");
  const ageRating = optional(fd, "classificacao");
  return {
    title,
    category_id: categoryId,
    organization_id: organizationId,
    description: optional(fd, "descricao"),
    age_rating: ageRating as "L" | "10" | "12" | "14" | "16" | "18" | null,
    accessibility_notes: optional(fd, "acessibilidade"),
    is_sponsored: fd.get("patrocinado") === "on",
  };
}

export function checkEventFields(fields: ReturnType<typeof eventFields>): string | null {
  if (fields.title.length < 3) return "O título precisa de pelo menos 3 caracteres.";
  if (fields.title.length > 140) return "O título pode ter no máximo 140 caracteres.";
  if (!Number.isInteger(fields.category_id) || fields.category_id < 1) return "Escolha uma categoria.";
  return null;
}

export function readPrice(formData: FormData): Price | string {
  const kind = text(formData, "preco_tipo") as Price["kind"];
  const min = parseReaisToCents(text(formData, "preco_min"));
  const max = parseReaisToCents(text(formData, "preco_max"));
  let price: Price;
  switch (kind) {
    case "fixed":
    case "from":
      if (min === null) return "Informe o valor em reais (ex.: 30 ou 30,50).";
      price = { kind, amountCents: min };
      break;
    case "range":
      if (min === null || max === null) return "Informe o menor e o maior valor da faixa.";
      price = { kind, minCents: min, maxCents: max };
      break;
    case "free":
    case "on_request":
    case "unknown":
      price = { kind };
      break;
    default:
      return "Escolha o tipo de preço.";
  }
  try {
    return validatePrice(price);
  } catch (e) {
    return e instanceof Error ? e.message : "Preço inválido.";
  }
}

/** Colunas de preço da sessão a partir do preço validado. */
export function priceColumns(price: Price) {
  return {
    price_kind: price.kind,
    price_min_cents: "amountCents" in price ? price.amountCents : "minCents" in price ? price.minCents : null,
    price_max_cents: "maxCents" in price ? price.maxCents : null,
  };
}

/** Início do cadastro (campo oculto), aceito só se for das últimas 12 horas. */
export function entryStartedAt(fd: FormData): string | null {
  const value = text(fd, "inicio_cadastro");
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  const age = Date.now() - time;
  return age >= 0 && age <= 12 * 3600_000 ? new Date(time).toISOString() : null;
}
