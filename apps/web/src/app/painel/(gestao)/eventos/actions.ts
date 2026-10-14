"use server";

import {
  brasiliaLocalToIso,
  canTransition,
  parseReaisToCents,
  requiresNote,
  slugify,
  validatePrice,
  type EventStatus,
  type Price,
} from "@rowle/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;

function eventFields(fd: FormData) {
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

function checkEventFields(fields: ReturnType<typeof eventFields>): string | null {
  if (fields.title.length < 3) return "O título precisa de pelo menos 3 caracteres.";
  if (fields.title.length > 140) return "O título pode ter no máximo 140 caracteres.";
  if (!Number.isInteger(fields.category_id) || fields.category_id < 1) return "Escolha uma categoria.";
  return null;
}

export async function createEvent(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const fields = eventFields(formData);
  const problem = checkEventFields(fields);
  if (problem) return { error: problem };

  const slug = slugify(text(formData, "slug") || fields.title);
  if (!slug) return { error: "Não foi possível gerar o endereço a partir do título." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...fields, slug, status: "draft" })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyError(error) };

  redirect(`/painel/eventos/${data.id}`);
}

export async function updateEvent(eventId: string, _state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const fields = eventFields(formData);
  const problem = checkEventFields(fields);
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.from("events").update(fields).eq("id", eventId);
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/eventos/${eventId}`);
  return { ok: "Alterações salvas." };
}

function readPrice(formData: FormData): Price | string {
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

export async function addSession(eventId: string, _state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const venueId = text(formData, "local");
  const startsRaw = text(formData, "inicio");
  const endsRaw = text(formData, "fim");
  const ticketUrl = optional(formData, "ingresso");
  if (!venueId) return { error: "Escolha o local da sessão." };
  if (!startsRaw) return { error: "Informe a data e a hora de início." };
  if (ticketUrl && !ticketUrl.startsWith("https://")) return { error: "O link de ingresso precisa começar com https://" };

  const price = readPrice(formData);
  if (typeof price === "string") return { error: price };

  let startsAt: string;
  let endsAt: string | null = null;
  try {
    startsAt = brasiliaLocalToIso(startsRaw);
    if (endsRaw) endsAt = brasiliaLocalToIso(endsRaw);
  } catch {
    return { error: "Data ou hora em formato inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert({
    event_id: eventId,
    venue_id: venueId,
    starts_at: startsAt,
    ends_at: endsAt,
    time_confirmed: formData.get("horario_confirmado") === "on",
    price_kind: price.kind,
    price_min_cents: "amountCents" in price ? price.amountCents : "minCents" in price ? price.minCents : null,
    price_max_cents: "maxCents" in price ? price.maxCents : null,
    ticket_url: ticketUrl,
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/eventos/${eventId}`);
  return { ok: "Sessão adicionada." };
}

export async function removeSession(eventId: string, sessionId: string): Promise<FormState> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId).eq("event_id", eventId);
  if (error) return { error: friendlyError(error) };
  revalidatePath(`/painel/eventos/${eventId}`);
  return { ok: "Sessão removida." };
}

export async function addSource(eventId: string, _state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const kind = text(formData, "fonte_tipo");
  const url = optional(formData, "fonte_url");
  const description = optional(formData, "fonte_descricao");
  if (!url && !description) return { error: "Informe o link da fonte ou descreva de onde veio a informação." };
  if (url && !/^https?:\/\//.test(url)) return { error: "O link precisa começar com http:// ou https://" };

  const supabase = await createClient();
  const { error } = await supabase.from("sources").insert({
    event_id: eventId,
    kind: kind as "official_site" | "ticketing" | "social" | "submission" | "press" | "other",
    url,
    description,
    last_verified_at: new Date().toISOString(),
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/eventos/${eventId}`);
  return { ok: "Fonte registrada." };
}

export async function changeStatus(
  eventId: string,
  from: EventStatus,
  to: EventStatus,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireStaff();
  if (!canTransition(from, to)) return { error: "Essa mudança de situação não é permitida." };
  const note = optional(formData, "motivo");
  if (requiresNote(to) && !note) return { error: "Escreva o motivo; ele aparece para o público ou para o produtor." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: to, status_note: note })
    .eq("id", eventId)
    .eq("status", from);
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/eventos/${eventId}`);
  revalidatePath("/painel/eventos");
  return { ok: "Situação atualizada." };
}
