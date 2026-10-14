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
