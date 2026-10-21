import {
  EVENT_STATUS_LABELS,
  OPEN_REPORT_STATUSES,
  OPEN_SUBMISSION_STATUSES,
  URGENT_REPORT_REASONS,
  type EventStatus,
} from "@rowle/core";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Carregando, Mascote } from "../ui";

export default function PainelInicio() {
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Visão geral</h1>
        </div>
        <Mascote pose="acenando" size={96} />
      </div>
      <Suspense fallback={<Carregando texto="Contando as filas…" />}>
        <Counts />
        <EntryTimes />
      </Suspense>
    </>
  );
}

async function countEvents(supabase: Awaited<ReturnType<typeof createClient>>, status: EventStatus) {
  const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("status", status);
  return count ?? 0;
}

async function Counts() {
  await requireStaff();
  const supabase = await createClient();
  const [inReview, changes, draft, published, venues, submissions, reports, urgent, revalidation, brokenLinks] = await Promise.all([
    countEvents(supabase, "in_review"),
    countEvents(supabase, "changes_requested"),
    countEvents(supabase, "draft"),
    countEvents(supabase, "published"),
    supabase.from("venues").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_SUBMISSION_STATUSES])
      .then((r) => r.count ?? 0),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_REPORT_STATUSES])
      .then((r) => r.count ?? 0),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_REPORT_STATUSES])
      .in("reason", [...URGENT_REPORT_REASONS])
      .then((r) => r.count ?? 0),
    supabase
      .from("revalidation_queue")
      .select("event_id", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
    supabase
      .from("revalidation_queue")
      .select("event_id", { count: "exact", head: true })
      .eq("reason", "broken_link")
      .then((r) => r.count ?? 0),
  ]);

  return (
    <>
      <section className="grupo-numeros" aria-labelledby="filas">
        <h2 id="filas">Filas</h2>
        <div className="numeros">
          <Link href="/painel/denuncias" className={`cartao numero ${urgent ? "numero-urgente" : reports ? "numero-alerta" : ""}`}>
            <strong>{reports}</strong>
            <span>{urgent ? `Denúncias abertas · ${urgent} urgente${urgent > 1 ? "s" : ""}` : "Denúncias abertas"}</span>
          </Link>
          <Link href="/painel/sugestoes" className={`cartao numero ${submissions ? "numero-alerta" : ""}`}>
            <strong>{submissions}</strong>
            <span>Sugestões na fila</span>
          </Link>
          <Link href="/painel/revalidar" className={`cartao numero ${brokenLinks ? "numero-urgente" : revalidation ? "numero-alerta" : ""}`}>
            <strong>{revalidation}</strong>
            <span>{brokenLinks ? `Para revalidar · ${brokenLinks} com problema no link` : "Para revalidar"}</span>
          </Link>
          <Link href="/painel/eventos?status=in_review" className={`cartao numero ${inReview ? "numero-alerta" : ""}`}>
            <strong>{inReview}</strong>
            <span>{EVENT_STATUS_LABELS.in_review}</span>
          </Link>
          <Link href="/painel/eventos?status=changes_requested" className="cartao numero">
            <strong>{changes}</strong>
            <span>{EVENT_STATUS_LABELS.changes_requested}</span>
          </Link>
        </div>
      </section>

      <section className="grupo-numeros" aria-labelledby="catalogo">
        <h2 id="catalogo">Catálogo</h2>
        <div className="numeros">
          <Link href="/painel/eventos?status=draft" className="cartao numero">
            <strong>{draft}</strong>
            <span>Rascunhos</span>
          </Link>
          <Link href="/painel/eventos?status=published" className="cartao numero">
            <strong>{published}</strong>
            <span>Publicados</span>
          </Link>
          <Link href="/painel/locais" className="cartao numero">
            <strong>{venues}</strong>
            <span>Locais cadastrados</span>
          </Link>
        </div>
      </section>
    </>
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
    <section className="grupo-numeros" aria-labelledby="tempo-cadastro">
      <h2 id="tempo-cadastro">Tempo por evento</h2>
      {stats?.length ? (
        <div className="numeros">
          {stats.map((s) => (
            <div key={s.method} className="cartao numero">
              <strong>{minutes(s.median_seconds)}</strong>
              <span>
                {METHOD_LABELS[s.method] ?? s.method} · mediana de {s.entries} {s.entries === 1 ? "cadastro" : "cadastros"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum cadastro nos últimos 30 dias.</p>
      )}
      <p className="muted" style={{ fontSize: 13 }}>
        Mediana dos últimos 30 dias, da tela aberta ao rascunho criado.
      </p>
    </section>
  );
}
