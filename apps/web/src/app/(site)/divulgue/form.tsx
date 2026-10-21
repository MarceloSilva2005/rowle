"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { browserClient } from "@/lib/supabase/browser";

const ERRORS: Record<string, string> = {
  P0429: "Muitas sugestões seguidas daqui. Tente de novo mais tarde.",
  "22001": "Algum campo passou do tamanho. Encurte e envie de novo.",
  "22023": "Confira os links (começam com https://) e o e-mail.",
  "22007": "Confira a data e a hora.",
  "23502": "Preencha nome, data e local.",
};
const GENERIC = "Não deu para enviar. Confira a conexão e tente de novo.";

type Sent = { protocol: string; code: string; title: string };

/** Formulário público. Envia direto do navegador para submit_event_suggestion. */
export function SugestaoForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = (name: string) => String(fd.get(name) ?? "").trim() || undefined;
    const category = Number(fd.get("categoria"));
    setPending(true);
    setError(null);
    const { data, error } = await browserClient().rpc("submit_event_suggestion", {
      p_payload: {
        title: text("titulo"),
        categoryId: category > 0 ? category : undefined,
        startsAtLocal: text("data"),
        venueName: text("local"),
        venueAddress: text("endereco"),
        organizerName: text("organizacao"),
        priceText: text("preco"),
        ticketUrl: text("ingresso"),
        sourceUrl: text("divulgacao"),
        description: text("descricao"),
      },
      p_contact_email: text("email"),
    });
    setPending(false);
    const row = data?.[0];
    if (error || !row) {
      setError((error?.code && ERRORS[error.code]) || GENERIC);
      return;
    }
    setSent({ protocol: row.protocol, code: row.tracking_code, title: text("titulo") ?? "" });
    window.scrollTo({ top: 0 });
  }

  if (sent) return <Enviada sent={sent} onAgain={() => setSent(null)} />;

  return (
    <form onSubmit={onSubmit} className="site-form">
      <Etapa titulo="Evento">
        <label className="campo campo-largo">
          Nome do evento <Obrigatorio />
          <input name="titulo" required maxLength={140} />
        </label>
        <label className="campo">
          Categoria
          <select name="categoria" defaultValue="">
            <option value="">Escolha</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Organizador
          <input name="organizacao" maxLength={140} />
        </label>
        <label className="campo campo-largo">
          Descrição
          <textarea name="descricao" maxLength={4000} rows={4} />
        </label>
      </Etapa>

      <Etapa titulo="Data e local">
        <label className="campo">
          Data e hora <Obrigatorio />
          <input name="data" type="datetime-local" required />
        </label>
        <label className="campo">
          Local <Obrigatorio />
          <input name="local" required maxLength={140} />
        </label>
        <label className="campo campo-largo">
          Endereço
          <input name="endereco" maxLength={300} placeholder="Quadra, rua e região administrativa" />
        </label>
      </Etapa>

      <Etapa titulo="Ingressos">
        <label className="campo">
          Preço
          <input name="preco" maxLength={140} placeholder="Ex.: R$ 20 ou gratuito" />
        </label>
        <label className="campo">
          Link do ingresso
          <input name="ingresso" type="url" maxLength={500} placeholder="https://" />
        </label>
        <label className="campo campo-largo">
          Site ou rede social do evento
          <input name="divulgacao" type="url" maxLength={500} placeholder="https://" />
        </label>
      </Etapa>

      <Etapa titulo="Contato">
        <label className="campo campo-largo">
          E-mail para contato <small>opcional, usado só para falar sobre este envio</small>
          <input name="email" type="email" maxLength={254} autoComplete="email" />
        </label>
      </Etapa>

      {error ? (
        <p className="mensagem-erro" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="botao botao-grande" disabled={pending}>
        {pending ? "Enviando…" : "Enviar sugestão"}
      </button>
      <p className="muted" style={{ fontSize: 13 }}>
        Ao enviar, você concorda com os <Link href="/termos">termos de uso</Link> e a{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </form>
  );
}

function Etapa({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="cartao secao">
      <legend className="secao-titulo">{titulo}</legend>
      <div className="grade-campos">{children}</div>
    </fieldset>
  );
}

const Obrigatorio = () => <small className="obrigatorio">obrigatório</small>;

function Enviada({ sent, onAgain }: { sent: Sent; onAgain: () => void }) {
  return (
    <section className="site-enviada" aria-labelledby="enviada" role="status">
      <h2 id="enviada">Sugestão enviada</h2>
      <p className="muted">{sent.title}</p>
      <div className="site-bilhete">
        <Copiavel rotulo="Protocolo" valor={sent.protocol} />
        <Copiavel rotulo="Código" valor={sent.code} />
      </div>
      <p>Guarde o protocolo e o código. Eles são necessários para acompanhar a análise e não serão mostrados de novo.</p>
      <div className="acoes">
        <Link href="/acompanhar" className="botao">
          Acompanhar sugestão
        </Link>
        <button type="button" className="botao botao-secundario" onClick={onAgain}>
          Enviar outra
        </button>
      </div>
    </section>
  );
}

function Copiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="site-bilhete-celula">
      <span className="site-bilhete-rotulo">{rotulo}</span>
      <span className="site-bilhete-valor">{valor}</span>
      <button
        type="button"
        className="botao botao-fantasma site-copiar"
        onClick={() => navigator.clipboard?.writeText(valor).then(() => setCopiado(true), () => undefined)}
        aria-label={`Copiar ${rotulo.toLowerCase()}`}
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
