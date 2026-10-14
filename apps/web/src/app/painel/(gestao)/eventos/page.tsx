import { EVENT_STATUS_LABELS, EVENT_TRANSITIONS, formatSessionDate, type EventStatus } from "@rowle/core";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUSES = Object.keys(EVENT_TRANSITIONS) as EventStatus[];

export default function EventosPage({ searchParams }: PageProps<"/painel/eventos">) {
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <h1>Eventos</h1>
        <Link href="/painel/eventos/novo" className="botao" style={{ textDecoration: "none" }}>
          Novo evento
        </Link>
      </div>
      <Suspense fallback={<p className="muted">Carregando eventos…</p>}>
        <EventList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EventList({ searchParams }: { searchParams: PageProps<"/painel/eventos">["searchParams"] }) {
  await requireStaff();
  const { status } = await searchParams;
  const filter = typeof status === "string" && STATUSES.includes(status as EventStatus) ? (status as EventStatus) : null;

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, title, status, updated_at, categories(name), sessions(starts_at, time_confirmed)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (filter) query = query.eq("status", filter);
  const { data: events } = await query;

  return (
    <>
      <nav className="filtros" aria-label="Filtrar por situação">
        <Link href="/painel/eventos" aria-current={filter ? undefined : "page"}>
          Todos
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/painel/eventos?status=${s}`} aria-current={filter === s ? "page" : undefined}>
            {EVENT_STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>
      <section className="cartao">
        {events?.length ? (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th scope="col">Evento</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Próxima sessão</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const next = firstUpcoming(e.sessions);
                  return (
                    <tr key={e.id}>
                      <td>
                        <Link href={`/painel/eventos/${e.id}`}>{e.title}</Link>
                      </td>
                      <td>
                        <span className={`selo selo-${e.status}`}>{EVENT_STATUS_LABELS[e.status]}</span>
                      </td>
                      <td>{e.categories?.name}</td>
                      <td>{next ? formatSessionDate(next.starts_at, next.time_confirmed) : <span className="muted">Nenhuma</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">{filter ? "Nenhum evento nessa situação." : "Nenhum evento cadastrado ainda."}</p>
        )}
      </section>
    </>
  );
}

/** Próxima sessão a partir de agora (a página é renderizada a cada requisição). */
function firstUpcoming<T extends { starts_at: string }>(sessions: T[]): T | undefined {
  const now = Date.now();
  return sessions
    .filter((s) => new Date(s.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
}
