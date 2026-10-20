import { EVENT_STATUS_LABELS } from "@rowle/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../../action-form";
import { saveContact, updateOrganization } from "../actions";
import { ContactFields, OrganizationFields } from "../organization-fields";
import { Carregando } from "../../../ui";

export default function OrganizacaoPage({ params, searchParams }: PageProps<"/painel/organizacoes/[id]">) {
  return (
    <Suspense fallback={<Carregando texto="Carregando organização…" />}>
      <OrganizationDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrganizationDetail({
  params,
  searchParams,
}: Pick<PageProps<"/painel/organizacoes/[id]">, "params" | "searchParams">) {
  const staff = await requireStaff();
  const [{ id }, { aviso }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const [{ data: organization }, { data: contact }, { data: events }] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, website_url, instagram_handle, verified").eq("id", id).maybeSingle(),
    supabase.from("organization_contacts").select("contact_name, email, phone, notes").eq("organization_id", id).maybeSingle(),
    supabase.from("events").select("id, title, status").eq("organization_id", id).order("updated_at", { ascending: false }),
  ]);
  if (!organization) notFound();

  return (
    <>
      <div className="cabecalho-pagina cabecalho-simples">
        <Link href="/painel/organizacoes" className="voltar">
          ← Organizações
        </Link>
        <h1>{organization.name}</h1>
        <div className="acoes" style={{ marginTop: 0 }}>
          {organization.verified ? <span className="selo selo-published">Verificada</span> : null}
          <span className="muted">/{organization.slug}</span>
        </div>
      </div>

      {aviso === "contato" ? (
        <p className="mensagem-erro" role="alert">
          A organização foi criada, mas o contato não foi salvo. Confira os dados abaixo.
        </p>
      ) : null}

      <section className="cartao" aria-labelledby="dados">
        <h2 id="dados">Dados</h2>
        <ActionForm action={updateOrganization.bind(null, organization.id)} submitLabel="Salvar alterações">
          <div className="grade-campos">
            <OrganizationFields defaults={organization} />
            {staff.role === "admin" ? (
              <label className="campo-check campo-largo">
                <input type="checkbox" name="verificada" defaultChecked={organization.verified} />
                Organização verificada (identidade confirmada pela equipe)
              </label>
            ) : null}
          </div>
        </ActionForm>
      </section>

      <section className="cartao" aria-labelledby="contato">
        <h2 id="contato">Contato (só a equipe vê)</h2>
        <ActionForm action={saveContact.bind(null, organization.id)} submitLabel="Salvar contato">
          <div className="grade-campos" style={{ marginTop: 12 }}>
            <ContactFields defaults={contact ?? {}} />
          </div>
        </ActionForm>
      </section>

      <section className="cartao" aria-labelledby="eventos">
        <h2 id="eventos">Eventos</h2>
        {events?.length ? (
          <ul style={{ display: "grid", gap: 8, paddingLeft: 18 }}>
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/painel/eventos/${e.id}`}>{e.title}</Link>{" "}
                <span className={`selo selo-${e.status}`}>{EVENT_STATUS_LABELS[e.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nenhum evento.</p>
        )}
      </section>
    </>
  );
}
