export type EventStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'published'
  | 'rejected'
  | 'postponed'
  | 'cancelled'
  | 'suspended'
  | 'archived';

/**
 * Transições permitidas. Espelha public.event_transition_allowed
 * (supabase/migrations/20261014200200_rules.sql): o banco é quem garante,
 * esta cópia serve para o painel oferecer só as ações válidas.
 */
export const EVENT_TRANSITIONS: Readonly<Record<EventStatus, readonly EventStatus[]>> = {
  draft: ['in_review', 'archived'],
  in_review: ['published', 'changes_requested', 'rejected'],
  changes_requested: ['in_review', 'archived'],
  published: ['postponed', 'cancelled', 'suspended', 'archived'],
  postponed: ['published', 'cancelled', 'archived'],
  suspended: ['published', 'archived'],
  cancelled: ['archived'],
  rejected: ['archived'],
  archived: [],
};

/** Status que exigem um motivo visível ao público ou ao produtor. */
export const STATUSES_REQUIRING_NOTE: readonly EventStatus[] = [
  'rejected',
  'cancelled',
  'postponed',
  'suspended',
];

/** Status cujo evento pode ser aberto por link público (com aviso quando não está ativo). */
export const PUBLICLY_VISIBLE_STATUSES: readonly EventStatus[] = ['published', 'postponed', 'cancelled'];

export const EVENT_STATUS_LABELS: Readonly<Record<EventStatus, string>> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  changes_requested: 'Correção solicitada',
  published: 'Publicado',
  rejected: 'Rejeitado',
  postponed: 'Adiado',
  cancelled: 'Cancelado',
  suspended: 'Suspenso',
  archived: 'Arquivado',
};

export function canTransition(from: EventStatus, to: EventStatus): boolean {
  return EVENT_TRANSITIONS[from].includes(to);
}

export function requiresNote(status: EventStatus): boolean {
  return STATUSES_REQUIRING_NOTE.includes(status);
}
