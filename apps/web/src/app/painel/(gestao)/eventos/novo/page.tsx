import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../../action-form";
import { createEvent } from "../actions";
import { EventFields } from "../event-fields";

export default function NovoEventoPage() {
  return (
    <>
      <h1>Novo evento</h1>
      <p className="muted">
        O evento nasce como rascunho. Depois você adiciona sessões e a fonte, envia para revisão e publica.
      </p>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <NewEventForm />
      </Suspense>
    </>
  );
}

async function NewEventForm() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: categories }, { data: organizations }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("organizations").select("id, name").order("name"),
  ]);
  return (
    <section className="cartao">
      <ActionForm action={createEvent} submitLabel="Criar rascunho" pendingLabel="Criando…">
        <EventFields categories={categories ?? []} organizations={organizations ?? []} withSlug />
      </ActionForm>
    </section>
  );
}
