import { formatLegalDate, LEGAL_CONTACT_EMAIL, type LegalDocument } from "@rowle/core";

/** Política ou termos: o mesmo texto do app (packages/core/src/legal.ts). */
export function DocumentoLegal({ doc }: { doc: LegalDocument }) {
  return (
    <article className="documento-legal">
      <h1>{doc.title}</h1>
      <p className="muted">Atualizado em {formatLegalDate(doc.updatedAt)}</p>
      {doc.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p}>{withMailLink(p)}</p>
          ))}
          {s.items ? (
            <ul>
              {s.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}

function withMailLink(text: string) {
  const [before, ...rest] = text.split(LEGAL_CONTACT_EMAIL);
  if (!rest.length) return text;
  return (
    <>
      {before}
      <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      {rest.join(LEGAL_CONTACT_EMAIL)}
    </>
  );
}
