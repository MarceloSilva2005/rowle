"use server";

import {
  brasiliaLocalToIso,
  canTransition,
  dismissalPair,
  requiresNote,
  slugify,
  type EventStatus,
} from "@rowle/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";
import { checkEventFields, entryStartedAt, eventFields, optional, priceColumns, readPrice, text } from "./form-data";

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

  const startedAt = entryStartedAt(formData);
  if (startedAt) await supabase.from("event_entry_timings").insert({ event_id: data.id, method: "manual", started_at: startedAt });

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
    ...priceColumns(price),
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

/** Registra que os dois eventos foram conferidos e não são o mesmo rolê. */
export async function dismissDuplicate(eventId: string, otherEventId: string): Promise<FormState> {
  await requireStaff();
  let pair: ReturnType<typeof dismissalPair>;
  try {
    pair = dismissalPair(eventId, otherEventId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Par inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("duplicate_dismissals").upsert(pair, { ignoreDuplicates: true });
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/eventos/${eventId}`);
  revalidatePath(`/painel/eventos/${otherEventId}`);
  return { ok: "Registrado: são eventos diferentes." };
}
