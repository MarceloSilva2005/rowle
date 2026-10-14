export type OrganizationDefaults = {
  name?: string;
  website_url?: string | null;
  instagram_handle?: string | null;
};

export type ContactDefaults = {
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

/** Dados públicos da organização (aparecem no app). */
export function OrganizationFields({ defaults = {} }: { defaults?: OrganizationDefaults }) {
  return (
    <>
      <label className="campo campo-largo">
        Nome
        <input name="nome" required minLength={2} maxLength={120} defaultValue={defaults.name} />
      </label>
      <label className="campo">
        Site oficial <small>(opcional, https://)</small>
        <input name="site" type="url" placeholder="https://" defaultValue={defaults.website_url ?? ""} />
      </label>
      <label className="campo">
        Instagram <small>(opcional: @perfil ou link)</small>
        <input name="instagram" maxLength={80} placeholder="@perfil" defaultValue={defaults.instagram_handle ?? ""} />
      </label>
    </>
  );
}

/** Contato interno: só a equipe vê (fica numa tabela sem leitura pública). */
export function ContactFields({ defaults = {} }: { defaults?: ContactDefaults }) {
  return (
    <>
      <label className="campo">
        Pessoa de contato
        <input name="contato_nome" maxLength={120} defaultValue={defaults.contact_name ?? ""} />
      </label>
      <label className="campo">
        E-mail
        <input name="contato_email" type="email" maxLength={200} defaultValue={defaults.email ?? ""} />
      </label>
      <label className="campo">
        Telefone ou WhatsApp
        <input name="contato_telefone" type="tel" maxLength={40} defaultValue={defaults.phone ?? ""} />
      </label>
      <label className="campo campo-largo">
        Observações
        <textarea name="contato_notas" maxLength={2000} defaultValue={defaults.notes ?? ""} />
      </label>
    </>
  );
}
