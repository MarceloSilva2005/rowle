import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "../../action-form";
import { createVenue } from "./actions";

export default function LocaisPage() {
  return (
    <>
      <h1>Locais</h1>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Venues />
      </Suspense>
    </>
  );
}

async function Venues() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: venues }, { data: regions }] = await Promise.all([
    supabase.from("venues").select("id, name, address, regions(name)").order("name"),
    supabase.from("regions").select("id, name").order("name"),
  ]);

  return (
    <>
      <section className="cartao">
        <h2>Novo local</h2>
        <ActionForm action={createVenue} submitLabel="Cadastrar local">
          <div className="grade-campos">
            <label className="campo">
              Nome
              <input name="nome" required minLength={2} maxLength={120} />
            </label>
            <label className="campo">
              Região administrativa
              <select name="regiao" required defaultValue="">
                <option value="" disabled>
                  Escolha…
                </option>
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo campo-largo">
              Endereço
              <input name="endereco" required minLength={5} maxLength={200} placeholder="Ex.: SCS Quadra 2, Bloco C, Asa Sul" />
            </label>
            <label className="campo campo-largo">
              Acessibilidade <small>(opcional: rampa, banheiro adaptado, intérprete de Libras…)</small>
              <input name="acessibilidade" maxLength={500} />
            </label>
          </div>
        </ActionForm>
      </section>

      <section className="cartao">
        <h2>Cadastrados</h2>
        {venues?.length ? (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Região</th>
                  <th scope="col">Endereço</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td>{v.regions?.name}</td>
                    <td>{v.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nenhum local cadastrado ainda.</p>
        )}
      </section>
    </>
  );
}
