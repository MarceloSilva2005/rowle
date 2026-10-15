import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../action-form";
import { createOrganization } from "./actions";
import { ContactFields, OrganizationFields } from "./organization-fields";
import { Carregando, EstadoVazio } from "../../ui";

export default function OrganizacoesPage() {
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Organizações</h1>
        </div>
      </div>
      <Suspense fallback={<Carregando />}>
        <Organizations />
      </Suspense>
    </>
  );
}

async function Organizations() {
  await requireStaff();
  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, instagram_handle, verified, events(count)")
    .order("name");

  return (
    <>
      <section className="cartao">
        <h2>Nova organização</h2>
        <ActionForm action={createOrganization} submitLabel="Cadastrar organização" pendingLabel="Cadastrando…">
          <div className="grade-campos">
            <OrganizationFields />
          </div>
          <details style={{ marginTop: 16 }}>
            <summary>Contato (só a equipe vê)</summary>
            <div className="grade-campos" style={{ marginTop: 12 }}>
              <ContactFields />
            </div>
          </details>
        </ActionForm>
      </section>

      <section className="cartao">
        <h2>Cadastradas</h2>
        {organizations?.length ? (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Instagram</th>
                  <th scope="col">Eventos</th>
                  <th scope="col">Verificada</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/painel/organizacoes/${o.id}`}>{o.name}</Link>
                    </td>
                    <td>{o.instagram_handle ? `@${o.instagram_handle}` : <span className="muted">—</span>}</td>
                    <td>{o.events[0]?.count ?? 0}</td>
                    <td>{o.verified ? "Sim" : <span className="muted">Não</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EstadoVazio titulo="Nenhuma organização ainda." />
        )}
      </section>
    </>
  );
}
