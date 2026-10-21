import { EVENT_STATUS_LABELS, formatSessionDate } from "@rowle/core";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../action-form";
import { Carregando, EstadoVazio } from "../../ui";
import { markVerified } from "./actions";

type Reason = "broken_link" | "postponed" | "never_verified" | "due";

const REASON_LABELS: Record<Reason, string> = {
  broken_link: "Link com problema",
  postponed: "Adiado",
  never_verified: "Nunca conferido",
  due: "Prazo vencido",
};

const ORDER: Record<Reason, number> = { broken_link: 0, postponed: 1, never_verified: 2, due: 3 };

export default function RevalidarPage() {
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Revalidar</h1>
          <p className="muted">Confira data, local e ingresso na fonte.</p>
        </div>
      </div>
      <Suspense fallback={<Carregando texto="Carregando a fila…" />}>
        <Queue />
      </Suspense>
    </>
  );
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short" });

async function Queue() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("revalidation_queue").select("*").limit(200);
  const items = (data ?? [])
    .filter((r) => r.event_id && r.reason)
    .sort(
      (a, b) =>
        ORDER[a.reason as Reason] - ORDER[b.reason as Reason] ||
        (a.next_starts_at ?? "9999").localeCompare(b.next_starts_at ?? "9999"),
    );

  if (!items.length) {
    return (
      <section className="cartao">
        <EstadoVazio pose="dormindo" titulo="Tudo conferido." />
      </section>
    );
  }

  return items.map((r) => (
    <article key={r.event_id} className="cartao" style={{ display: "grid", gap: 12 }}>
      <div className="acoes" style={{ marginTop: 0 }}>
        <span className={`selo ${r.reason === "broken_link" ? "selo-urgente" : ""}`}>{REASON_LABELS[r.reason as Reason]}</span>
        {r.status ? <span className={`selo selo-${r.status}`}>{EVENT_STATUS_LABELS[r.status]}</span> : null}
      </div>
      <p>
        <Link href={`/painel/eventos/${r.event_id}`}>{r.title}</Link>
      </p>
      <p className="muted">
        {r.next_starts_at ? `Próxima sessão: ${formatSessionDate(r.next_starts_at, true)}` : "Sem sessão marcada"}
        {" · "}
        {r.last_verified_at ? `conferido em ${day(r.last_verified_at)}` : "nunca conferido"}
      </p>
      <div className="denuncia-acoes">
        {r.reason === "broken_link" || r.reason === "postponed" ? (
          <Link href={`/painel/eventos/${r.event_id}`} className="botao">
            {r.reason === "postponed" ? "Ver nova data" : "Ver sessões"}
          </Link>
        ) : null}
        {r.reason === "broken_link" ? null : (
          <ActionForm action={markVerified.bind(null, r.event_id!)} submitLabel="Conferido" variant="secundario" pendingLabel="Salvando…" />
        )}
      </div>
    </article>
  ));
}
