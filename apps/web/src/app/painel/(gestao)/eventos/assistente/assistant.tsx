"use client";

import type { ExtractedEvent, Extraction } from "@rowle/core";
import { useActionState, useState } from "react";
import { DuplicateList } from "../duplicates";
import { EventFields } from "../event-fields";
import { createFromAssistant, readAnnouncement, type ReadState } from "./actions";

type Option = { id: string | number; name: string };
type Venue = { id: string; name: string; region: string };

type Lists = {
  categories: Option[];
  organizations: Option[];
  venues: Venue[];
  regions: Option[];
};

const SOURCE_KINDS: Record<string, string> = {
  official_site: "Site oficial",
  ticketing: "Bilheteria",
  social: "Rede social oficial",
  press: "Imprensa",
  other: "Outra",
};

const reais = (cents: number | undefined) => (cents ? (cents / 100).toFixed(2).replace(".", ",") : "");

export function Assistant({ startedAt, ...lists }: Lists & { startedAt: string }) {
  const [read, readAction, reading] = useActionState(readAnnouncement, {} as ReadState);

  return (
    <>
      <section className="cartao" aria-labelledby="passo-1">
        <h2 id="passo-1">Divulgação</h2>
        <form action={readAction} className="grade-campos">
          <label className="campo campo-largo">
            Link
            <input name="link" type="url" placeholder="https://" defaultValue={read.link} />
          </label>
          <label className="campo campo-largo">
            Texto
            <textarea
              name="texto"
              maxLength={10000}
              rows={6}
              defaultValue={read.text}
              placeholder="Legenda do post, mensagem do produtor…"
            />
          </label>
          <div className="acoes campo-largo">
            <button type="submit" className="botao" disabled={reading}>
              {reading ? "Lendo…" : "Ler divulgação"}
            </button>
          </div>
          {read.error ? (
            <p className="mensagem-erro campo-largo" role="alert">
              {read.error}
            </p>
          ) : null}
        </form>
      </section>

      {read.extraction ? <Review key={read.readId} read={read} extraction={read.extraction} startedAt={startedAt} {...lists} /> : null}
    </>
  );
}

function Review({ read, extraction, startedAt, categories, organizations, venues, regions }: Lists & {
  read: ReadState;
  extraction: Extraction;
  startedAt: string;
}) {
  const [state, createAction, creating] = useActionState(createFromAssistant, {});
  const { data, origins } = extraction;
  const suggestions = read.venues ?? [];
  const best = suggestions[0];
  const [venueChoice, setVenueChoice] = useState(
    best && best.similarity >= 0.5 ? best.id : data.venueName ? "novo" : "",
  );
  const price = data.price;

  const origin = (key: keyof ExtractedEvent) =>
    origins[key] ? <small className="origem">{origins[key] === "página" ? "da página" : "do texto"}</small> : null;

  return (
    <>
      <section className="cartao" aria-labelledby="leitura">
        <h2 id="leitura">Confira</h2>
        <ul className="avisos">
          {read.pageError ? <li>O link não abriu: {read.pageError}</li> : null}
          {data.cancelled ? <li className="aviso-forte">A página diz que o evento foi cancelado ou adiado.</li> : null}
          {!data.startsAtLocal ? <li>Sem data: o rascunho fica sem sessão.</li> : null}
          {data.startsAtLocal && data.timeConfirmed === false ? <li>Horário não encontrado.</li> : null}
          {!price ? <li>Preço não encontrado.</li> : null}
        </ul>
        {read.duplicates?.length ? (
          <div className="cartao cartao-aviso" style={{ marginTop: 16 }}>
            <h3>Parecidos no catálogo</h3>
            <DuplicateList candidates={read.duplicates} />
          </div>
        ) : null}
      </section>

      <form action={createAction} className="cartao" aria-labelledby="dados-assistente" style={{ display: "grid", gap: 24 }}>
        <input type="hidden" name="inicio_cadastro" value={startedAt} />
        <div>
          <h2 id="dados-assistente">Evento {origin("title")}</h2>
          <EventFields
            categories={categories}
            organizations={organizations}
            defaults={{
              title: data.title,
              category_id: read.categoryId,
              organization_id: read.organizationId ?? null,
              description: data.description ?? null,
            }}
          />
          {data.organizerName && !read.organizationId ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Organização no texto: {data.organizerName} (não cadastrada)
            </p>
          ) : null}
        </div>

        <fieldset className="grade-campos">
          <legend>Sessão</legend>
          <label className="campo campo-largo">
            Local {origin("venueName")}
            <select name="local" value={venueChoice} onChange={(e) => setVenueChoice(e.target.value)}>
              <option value="">{data.startsAtLocal ? "Escolha…" : "Sem sessão por enquanto"}</option>
              {suggestions.length ? (
                <optgroup label={`Parecidos com “${data.venueName}”`}>
                  {suggestions.map((v) => (
                    <option key={`s-${v.id}`} value={v.id}>
                      {v.name} · {v.region_name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label="Todos os locais">
                {venues
                  .filter((v) => !suggestions.some((s) => s.id === v.id))
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.region}
                    </option>
                  ))}
              </optgroup>
              <option value="novo">+ Novo local</option>
            </select>
          </label>
          {venueChoice === "novo" ? (
            <>
              <label className="campo">
                Nome do novo local
                <input name="novo_local_nome" defaultValue={data.venueName} maxLength={120} required />
              </label>
              <label className="campo">
                Região administrativa
                <select name="novo_local_regiao" defaultValue="" required>
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo campo-largo">
                Endereço completo {origin("venueAddress")}
                <input name="novo_local_endereco" defaultValue={data.venueAddress} maxLength={200} required />
              </label>
            </>
          ) : null}
          <label className="campo">
            Início {origin("startsAtLocal")} <small>horário de Brasília</small>
            <input name="inicio" type="datetime-local" defaultValue={data.startsAtLocal} required={Boolean(venueChoice)} />
          </label>
          <label className="campo">
            Término {origin("endsAtLocal")} <small>opcional</small>
            <input name="fim" type="datetime-local" defaultValue={data.endsAtLocal} />
          </label>
          <label className="campo-check">
            <input type="checkbox" name="horario_confirmado" defaultChecked={data.timeConfirmed ?? true} />
            Horário confirmado
          </label>
          <label className="campo">
            Preço {origin("price")}
            <select name="preco_tipo" defaultValue={price?.kind ?? "unknown"}>
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
            <input
              name="preco_min"
              inputMode="decimal"
              defaultValue={reais(price && "amountCents" in price ? price.amountCents : price && "minCents" in price ? price.minCents : undefined)}
            />
          </label>
          <label className="campo">
            Valor máximo (R$)
            <input name="preco_max" inputMode="decimal" defaultValue={reais(price && "maxCents" in price ? price.maxCents : undefined)} />
          </label>
          <label className="campo campo-largo">
            Link do ingresso {origin("ticketUrl")} <small>opcional</small>
            <input name="ingresso" type="url" defaultValue={data.ticketUrl} placeholder="https://" />
          </label>
        </fieldset>

        <fieldset className="grade-campos">
          <legend>Fonte</legend>
          <label className="campo">
            Tipo
            <select name="fonte_tipo" defaultValue={data.sourceUrl && data.sourceUrl === data.ticketUrl ? "ticketing" : data.sourceUrl ? "official_site" : "other"}>
              {Object.entries(SOURCE_KINDS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Link {origin("sourceUrl")}
            <input name="fonte_url" type="url" defaultValue={data.sourceUrl} placeholder="https://" />
          </label>
          <label className="campo campo-largo">
            De onde veio <small>se não tiver link</small>
            <input
              name="fonte_descricao"
              maxLength={1000}
              placeholder="Ex.: cartaz no local, mensagem do produtor"
              defaultValue={data.sourceUrl ? "" : "Texto colado no assistente"}
            />
          </label>
        </fieldset>

        <div>
          <div className="acoes" style={{ marginTop: 0 }}>
            <button type="submit" className="botao" disabled={creating}>
              {creating ? "Criando…" : "Criar rascunho"}
            </button>
          </div>
          {state.error ? (
            <p className="mensagem-erro" role="alert">
              {state.error}
            </p>
          ) : null}
        </div>
      </form>
    </>
  );
}
