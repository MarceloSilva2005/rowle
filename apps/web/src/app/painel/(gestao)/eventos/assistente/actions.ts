"use server";

import {
  brasiliaLocalToIso,
  combineExtractions,
  extractFromHtml,
  extractFromText,
  isoToBrasiliaLocal,
  isTicketingUrl,
  slugify,
  type Database,
  type ExtractedEvent,
  type Extraction,
} from "@rowle/core";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { fetchPublicPage } from "@/lib/fetch-page";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../../action-form";
import { checkEventFields, entryStartedAt, eventFields, optional, priceColumns, readPrice, text } from "../form-data";

type Functions = Database["public"]["Functions"];
export type VenueSuggestion = Functions["suggest_venues"]["Returns"][number];
export type DuplicateCandidateRow = Functions["find_possible_duplicates"]["Returns"][number];

export type ReadState = {
  error?: string;
  /** O que foi colado, para o formulário não esvaziar depois da leitura. */
  link?: string;
  text?: string;
  /** Muda a cada leitura, para o formulário de revisão recomeçar com os novos valores. */
  readId?: number;
  extraction?: Extraction;
  pageError?: string;
  categoryId?: number;
  organizationId?: string;
  venues?: VenueSuggestion[];
  duplicates?: DuplicateCandidateRow[];
};

const MAX_TEXT = 10_000;

/** Lê o link oficial e/ou o texto colado e devolve os campos sugeridos. */
export async function readAnnouncement(_state: ReadState, formData: FormData): Promise<ReadState> {
  await requireStaff();
  const link = text(formData, "link");
  const pasted = text(formData, "texto").slice(0, MAX_TEXT);
  if (!link && !pasted) return { error: "Cole um link ou um texto." };
  const echo = { link, text: pasted };

  let page: ExtractedEvent | null = null;
  let pageError: string | undefined;
  let linkBlocked = false;
  if (link) {
    const result = await fetchPublicPage(link);
    if ("error" in result) {
      pageError = result.error;
      linkBlocked = Boolean(result.blocked);
    }
    else page = extractFromHtml(result.html, result.url);
  }
  // Hoje no horário de Brasília, para completar o ano de datas como "21/11".
  const today = isoToBrasiliaLocal(new Date().toISOString()).slice(0, 10);
  const fromText = pasted ? extractFromText(pasted, today) : null;
  if (!page && !fromText) return { ...echo, error: pageError ?? "Não consegui ler nada." };

  const extraction = combineExtractions(page, fromText);
  // Link que não abriu (site fora do ar, bloqueio a robôs) continua valendo como fonte.
  if (link && !linkBlocked && !extraction.data.sourceUrl && /^https:\/\//i.test(link)) {
    extraction.data.sourceUrl = link;
    extraction.origins.sourceUrl = "texto";
  }
  const data = extraction.data;

  const supabase = await createClient();
  const [{ data: category }, { data: organizations }, { data: venues }] = await Promise.all([
    data.categorySlug
      ? supabase.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle()
      : Promise.resolve({ data: null }),
    data.organizerName
      ? supabase.from("organizations").select("id, name").ilike("name", data.organizerName.replace(/[\\%_]/g, "\\$&"))
      : Promise.resolve({ data: [] }),
    data.venueName ? supabase.rpc("suggest_venues", { p_name: data.venueName }) : Promise.resolve({ data: [] }),
  ]);

  const day = data.startsAtLocal?.slice(0, 10);
  const { data: duplicates } = data.title
    ? await supabase.rpc("find_possible_duplicates", {
        p_title: data.title,
        p_days: day ? [day] : [],
        p_venue_ids: (venues ?? []).slice(0, 1).map((v) => v.id),
      })
    : { data: [] };

  return {
    ...echo,
    readId: Date.now(),
    extraction,
    pageError,
    categoryId: category?.id,
    organizationId: organizations?.[0]?.id,
    venues: venues ?? [],
    duplicates: duplicates ?? [],
  };
}

const SOURCE_KINDS = ["official_site", "ticketing", "social", "submission", "press", "other"] as const;
type SourceKind = (typeof SOURCE_KINDS)[number];

/** Cria o rascunho com sessão, local (se novo) e fonte, numa transação só. */
export async function createFromAssistant(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const fields = eventFields(formData);
  const problem = checkEventFields(fields);
  if (problem) return { error: problem };
  const slug = slugify(fields.title);
  if (!slug) return { error: "Use letras ou números no título." };

  // Sessão: opcional, mas se tiver início precisa de local e preço válidos.
  const startsRaw = text(formData, "inicio");
  const endsRaw = text(formData, "fim");
  const venueChoice = text(formData, "local");
  const ticketUrl = optional(formData, "ingresso");
  let session: Record<string, unknown> = {};
  if (startsRaw) {
    let startsAt: string;
    let endsAt: string | undefined;
    try {
      startsAt = brasiliaLocalToIso(startsRaw);
      if (endsRaw) endsAt = brasiliaLocalToIso(endsRaw);
    } catch {
      return { error: "Confira a data e a hora." };
    }
    if (ticketUrl && !ticketUrl.startsWith("https://")) return { error: "O link de ingresso precisa começar com https://" };
    const price = readPrice(formData);
    if (typeof price === "string") return { error: price };
    const columns = priceColumns(price);

    if (!venueChoice) return { error: "Escolha o local ou cadastre um novo." };
    let venue: Record<string, unknown>;
    if (venueChoice === "novo") {
      const name = text(formData, "novo_local_nome");
      const address = text(formData, "novo_local_endereco");
      const region = Number(formData.get("novo_local_regiao"));
      if (name.length < 2) return { error: "Informe o nome do novo local." };
      if (address.length < 5) return { error: "Preencha o endereço do novo local." };
      if (!Number.isInteger(region) || region < 1) return { error: "Escolha a região do novo local." };
      venue = { p_new_venue_name: name, p_new_venue_address: address, p_new_venue_region: region };
    } else {
      venue = { p_venue_id: venueChoice };
    }

    session = {
      ...venue,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_time_confirmed: formData.get("horario_confirmado") === "on",
      p_price_kind: columns.price_kind,
      p_price_min_cents: columns.price_min_cents ?? undefined,
      p_price_max_cents: columns.price_max_cents ?? undefined,
      p_ticket_url: ticketUrl ?? undefined,
    };
  }

  const sourceUrl = optional(formData, "fonte_url");
  const sourceDescription = optional(formData, "fonte_descricao");
  const kindRaw = text(formData, "fonte_tipo");
  const sourceKind: SourceKind = (SOURCE_KINDS as readonly string[]).includes(kindRaw)
    ? (kindRaw as SourceKind)
    : sourceUrl && isTicketingUrl(sourceUrl)
      ? "ticketing"
      : "other";
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) return { error: "O link da fonte precisa começar com http:// ou https://" };

  const supabase = await createClient();
  const { data: eventId, error } = await supabase.rpc("create_event_from_assistant", {
    p_title: fields.title,
    p_slug: slug,
    p_category_id: fields.category_id,
    p_organization_id: fields.organization_id ?? undefined,
    p_description: fields.description ?? undefined,
    p_age_rating: fields.age_rating ?? undefined,
    p_accessibility_notes: fields.accessibility_notes ?? undefined,
    p_is_sponsored: fields.is_sponsored,
    ...session,
    ...(sourceUrl || sourceDescription
      ? { p_source_kind: sourceKind, p_source_url: sourceUrl ?? undefined, p_source_description: sourceDescription ?? undefined }
      : {}),
    p_started_at: entryStartedAt(formData) ?? undefined,
  });
  if (error || !eventId) return { error: friendlyError(error) };

  redirect(`/painel/eventos/${eventId}`);
}
