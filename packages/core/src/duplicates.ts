/** Candidato devolvido por find_possible_duplicates / possible_duplicates_of_event. */
export type DuplicateCandidate = {
  title_similarity: number;
  same_day: boolean;
  same_venue: boolean;
  strong: boolean;
};

/** Motivos legíveis de por que dois cadastros podem ser o mesmo rolê. */
export function duplicateReasons(candidate: DuplicateCandidate): string[] {
  const reasons: string[] = [];
  const percent = Math.round(candidate.title_similarity * 100);
  if (percent >= 95) reasons.push("Mesmo título");
  else if (percent >= 20) reasons.push(`Título ${percent}% parecido`);
  if (candidate.same_day) reasons.push("Mesmo dia");
  if (candidate.same_venue) reasons.push("Mesmo local");
  return reasons;
}

/**
 * Par de eventos na ordem guardada em duplicate_dismissals (menor id primeiro),
 * para que "A não é B" e "B não é A" sejam o mesmo registro.
 */
export function dismissalPair(a: string, b: string): { event_id: string; other_event_id: string } {
  if (a === b) throw new Error("Um evento não pode ser comparado com ele mesmo.");
  return a < b ? { event_id: a, other_event_id: b } : { event_id: b, other_event_id: a };
}

/** Dia (AAAA-MM-DD) de uma data e hora local de Brasília no formato do datetime-local. */
export function localDay(startsAtLocal: string | undefined): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})(T|\s|$)/.exec(startsAtLocal?.trim() ?? "");
  return match?.[1] ?? null;
}
