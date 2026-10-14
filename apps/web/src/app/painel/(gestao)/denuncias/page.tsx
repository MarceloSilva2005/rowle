import {
  EVENT_STATUS_LABELS,
  OPEN_REPORT_STATUSES,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_TRANSITIONS,
  reportRequiresNote,
  URGENT_REPORT_REASONS,
  type ReportReason,
  type ReportStatus,
} from "@rowle/core";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../action-form";
import { changeReportStatus } from "./actions";

const STATUSES = Object.keys(REPORT_TRANSITIONS) as ReportStatus[];

const ACTION_LABELS: Record<ReportStatus, string> = {
  open: "Reabrir",
  investigating: "Investigar",
  resolved: "Resolver",
  dismissed: "Descartar",
};

export default function DenunciasPage({ searchParams }: PageProps<"/painel/denuncias">) {
  return (
    <>
      <h1>Denúncias</h1>
      <p className="muted">
        Enviadas por quem usa o app, sem identificação. Golpe e link suspeito aparecem primeiro. Para tirar um evento do ar,
        use &quot;Suspender&quot; na página dele.
      </p>
      <Suspense fallback={<p className="muted">Carregando denúncias…</p>}>
        <ReportList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReportList({ searchParams }: { searchParams: PageProps<"/painel/denuncias">["searchParams"] }) {
  await requireStaff();
  const { status } = await searchParams;
  const filter = typeof status === "string" && STATUSES.includes(status as ReportStatus) ? (status as ReportStatus) : null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, reason, details, status, resolution_note, created_at, events(id, title, status)")
    .in("status", filter ? [filter] : [...OPEN_REPORT_STATUSES])
    .order("created_at", { ascending: !filter })
    .limit(200);
  const urgent = (r: { reason: ReportReason }) => URGENT_REPORT_REASONS.includes(r.reason);
  // Na fila, golpe e link suspeito sobem (o sort é estável: o resto segue por data).
  const reports = filter || !data ? data : [...data].sort((a, b) => Number(urgent(b)) - Number(urgent(a)));

  return (
    <>
      <nav className="filtros" aria-label="Filtrar por situação">
        <Link href="/painel/denuncias" aria-current={filter ? undefined : "page"}>
          Na fila
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/painel/denuncias?status=${s}`} aria-current={filter === s ? "page" : undefined}>
            {REPORT_STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>
      {reports?.length ? (
        reports.map((r) => (
          <article key={r.id} className="cartao" style={{ display: "grid", gap: 12 }}>
            <div className="acoes" style={{ marginTop: 0 }}>
              <span className={`selo ${urgent(r) ? "selo-urgente" : ""}`}>{REPORT_REASON_LABELS[r.reason]}</span>
              <span className={`selo selo-${r.status}`}>{REPORT_STATUS_LABELS[r.status]}</span>
              <span className="muted">
                {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </span>
            </div>
            {r.events ? (
              <p>
                Evento: <Link href={`/painel/eventos/${r.events.id}`}>{r.events.title}</Link>{" "}
                <span className="muted">({EVENT_STATUS_LABELS[r.events.status]})</span>
              </p>
            ) : null}
            {r.details ? <p style={{ whiteSpace: "pre-line" }}>{r.details}</p> : <p className="muted">Sem detalhes.</p>}
            {r.resolution_note ? (
              <p>
                <span className="muted">O que foi feito:</span> {r.resolution_note}
              </p>
            ) : null}
            {REPORT_TRANSITIONS[r.status].map((to) => (
              <ActionForm
                key={to}
                action={changeReportStatus.bind(null, r.id, r.status, to)}
                submitLabel={ACTION_LABELS[to]}
                variant={to === "investigating" ? "secundario" : to === "dismissed" ? "perigo" : "primario"}
              >
                {reportRequiresNote(to) ? (
                  <label className="campo">
                    O que foi feito <small>(obrigatório, só a equipe vê)</small>
                    <input name="nota" maxLength={1000} required />
                  </label>
                ) : null}
              </ActionForm>
            ))}
          </article>
        ))
      ) : (
        <section className="cartao">
          <p className="muted">{filter ? "Nenhuma denúncia nessa situação." : "Fila vazia: nenhuma denúncia aberta."}</p>
        </section>
      )}
    </>
  );
}
