import { EVENT_STATUS_LABELS, OPEN_REPORT_STATUSES, OPEN_SUBMISSION_STATUSES, type EventStatus } from "@rowle/core";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const QUEUE: EventStatus[] = ["in_review", "changes_requested", "draft", "published"];

export default function PainelInicio() {
  return (
    <>
      <h1>Visão geral</h1>
      <Suspense fallback={<p className="muted">Carregando números…</p>}>
        <Counts />
        <EntryTimes />
      </Suspense>
    </>
  );
}

async function Counts() {
  await requireStaff();
  const supabase = await createClient();
  const counts = await Promise.all(
    QUEUE.map(async (status) => {
      const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("status", status);
      return { status, count: count ?? 0 };
    }),
  );
  const [{ count: venues }, { count: submissions }, { count: reports }] = await Promise.all([
    supabase.from("venues").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).in("status", [...OPEN_SUBMISSION_STATUSES]),
    supabase.from("reports").select("id", { count: "exact", head: true }).in("status", [...OPEN_REPORT_STATUSES]),
  ]);

  return (
    <section className="numeros" aria-label="Filas e eventos por situação">
      <Link href="/painel/sugestoes" className="cartao numero">
        <strong>{submissions ?? 0}</strong>
        <span>Sugestões na fila</span>
      </Link>
      <Link href="/painel/denuncias" className="cartao numero">
        <strong>{reports ?? 0}</strong>
        <span>Denúncias abertas</span>
      </Link>
      {counts.map(({ status, count }) => (
        <Link key={status} href={`/painel/eventos?status=${status}`} className="cartao numero">
          <strong>{count}</strong>
          <span>{EVENT_STATUS_LABELS[status]}</span>
        </Link>
      ))}
      <Link href="/painel/locais" className="cartao numero">
        <strong>{venues ?? 0}</strong>
        <span>Locais cadastrados</span>
      </Link>
    </section>
  );
}

const METHOD_LABELS: Record<string, string> = { assistant: "Pelo assistente", manual: "Pelo formulário" };

function minutes(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** Tempo mediano de cadastro por evento nos últimos 30 dias (meta do M3). */
async function EntryTimes() {
  await requireStaff();
  const supabase = await createClient();
  const { data: stats } = await supabase.rpc("entry_time_stats");
  return (
    <section className="cartao" aria-labelledby="tempo-cadastro">
      <h2 id="tempo-cadastro">Tempo por evento</h2>
      {stats?.length ? (
        <div className="numeros">
          {stats.map((s) => (
            <div key={s.method} className="numero">
              <strong>{minutes(s.median_seconds)}</strong>
              <span>
                {METHOD_LABELS[s.method] ?? s.method} · mediana de {s.entries} {s.entries === 1 ? "cadastro" : "cadastros"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Ainda não há cadastros nos últimos 30 dias.</p>
      )}
      <p className="muted" style={{ marginTop: 12 }}>
        Do momento em que a tela de cadastro abre até o rascunho ser criado. Cadastros de mais de 2 horas ficam de fora.
      </p>
    </section>
  );
}
