"use client";

import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@rowle/core";
import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/browser";

type Result = { status: SubmissionStatus; publicNote: string | null; title: string | null; createdAt: string; updatedAt: string };

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");

/** Consulta pública: protocolo + código → situação e recado da curadoria. */
export function Acompanhar() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    setResult(null);
    const { data, error } = await browserClient().rpc("track_submission", {
      p_protocol: String(fd.get("protocolo") ?? ""),
      p_code: String(fd.get("codigo") ?? ""),
    });
    setPending(false);
    if (error) return setError("Não deu para consultar. Confira a conexão e tente de novo.");
    const row = data?.[0];
    if (!row) return setError("Protocolo ou código não conferem.");
    setResult({ status: row.status, publicNote: row.public_note, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="cartao">
        <div className="grade-campos">
          <label className="campo">
            Protocolo
            <input name="protocolo" required placeholder="RW-251020-ABCD" autoCapitalize="characters" spellCheck={false} />
          </label>
          <label className="campo">
            Código
            <input name="codigo" required autoCapitalize="characters" autoComplete="off" spellCheck={false} />
          </label>
        </div>
        <div className="acoes">
          <button type="submit" className="botao" disabled={pending}>
            {pending ? "Consultando…" : "Consultar"}
          </button>
        </div>
        {error ? (
          <p className="mensagem-erro" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      {result ? (
        <section className="cartao" aria-labelledby="situacao" role="status">
          <h2 id="situacao">{result.title ?? "Sua sugestão"}</h2>
          <div className="acoes" style={{ marginTop: 8 }}>
            <span className={`selo selo-${result.status}`}>{SUBMISSION_STATUS_LABELS[result.status]}</span>
            <span className="muted">
              Enviada em {date(result.createdAt)}
              {result.updatedAt !== result.createdAt ? ` · atualizada em ${date(result.updatedAt)}` : ""}
            </span>
          </div>
          {result.publicNote ? (
            <p style={{ marginTop: 16 }}>
              <span className="muted">Mensagem da curadoria:</span> {result.publicNote}
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
