import { TIME_ZONE, formatSessionDate } from './datetime';
import { priceFromColumns, type Price } from './price';
import type { Database } from './database.types';

type ViewRow = Database['public']['Views']['discoverable_sessions']['Row'];

/** Uma sessão que pode aparecer na descoberta, já com os campos obrigatórios conferidos. */
export interface DiscoverySession {
  sessionId: string;
  eventId: string;
  eventSlug: string;
  title: string;
  categoryId: number;
  coverPath: string | null;
  isSponsored: boolean;
  venueId: string;
  venueName: string;
  regionId: number;
  startsAt: string;
  endsAt: string | null;
  timeConfirmed: boolean;
  soldOut: boolean;
  price: Price;
  ticketUrl: string | null;
}

/**
 * Converte uma linha da view `discoverable_sessions`. A view devolve tudo como
 * opcional; uma linha sem os campos essenciais é descartada (null).
 */
export function readDiscoveryRow(row: ViewRow): DiscoverySession | null {
  if (
    !row.session_id ||
    !row.event_id ||
    !row.event_slug ||
    !row.title ||
    row.category_id == null ||
    !row.venue_id ||
    !row.venue_name ||
    row.region_id == null ||
    !row.starts_at ||
    !row.price_kind
  ) {
    return null;
  }
  return {
    sessionId: row.session_id,
    eventId: row.event_id,
    eventSlug: row.event_slug,
    title: row.title,
    categoryId: row.category_id,
    coverPath: row.cover_path,
    isSponsored: row.is_sponsored ?? false,
    venueId: row.venue_id,
    venueName: row.venue_name,
    regionId: row.region_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeConfirmed: row.time_confirmed ?? true,
    soldOut: row.session_status === 'sold_out',
    price: priceFromColumns(row.price_kind, row.price_min_cents, row.price_max_cents),
    ticketUrl: row.ticket_url,
  };
}

/** Dia no horário de Brasília, "AAAA-MM-DD". */
export function brasiliaDay(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** Soma dias a um dia "AAAA-MM-DD" (calendário puro, sem fuso). */
export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
function weekday(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/**
 * Sábado e domingo do fim de semana atual ou do próximo. No sábado, o fim de
 * semana é hoje e amanhã; no domingo, só hoje.
 */
export function weekendDays(today: string): string[] {
  const dow = weekday(today);
  if (dow === 0) return [today];
  const saturday = addDays(today, 6 - dow);
  return [saturday, addDays(saturday, 1)];
}

/** Data curta para o cartão: "Hoje · 21h", "Amanhã · 21h" ou "sáb., 18 de out. · 21h". */
export function formatCardDate(iso: string, timeConfirmed: boolean, now: Date): string {
  const full = formatSessionDate(iso, timeConfirmed);
  const day = brasiliaDay(iso);
  const today = brasiliaDay(now);
  const time = full.slice(full.indexOf(' · '));
  if (day === today) return `Hoje${time}`;
  if (day === addDays(today, 1)) return `Amanhã${time}`;
  return full;
}

/** Um evento no feed: a próxima sessão dentro da seção e quantas outras existem nela. */
export interface FeedItem {
  session: DiscoverySession;
  moreSessions: number;
}

export type FeedSectionKey = 'today' | 'weekend' | 'upcoming';

export interface FeedSection {
  key: FeedSectionKey;
  title: string;
  items: FeedItem[];
}

const SECTION_TITLES: Record<FeedSectionKey, string> = {
  today: 'Hoje',
  weekend: 'Fim de semana',
  upcoming: 'Próximos dias',
};

function groupByEvent(sessions: DiscoverySession[]): FeedItem[] {
  const byEvent = new Map<string, FeedItem>();
  for (const session of sessions) {
    const item = byEvent.get(session.eventId);
    if (item) item.moreSessions += 1;
    else byEvent.set(session.eventId, { session, moreSessions: 0 });
  }
  return [...byEvent.values()];
}

/**
 * Divide as sessões em Hoje, Fim de semana e Próximos dias, sem repetir o mesmo
 * evento dentro de uma seção. Um evento pode aparecer em mais de uma seção se
 * tiver sessões em dias diferentes. Seções vazias não entram. A ordem é sempre
 * por horário: patrocinado não sobe na lista, só ganha o selo.
 */
export function buildFeedSections(sessions: DiscoverySession[], now: Date): FeedSection[] {
  const today = brasiliaDay(now);
  const weekend = new Set(weekendDays(today).filter((day) => day !== today));
  const buckets: Record<FeedSectionKey, DiscoverySession[]> = { today: [], weekend: [], upcoming: [] };

  const sorted = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const session of sorted) {
    const day = brasiliaDay(session.startsAt);
    if (day <= today) buckets.today.push(session);
    else if (weekend.has(day)) buckets.weekend.push(session);
    else buckets.upcoming.push(session);
  }

  return (Object.keys(buckets) as FeedSectionKey[])
    .map((key) => ({ key, title: SECTION_TITLES[key], items: groupByEvent(buckets[key]) }))
    .filter((section) => section.items.length > 0);
}

export interface DateParts {
  /** "sáb" */
  weekday: string;
  /** "18" */
  day: string;
  /** "out" */
  month: string;
  /** "21h", "21h30" ou null quando o horário não foi confirmado. */
  time: string | null;
}

/** Partes da data para o bloco do cartão, no horário de Brasília. */
export function sessionDateParts(iso: string, timeConfirmed: boolean): DateParts {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    (parts.find((p) => p.type === type)?.value ?? '').replace('.', '');
  const minute = get('minute');
  const hour = Number(get('hour'));
  return {
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
    time: timeConfirmed ? (minute === '00' ? `${hour}h` : `${hour}h${minute}`) : null,
  };
}
