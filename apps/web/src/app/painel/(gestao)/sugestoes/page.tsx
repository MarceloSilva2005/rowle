import {
  OPEN_SUBMISSION_STATUSES,
  readSubmissionPayload,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TRANSITIONS,
  type SubmissionStatus,
} from "@rowle/core";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Carregando, EstadoVazio } from "../../ui";

const STATUSES = Object.keys(SUBMISSION_TRANSITIONS) as SubmissionStatus[];

export default function SugestoesPage({ searchParams }: PageProps<"/painel/sugestoes">) {
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Sugestões</h1>
          <p className="muted">Enviadas pelos produtores.</p>
        </div>
      </div>
      <Suspense fallback={<Carregando texto="Carregando sugestões…" />}>
        <SubmissionList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SubmissionList({ searchParams }: { searchParams: PageProps<"/painel/sugestoes">["searchParams"] }) {
  await requireStaff();
  const { status } = await searchParams;
  const filter = typeof status === "string" && STATUSES.includes(status as SubmissionStatus) ? (status as SubmissionStatus) : null;

  const supabase = await createClient();
  // Sem filtro, mostra a fila: o que ainda espera a curadoria, do mais antigo para o mais novo.
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, protocol, status, payload, created_at")
    .in("status", filter ? [filter] : [...OPEN_SUBMISSION_STATUSES])
    .order("created_at", { ascending: !filter })
    .limit(200);

  return (
    <>
      <nav className="filtros" aria-label="Filtrar por situação">
        <Link href="/painel/sugestoes" aria-current={filter ? undefined : "page"}>
          Na fila
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/painel/sugestoes?status=${s}`} aria-current={filter === s ? "page" : undefined}>
            {SUBMISSION_STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>
      <section className="cartao">
        {submissions?.length ? (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th scope="col">Protocolo</th>
                  <th scope="col">Rolê</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Recebida</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const payload = readSubmissionPayload(s.payload);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/painel/sugestoes/${s.id}`}>{s.protocol}</Link>
                      </td>
                      <td>{payload.title ?? <span className="muted">Sem título</span>}</td>
                      <td>
                        <span className={`selo selo-${s.status}`}>{SUBMISSION_STATUS_LABELS[s.status]}</span>
                      </td>
                      <td>{new Date(s.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EstadoVazio
            pose={filter ? "procurando" : "dormindo"}
            titulo={filter ? "Nenhuma sugestão nessa situação." : "Nenhuma sugestão na fila."}
          />
        )}
      </section>
    </>
  );
}
