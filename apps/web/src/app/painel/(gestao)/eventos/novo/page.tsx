import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../../action-form";
import { createEvent } from "../actions";
import { EventFields } from "../event-fields";
import { Carregando } from "../../../ui";

export default function NovoEventoPage() {
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Novo evento</h1>
          <p className="muted">
            Tem o link ou o post? <Link href="/painel/eventos/assistente">Use o assistente</Link>.
          </p>
        </div>
      </div>
      <Suspense fallback={<Carregando />}>
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
        <input type="hidden" name="inicio_cadastro" value={new Date().toISOString()} />
        <EventFields categories={categories ?? []} organizations={organizations ?? []} withSlug />
      </ActionForm>
    </section>
  );
}
