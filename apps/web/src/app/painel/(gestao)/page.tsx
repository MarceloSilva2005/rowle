import { EVENT_STATUS_LABELS, type EventStatus } from "@rowle/core";
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
  const { count: venues } = await supabase.from("venues").select("id", { count: "exact", head: true });

  return (
    <section className="numeros" aria-label="Eventos por situação">
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
