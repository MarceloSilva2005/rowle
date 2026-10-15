import {
  brasiliaLocalToIso,
  formatSessionDate,
  localDay,
  readSubmissionPayload,
  SUBMISSION_FIELD_LABELS,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUSES_REQUIRING_NOTE,
  SUBMISSION_TRANSITIONS,
  type SubmissionPayload,
  type SubmissionStatus,
} from "@rowle/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AcaoComMotivo } from "../../../acao-com-motivo";
import { ActionForm } from "../../../action-form";
import { DuplicateList } from "../../eventos/duplicates";
import { changeSubmissionStatus, createDraftFromSubmission } from "../actions";
import { Carregando } from "../../../ui";

const ACTION_LABELS: Partial<Record<SubmissionStatus, string>> = {
  in_review: "Começar análise",
  needs_info: "Pedir informações…",
  rejected: "Recusar…",
};

export default function SugestaoPage({ params }: PageProps<"/painel/sugestoes/[id]">) {
  return (
    <Suspense fallback={<Carregando texto="Carregando sugestão…" />}>
      <SubmissionDetail params={params} />
    </Suspense>
  );
}

async function SubmissionDetail({ params }: { params: PageProps<"/painel/sugestoes/[id]">["params"] }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, protocol, status, payload, contact_email, public_note, event_id, created_at, events(title)")
    .eq("id", id)
    .maybeSingle();
  if (!submission) notFound();

  const payload = readSubmissionPayload(submission.payload);
  const { data: category } = payload.categoryId
    ? await supabase.from("categories").select("name").eq("id", payload.categoryId).maybeSingle()
    : { data: null };
  const status = submission.status;
  const isOpen = SUBMISSION_TRANSITIONS[status].length > 0;
  const duplicates = isOpen && payload.title ? await findDuplicates(supabase, payload) : [];
  const nextStatuses = SUBMISSION_TRANSITIONS[status].filter((to) => to !== "accepted");
  const fields = (Object.keys(SUBMISSION_FIELD_LABELS) as (keyof SubmissionPayload)[]).filter((k) => payload[k] !== undefined);

  return (
    <>
      <div style={{ display: "grid", gap: 8 }}>
        <Link href="/painel/sugestoes" className="voltar">
          ← Sugestões
        </Link>
        <h1>{payload.title ?? `Sugestão ${submission.protocol}`}</h1>
        <div className="acoes" style={{ marginTop: 0 }}>
          <span className={`selo selo-${status}`}>{SUBMISSION_STATUS_LABELS[status]}</span>
          <span className="muted">
            Protocolo {submission.protocol} · recebida em{" "}
            {new Date(submission.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </span>
        </div>
      </div>

      <section className="cartao" aria-labelledby="enviado">
        <h2 id="enviado">O que o produtor enviou</h2>
        {fields.length ? (
          <dl className="ficha">
            {fields.map((k) => (
              <div key={k} style={{ display: "contents" }}>
                <dt>{SUBMISSION_FIELD_LABELS[k]}</dt>
                <dd>{fieldText(k, payload, category?.name)}</dd>
              </div>
            ))}
            <dt>Contato</dt>
            <dd>{submission.contact_email ?? <span className="muted">Não informado</span>}</dd>
          </dl>
        ) : (
          <p className="muted">Sugestão sem dados.</p>
        )}
        <p className="muted" style={{ marginTop: 16 }}>
          Links não verificados.
        </p>
      </section>

      {isOpen && payload.title ? (
        <section className={duplicates.length ? "cartao cartao-aviso" : "cartao"} aria-labelledby="duplicatas">
          <h2 id="duplicatas">{duplicates.length ? "Parecidos no catálogo" : "Duplicatas"}</h2>
          {duplicates.length ? (
            <>
              <p className="muted" style={{ marginBottom: 12 }}>
                Se for o mesmo rolê, complete o existente e recuse esta.
              </p>
              <DuplicateList candidates={duplicates} />
            </>
          ) : (
            <p className="muted">Nenhum parecido.</p>
          )}
        </section>
      ) : null}

      <section className="cartao" aria-labelledby="situacao">
        <h2 id="situacao">Situação</h2>
        {submission.public_note ? (
          <p>
            <span className="muted">Mensagem para o produtor:</span> {submission.public_note}
          </p>
        ) : null}
        {submission.event_id ? (
          <p>
            Virou o evento <Link href={`/painel/eventos/${submission.event_id}`}>{submission.events?.title ?? "criado"}</Link>.
          </p>
        ) : null}
        {SUBMISSION_TRANSITIONS[status].length ? (
          <div className="acoes-situacao">
            <ActionForm
              action={createDraftFromSubmission.bind(null, submission.id)}
              submitLabel="Aceitar e criar rascunho"
              pendingLabel="Criando…"
            />
            {nextStatuses.map((to) =>
              SUBMISSION_STATUSES_REQUIRING_NOTE.includes(to) ? (
                <AcaoComMotivo
                  key={to}
                  label={ACTION_LABELS[to] ?? SUBMISSION_STATUS_LABELS[to]}
                  confirmLabel={to === "rejected" ? "Recusar sugestão" : "Enviar pedido"}
                  action={changeSubmissionStatus.bind(null, submission.id, status, to)}
                  fieldName="nota"
                  fieldLabel="Mensagem para o produtor"
                  hint="o produtor vê ao consultar o protocolo"
                  maxLength={1000}
                  variant={to === "rejected" ? "perigo" : "secundario"}
                />
              ) : (
                <ActionForm
                  key={to}
                  action={changeSubmissionStatus.bind(null, submission.id, status, to)}
                  submitLabel={ACTION_LABELS[to] ?? SUBMISSION_STATUS_LABELS[to]}
                  variant="secundario"
                />
              ),
            )}
          </div>
        ) : (
          <p className="muted">Sugestão encerrada.</p>
        )}
      </section>
    </>
  );
}

/** Procura no catálogo pelo título, pelo dia e, se o nome bater com um local cadastrado, pelo local. */
async function findDuplicates(supabase: Awaited<ReturnType<typeof createClient>>, payload: SubmissionPayload) {
  const day = localDay(payload.startsAtLocal);
  const venueName = payload.venueName?.trim();
  const { data: venues } = venueName
    ? await supabase.from("venues").select("id").ilike("name", venueName.replace(/[\\%_]/g, "\\$&"))
    : { data: [] };
  const { data } = await supabase.rpc("find_possible_duplicates", {
    p_title: payload.title ?? "",
    p_days: day ? [day] : [],
    p_venue_ids: (venues ?? []).map((v) => v.id),
  });
  return data ?? [];
}

function fieldText(key: keyof SubmissionPayload, payload: SubmissionPayload, categoryName?: string): string {
  if (key === "categoryId") return categoryName ?? `#${payload.categoryId}`;
  if (key === "startsAtLocal" && payload.startsAtLocal) {
    try {
      return formatSessionDate(brasiliaLocalToIso(payload.startsAtLocal), true);
    } catch {
      // Formato inesperado: mostra como veio, para a curadoria interpretar.
    }
  }
  return String(payload[key]);
}
