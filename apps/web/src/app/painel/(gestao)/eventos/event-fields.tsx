import { AGE_RATINGS } from "@rowle/core";

type Option = { id: string | number; name: string };

export type EventDefaults = {
  title?: string;
  category_id?: number;
  organization_id?: string | null;
  description?: string | null;
  age_rating?: string | null;
  age_rating_official?: boolean;
  accessibility_notes?: string | null;
  is_sponsored?: boolean;
};


/** Campos do evento, usados na criação e na edição. */
export function EventFields({
  categories,
  organizations,
  defaults = {},
  withSlug = false,
}: {
  categories: Option[];
  organizations: Option[];
  defaults?: EventDefaults;
  withSlug?: boolean;
}) {
  return (
    <div className="grade-campos">
      <label className="campo campo-largo">
        Título
        <input name="titulo" required minLength={3} maxLength={140} defaultValue={defaults.title} />
      </label>
      {withSlug ? (
        <label className="campo campo-largo">
          Endereço na web <small>opcional</small>
          <input name="slug" maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="gerado a partir do título" />
        </label>
      ) : null}
      <label className="campo">
        Categoria
        <select name="categoria" required defaultValue={defaults.category_id ?? ""}>
          <option value="" disabled>
            Escolha…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="campo">
        Organização
        <select name="organizacao" defaultValue={defaults.organization_id ?? ""}>
          <option value="">Sem organização</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <label className="campo">
        Classificação etária
        <select name="classificacao" defaultValue={defaults.age_rating ?? ""}>
          <option value="">Não informada</option>
          {AGE_RATINGS.map((a) => (
            <option key={a} value={a}>
              {a === "L" ? "Livre" : `${a} anos`}
            </option>
          ))}
        </select>
      </label>
      <label className="campo-check">
        <input type="checkbox" name="classificacao_oficial" defaultChecked={defaults.age_rating_official ?? false} />
        Classificação oficial do Ministério
      </label>
      <label className="campo campo-largo">
        Descrição
        <textarea name="descricao" maxLength={5000} defaultValue={defaults.description ?? ""} />
      </label>
      <label className="campo campo-largo">
        Acessibilidade <small>opcional</small>
        <input name="acessibilidade" maxLength={500} defaultValue={defaults.accessibility_notes ?? ""} />
      </label>
      <label className="campo-check campo-largo">
        <input type="checkbox" name="patrocinado" defaultChecked={defaults.is_sponsored ?? false} />
        Patrocinado
      </label>
    </div>
  );
}
