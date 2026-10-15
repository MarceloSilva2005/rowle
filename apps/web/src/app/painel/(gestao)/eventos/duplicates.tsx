import { duplicateReasons, EVENT_STATUS_LABELS, formatSessionDate, type Database } from "@rowle/core";
import Link from "next/link";
import { ActionForm } from "../../action-form";
import { dismissDuplicate } from "./actions";

type Candidate = Database["public"]["Functions"]["find_possible_duplicates"]["Returns"][number];

/**
 * Lista de eventos que podem ser o mesmo rolê. Com `eventId`, cada item ganha o
 * botão "Não é duplicata", que guarda a decisão e tira o par do aviso.
 */
export function DuplicateList({ candidates, eventId }: { candidates: Candidate[]; eventId?: string }) {
  return (
    <ul className="lista-duplicatas">
      {candidates.map((c) => (
        <li key={c.event_id}>
          <div style={{ display: "grid", gap: 4 }}>
            <div className="acoes" style={{ marginTop: 0 }}>
              <Link href={`/painel/eventos/${c.event_id}`}>
                <strong>{c.title}</strong>
              </Link>
              <span className={`selo selo-${c.status}`}>{EVENT_STATUS_LABELS[c.status]}</span>
              {c.strong ? <span className="selo selo-urgente">Muito provável</span> : null}
            </div>
            <span className="muted">
              {duplicateReasons(c).join(" · ")}
              {c.next_starts_at ? ` · próxima sessão ${formatSessionDate(c.next_starts_at, true)}` : null}
            </span>
          </div>
          {eventId ? (
            <ActionForm
              action={dismissDuplicate.bind(null, eventId, c.event_id)}
              submitLabel="Não é duplicata"
              pendingLabel="Registrando…"
              variant="secundario"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
