import {
  brasiliaLocalToIso,
  formatSessionDate,
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
import { ActionForm } from "../../../action-form";
import { changeSubmissionStatus, createDraftFromSubmission } from "../actions";

const ACTION_LABELS: Partial<Record<SubmissionStatus, string>> = {
  in_review: "Começar análise",
  needs_info: "Pedir mais informações",
  rejected: "Recusar",
};

export default function SugestaoPage({ params }: PageProps<"/painel/sugestoes/[id]">) {
  return (
    <Suspense fallback={<p className="muted">Carregando sugestão…</p>}>
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
  const nextStatuses = SUBMISSION_TRANSITIONS[status].filter((to) => to !== "accepted");
  const fields = (Object.keys(SUBMISSION_FIELD_LABELS) as (keyof SubmissionPayload)[]).filter((k) => payload[k] !== undefined);

  return (
    <>
      <div style={{ display: "grid", gap: 8 }}>
        <Link href="/painel/sugestoes" className="muted">
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
          <p className="muted">A sugestão chegou sem campos reconhecíveis.</p>
        )}
        <p className="muted" style={{ marginTop: 16 }}>
          Confira tudo numa fonte oficial antes de publicar. Links enviados aqui não foram verificados.
        </p>
      </section>

      <section className="cartao" aria-labelledby="situacao">
        <h2 id="situacao">Situação</h2>
        {submission.public_note ? (
          <p>
            <span className="muted">Mensagem atual para o produtor:</span> {submission.public_note}
          </p>
        ) : null}
        {submission.event_id ? (
          <p>
            Virou o evento <Link href={`/painel/eventos/${submission.event_id}`}>{submission.events?.title ?? "criado"}</Link>.
          </p>
        ) : null}
        {SUBMISSION_TRANSITIONS[status].length ? (
          <div style={{ display: "grid", gap: 16 }}>
            <ActionForm
              action={createDraftFromSubmission.bind(null, submission.id)}
              submitLabel="Aceitar e criar rascunho"
              pendingLabel="Criando…"
            />
            {nextStatuses.map((to) => (
              <ActionForm
                key={to}
                action={changeSubmissionStatus.bind(null, submission.id, status, to)}
                submitLabel={ACTION_LABELS[to] ?? SUBMISSION_STATUS_LABELS[to]}
                variant={to === "rejected" ? "perigo" : "secundario"}
              >
                {SUBMISSION_STATUSES_REQUIRING_NOTE.includes(to) ? (
                  <label className="campo">
                    Mensagem para o produtor <small>(obrigatória; aparece na consulta do protocolo)</small>
                    <input name="nota" maxLength={1000} required />
                  </label>
                ) : null}
              </ActionForm>
            ))}
          </div>
        ) : (
          <p className="muted">Sugestão encerrada.</p>
        )}
      </section>
    </>
  );
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
