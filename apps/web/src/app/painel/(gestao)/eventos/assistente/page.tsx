import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Assistant } from "./assistant";

export default function AssistentePage() {
  return (
    <>
      <h1>Assistente de cadastro</h1>
      <p className="muted">
        Cole o link oficial e/ou o texto da divulgação. O assistente lê data, horário, local, preço e links e monta o rascunho
        para você conferir. Nada é publicado sem revisão.
      </p>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <AssistantLoader />
      </Suspense>
    </>
  );
}

async function AssistantLoader() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: categories }, { data: organizations }, { data: venues }, { data: regions }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("venues").select("id, name, regions(name)").order("name"),
    supabase.from("regions").select("id, name").order("name"),
  ]);
  return (
    <Assistant
      startedAt={new Date().toISOString()}
      categories={categories ?? []}
      organizations={organizations ?? []}
      venues={(venues ?? []).map((v) => ({ id: v.id, name: v.name, region: v.regions?.name ?? "" }))}
      regions={regions ?? []}
    />
  );
}
