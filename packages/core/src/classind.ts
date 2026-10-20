/**
 * Classificação indicativa (Ministério da Justiça). Guia ClassInd 2025, anexo H:
 * quadrado com cantos arredondados, número branco, cores fixas; em agendas e
 * programações, com borda branca. O Rowlê mostra só o número ("L", "6" … "18"),
 * seja a classificação oficial ou autoclassificação, para não ter dois formatos.
 */
export const AGE_RATINGS = ['L', '6', '10', '12', '14', '16', '18'] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

/** Cores oficiais (RGB do guia), em hexadecimal. Não podem variar de tom. */
export const CLASSIND_COLORS: Record<AgeRating, string> = {
  L: '#00A651',
  '6': '#E43493',
  '10': '#0095DA',
  '12': '#FBC115',
  '14': '#F58220',
  '16': '#EC1D25',
  '18': '#000000',
};

/** Descrição para leitores de tela e listas: "Livre" ou "18 anos". */
export function classIndDescription(rating: AgeRating): string {
  return rating === 'L' ? 'Livre' : `${rating} anos`;
}

export function isAgeRating(value: unknown): value is AgeRating {
  return typeof value === 'string' && (AGE_RATINGS as readonly string[]).includes(value);
}
