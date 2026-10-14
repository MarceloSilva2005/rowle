/**
 * Filas da curadoria: sugestões ("Divulgue seu rolê") e denúncias.
 * Os enums espelham public.submission_status, public.report_status e
 * public.report_reason (supabase/migrations/20261014200000_schema.sql).
 */

export type SubmissionStatus = 'received' | 'in_review' | 'needs_info' | 'accepted' | 'rejected';

export const SUBMISSION_TRANSITIONS: Readonly<Record<SubmissionStatus, readonly SubmissionStatus[]>> = {
  received: ['in_review', 'needs_info', 'accepted', 'rejected'],
  in_review: ['needs_info', 'accepted', 'rejected'],
  needs_info: ['in_review', 'accepted', 'rejected'],
  accepted: [],
  rejected: [],
};

/** Situações em que o produtor precisa ler uma explicação ao consultar o protocolo. */
export const SUBMISSION_STATUSES_REQUIRING_NOTE: readonly SubmissionStatus[] = ['needs_info', 'rejected'];

export const SUBMISSION_STATUS_LABELS: Readonly<Record<SubmissionStatus, string>> = {
  received: 'Recebida',
  in_review: 'Em análise',
  needs_info: 'Aguardando informações',
  accepted: 'Aceita',
  rejected: 'Recusada',
};

export const OPEN_SUBMISSION_STATUSES: readonly SubmissionStatus[] = ['received', 'in_review', 'needs_info'];

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export const REPORT_TRANSITIONS: Readonly<Record<ReportStatus, readonly ReportStatus[]>> = {
  open: ['investigating', 'resolved', 'dismissed'],
  investigating: ['resolved', 'dismissed'],
  resolved: [],
  dismissed: [],
};

export const REPORT_STATUS_LABELS: Readonly<Record<ReportStatus, string>> = {
  open: 'Aberta',
  investigating: 'Investigando',
  resolved: 'Resolvida',
  dismissed: 'Descartada',
};

export const OPEN_REPORT_STATUSES: readonly ReportStatus[] = ['open', 'investigating'];

export type ReportReason =
  | 'wrong_info'
  | 'cancelled_or_changed'
  | 'suspicious_link'
  | 'fraud'
  | 'offensive'
  | 'image_rights'
  | 'other';

export const REPORT_REASON_LABELS: Readonly<Record<ReportReason, string>> = {
  wrong_info: 'Informação errada',
  cancelled_or_changed: 'Cancelado ou mudou',
  suspicious_link: 'Link suspeito',
  fraud: 'Golpe ou fraude',
  offensive: 'Conteúdo ofensivo',
  image_rights: 'Uso indevido de imagem',
  other: 'Outro motivo',
};

/** Motivos que pedem ação rápida (o evento pode estar enganando o público). */
export const URGENT_REPORT_REASONS: readonly ReportReason[] = ['fraud', 'suspicious_link'];

export function canChangeSubmission(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return SUBMISSION_TRANSITIONS[from].includes(to);
}

export function canChangeReport(from: ReportStatus, to: ReportStatus): boolean {
  return REPORT_TRANSITIONS[from].includes(to);
}

/** Encerrar uma denúncia exige registrar o que foi feito. */
export function reportRequiresNote(to: ReportStatus): boolean {
  return to === 'resolved' || to === 'dismissed';
}

/**
 * Conteúdo de uma sugestão. É o que o formulário público vai gravar em
 * submissions.payload; todos os campos são opcionais porque o JSON vem de fora.
 */
export type SubmissionPayload = {
  title?: string;
  categoryId?: number;
  description?: string;
  organizerName?: string;
  venueName?: string;
  venueAddress?: string;
  /** Data e hora no horário de Brasília, no formato do input datetime-local. */
  startsAtLocal?: string;
  priceText?: string;
  ticketUrl?: string;
  sourceUrl?: string;
};

export const SUBMISSION_FIELD_LABELS: Readonly<Record<keyof SubmissionPayload, string>> = {
  title: 'Título',
  categoryId: 'Categoria',
  description: 'Descrição',
  organizerName: 'Organização',
  venueName: 'Local',
  venueAddress: 'Endereço',
  startsAtLocal: 'Data e hora',
  priceText: 'Preço informado',
  ticketUrl: 'Link de ingresso',
  sourceUrl: 'Link de divulgação',
};

const TEXT_FIELDS = [
  'title',
  'description',
  'organizerName',
  'venueName',
  'venueAddress',
  'startsAtLocal',
  'priceText',
  'ticketUrl',
  'sourceUrl',
] as const;

/** Lê o payload sem confiar no formato: ignora campos desconhecidos ou de tipo errado. */
export function readSubmissionPayload(raw: unknown): SubmissionPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const payload: SubmissionPayload = {};
  for (const key of TEXT_FIELDS) {
    const value = input[key];
    if (typeof value === 'string' && value.trim()) payload[key] = value.trim();
  }
  if (typeof input.categoryId === 'number' && Number.isInteger(input.categoryId) && input.categoryId > 0) {
    payload.categoryId = input.categoryId;
  }
  return payload;
}
