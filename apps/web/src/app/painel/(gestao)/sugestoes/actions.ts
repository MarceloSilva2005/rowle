"use server";

import {
  canChangeSubmission,
  readSubmissionPayload,
  slugify,
  SUBMISSION_STATUSES_REQUIRING_NOTE,
  type SubmissionStatus,
} from "@rowle/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";

export async function changeSubmissionStatus(
  id: string,
  from: SubmissionStatus,
  to: SubmissionStatus,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireStaff();
  if (to === "accepted") return { error: "Para aceitar, crie o rascunho a partir da sugestão." };
  if (!canChangeSubmission(from, to)) return { error: "Essa mudança de situação não é permitida." };
  const note = String(formData.get("nota") ?? "").trim() || null;
  if (SUBMISSION_STATUSES_REQUIRING_NOTE.includes(to) && !note)
    return { error: "Escreva a explicação; o produtor lê essa mensagem ao consultar o protocolo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .update({ status: to, ...(note ? { public_note: note } : {}) })
    .eq("id", id)
    .eq("status", from);
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/sugestoes/${id}`);
  revalidatePath("/painel/sugestoes");
  return { ok: "Situação atualizada." };
}

/**
 * Aceita a sugestão criando um rascunho com o que veio no formulário.
 * Sessão, local e preço ficam para a curadoria completar na página do evento.
 */
export async function createDraftFromSubmission(id: string): Promise<FormState> {
  await requireStaff();
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("submissions")
    .select("protocol, status, payload")
    .eq("id", id)
    .maybeSingle();
  if (!submission) return { error: "Sugestão não encontrada." };
  if (!canChangeSubmission(submission.status, "accepted")) return { error: "Esta sugestão já foi encerrada." };

  const payload = readSubmissionPayload(submission.payload);
  const title = payload.title && payload.title.length >= 3 ? payload.title.slice(0, 140) : `Sugestão ${submission.protocol}`;
  // O protocolo no fim do endereço evita colisão com eventos de mesmo nome.
  const slug = slugify(`${title} ${submission.protocol}`);

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title,
      slug,
      category_id: payload.categoryId ?? 1,
      description: payload.description?.slice(0, 5000) ?? null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !event) return { error: friendlyError(error) };

  const sourceUrl = [payload.sourceUrl, payload.ticketUrl].find((u) => u && /^https?:\/\//.test(u)) ?? null;
  await supabase.from("sources").insert({
    event_id: event.id,
    kind: "submission",
    url: sourceUrl,
    description: `Sugestão enviada pelo produtor (protocolo ${submission.protocol})`,
    last_verified_at: new Date().toISOString(),
  });

  const { error: linkError } = await supabase
    .from("submissions")
    .update({
      status: "accepted",
      event_id: event.id,
      public_note: "Recebemos seu rolê. Ele passa pela revisão da curadoria antes de aparecer no app.",
    })
    .eq("id", id);
  if (linkError) return { error: friendlyError(linkError) };

  revalidatePath("/painel/sugestoes");
  redirect(`/painel/eventos/${event.id}`);
}
