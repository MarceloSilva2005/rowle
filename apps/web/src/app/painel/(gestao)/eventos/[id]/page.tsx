import {
  EVENT_STATUS_LABELS,
  EVENT_TRANSITIONS,
  formatPrice,
  formatSessionDate,
  priceFromColumns,
  requiresNote,
  type EventStatus,
} from "@rowle/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AcaoComMotivo } from "../../../acao-com-motivo";
import { ActionForm } from "../../../action-form";
import { addSession, addSource, changeStatus, removeSession, updateEvent } from "../actions";
import { DuplicateList } from "../duplicates";
import { EventFields } from "../event-fields";
import { Carregando } from "../../../ui";

const ACTION_LABELS: Record<EventStatus, string> = {
  draft: "Voltar para rascunho",
  in_review: "Enviar para revisão",
  changes_requested: "Pedir correção",
  published: "Publicar",
  rejected: "Rejeitar…",
  postponed: "Adiar…",
  cancelled: "Cancelar…",
  suspended: "Suspender…",
  archived: "Arquivar",
};

const CONFIRM_LABELS: Partial<Record<EventStatus, string>> = {
  rejected: "Rejeitar evento",
  postponed: "Adiar evento",
  cancelled: "Cancelar evento",
  suspended: "Suspender evento",
};

const SOURCE_KINDS: Record<string, string> = {
  official_site: "Site oficial",
  ticketing: "Bilheteria",
  social: "Rede social oficial",
  submission: "Enviado pelo produtor",
  press: "Imprensa",
  other: "Outra",
};

const SESSION_STATUS: Record<string, string> = {
  scheduled: "Confirmada",
  postponed: "Adiada",
  cancelled: "Cancelada",
  sold_out: "Esgotada",
};

export default function EventoPage({ params }: PageProps<"/painel/eventos/[id]">) {
  return (
    <Suspense fallback={<Carregando texto="Carregando evento…" />}>
      <EventDetail params={params} />
    </Suspense>
  );
}

async function EventDetail({ params }: { params: PageProps<"/painel/eventos/[id]">["params"] }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, slug, status, status_note, category_id, organization_id, description, age_rating, age_rating_official, accessibility_notes, is_sponsored, published_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  const [{ data: categories }, { data: organizations }, { data: venues }, { data: sessions }, { data: sources }, { data: history }, { data: duplicates }] =
    await Promise.all([
      supabase.from("categories").select("id, name").order("sort_order"),
      supabase.from("organizations").select("id, name").order("name"),
      supabase.from("venues").select("id, name, regions(name)").order("name"),
      supabase
        .from("sessions")
        .select("id, starts_at, time_confirmed, status, price_kind, price_min_cents, price_max_cents, ticket_url, venues(name)")
        .eq("event_id", id)
        .order("starts_at"),
      supabase.from("sources").select("id, kind, url, description, last_verified_at").eq("event_id", id).order("created_at"),
      supabase
        .from("audit_log")
        .select("id, action, changed_at, old_data, new_data")
        .eq("table_name", "events")
        .eq("row_id", id)
        .order("changed_at", { ascending: false })
        .limit(10),
      supabase.rpc("possible_duplicates_of_event", { p_event_id: id }),
    ]);

  const status = event.status as EventStatus;
  const nextStatuses = EVENT_TRANSITIONS[status];

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <Link href="/painel/eventos" className="voltar">
            ← Eventos
          </Link>
          <h1>{event.title}</h1>
          <div className="acoes" style={{ marginTop: 0 }}>
            <span className={`selo selo-${status}`}>{EVENT_STATUS_LABELS[status]}</span>
            <span className="muted">/{event.slug}</span>
          </div>
          {event.status_note ? <p className="muted">Motivo: {event.status_note}</p> : null}
        </div>
      </div>

      {duplicates?.length ? (
        <section className="cartao cartao-aviso" aria-labelledby="duplicatas">
          <h2 id="duplicatas">Pode ser duplicata</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Se for o mesmo rolê, complete um e arquive o outro.
          </p>
          <DuplicateList candidates={duplicates} eventId={event.id} />
        </section>
      ) : null}

      <div className="detalhe-grade">
        <div className="detalhe-principal">
          <section className="cartao" aria-labelledby="dados">
            <h2 id="dados">Dados do evento</h2>
            <ActionForm action={updateEvent.bind(null, event.id)} submitLabel="Salvar alterações">
              <EventFields categories={categories ?? []} organizations={organizations ?? []} defaults={event} />
            </ActionForm>
          </section>

          <section className="cartao" aria-labelledby="sessoes">
            <h2 id="sessoes">Sessões</h2>
            {sessions?.length ? (
              <div className="tabela-rolagem">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Quando</th>
                      <th scope="col">Local</th>
                      <th scope="col">Preço</th>
                      <th scope="col">Situação</th>
                      <th scope="col">Ingresso</th>
                      <th scope="col">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{formatSessionDate(s.starts_at, s.time_confirmed)}</td>
                        <td>{s.venues?.name}</td>
                        <td>{formatPrice(priceFromColumns(s.price_kind, s.price_min_cents, s.price_max_cents))}</td>
                        <td>{SESSION_STATUS[s.status]}</td>
                        <td>
                          {s.ticket_url ? (
                            <a href={s.ticket_url} target="_blank" rel="noopener noreferrer">
                              Abrir link
                            </a>
                          ) : (
                            <span className="muted">Sem link</span>
                          )}
                        </td>
                        <td>
                          <ActionForm action={removeSession.bind(null, event.id, s.id)} submitLabel="Remover" variant="perigo" pendingLabel="Removendo…" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">Nenhuma sessão.</p>
            )}

            <h2 style={{ marginTop: 24 }}>Adicionar sessão</h2>
            {venues?.length ? (
              <ActionForm action={addSession.bind(null, event.id)} submitLabel="Adicionar sessão">
                <div className="grade-campos">
                  <label className="campo">
                    Local
                    <select name="local" required defaultValue="">
                      <option value="" disabled>
                        Escolha…
                      </option>
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {v.regions?.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="campo">
                    Início <small>horário de Brasília</small>
                    <input name="inicio" type="datetime-local" required />
                  </label>
                  <label className="campo">
                    Término <small>opcional</small>
                    <input name="fim" type="datetime-local" />
                  </label>
                  <label className="campo-check">
                    <input type="checkbox" name="horario_confirmado" defaultChecked />
                    Horário confirmado
                  </label>
                  <label className="campo">
                    Preço
                    <select name="preco_tipo" required defaultValue="unknown">
                      <option value="unknown">Não informado</option>
                      <option value="free">Gratuito</option>
                      <option value="fixed">Valor único</option>
                      <option value="from">A partir de</option>
                      <option value="range">Faixa de preço</option>
                      <option value="on_request">Sob consulta</option>
                    </select>
                  </label>
                  <label className="campo">
                    Valor (R$)
                    <input name="preco_min" inputMode="decimal" placeholder="30,00" />
                  </label>
                  <label className="campo">
                    Valor máximo (R$)
                    <input name="preco_max" inputMode="decimal" />
                  </label>
                  <label className="campo campo-largo">
                    Link do ingresso <small>opcional</small>
                    <input name="ingresso" type="url" placeholder="https://" />
                  </label>
                </div>
              </ActionForm>
            ) : (
              <p className="muted">
                Cadastre primeiro um <Link href="/painel/locais">local</Link>.
              </p>
            )}
          </section>

          <section className="cartao" aria-labelledby="fontes">
            <h2 id="fontes">Fontes</h2>
            {sources?.length ? (
              <ul style={{ display: "grid", gap: 8, paddingLeft: 18 }}>
                {sources.map((s) => (
                  <li key={s.id}>
                    <strong>{SOURCE_KINDS[s.kind]}</strong>
                    {s.url ? (
                      <>
                        {" · "}
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.url}
                        </a>
                      </>
                    ) : null}
                    {s.description ? <span className="muted"> · {s.description}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Nenhuma fonte. Sem fonte não dá para publicar.</p>
            )}
            <ActionForm action={addSource.bind(null, event.id)} submitLabel="Registrar fonte">
              <div className="grade-campos" style={{ marginTop: 12 }}>
                <label className="campo">
                  Tipo
                  <select name="fonte_tipo" defaultValue="official_site">
                    {Object.entries(SOURCE_KINDS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  Link
                  <input name="fonte_url" type="url" placeholder="https://" />
                </label>
                <label className="campo campo-largo">
                  De onde veio <small>se não tiver link</small>
                  <input name="fonte_descricao" maxLength={1000} placeholder="Ex.: cartaz no local, mensagem do produtor" />
                </label>
              </div>
            </ActionForm>
          </section>
        </div>
        <aside className="detalhe-lateral" aria-label="Situação e histórico">
          <section className="cartao" aria-labelledby="situacao">
            <h2 id="situacao">Situação</h2>
            {nextStatuses.length ? (
              <>
                {status === "in_review" ? (
                  <p className="muted" style={{ marginBottom: 14 }}>
                    Para publicar, precisa de uma sessão e uma fonte.
                  </p>
                ) : null}
                <div className="acoes-situacao">
                  {nextStatuses.map((to) =>
                    requiresNote(to) ? (
                      <AcaoComMotivo
                        key={to}
                        label={ACTION_LABELS[to]}
                        confirmLabel={CONFIRM_LABELS[to] ?? "Confirmar"}
                        action={changeStatus.bind(null, event.id, status, to)}
                        fieldName="motivo"
                        fieldLabel="Motivo"
                        hint="aparece no app"
                        maxLength={500}
                      />
                    ) : (
                      <ActionForm
                        key={to}
                        action={changeStatus.bind(null, event.id, status, to)}
                        submitLabel={ACTION_LABELS[to]}
                        variant={to === "published" || to === "in_review" ? "primario" : "secundario"}
                      />
                    ),
                  )}
                </div>
              </>
            ) : (
              <p className="muted">Evento arquivado.</p>
            )}
          </section>

          <section className="cartao" aria-labelledby="historico">
            <h2 id="historico">Histórico</h2>
            {history?.length ? (
              <ul style={{ display: "grid", gap: 6, paddingLeft: 18 }}>
                {history.map((h) => {
                  const before = (h.old_data as { status?: EventStatus } | null)?.status;
                  const after = (h.new_data as { status?: EventStatus } | null)?.status;
                  const what =
                    h.action === "INSERT"
                      ? "Criado"
                      : before && after && before !== after
                        ? `${EVENT_STATUS_LABELS[before]} → ${EVENT_STATUS_LABELS[after]}`
                        : "Dados editados";
                  return (
                    <li key={h.id}>
                      {what} <span className="muted">· {new Date(h.changed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Nada ainda.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
