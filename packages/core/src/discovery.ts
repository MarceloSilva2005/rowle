import { TIME_ZONE, formatSessionDate } from './datetime';
import { priceFromColumns, type Price } from './price';
import type { Database } from './database.types';
import { isAgeRating, type AgeRating } from './classind';

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
  venueAddress: string | null;
  regionId: number;
  startsAt: string;
  endsAt: string | null;
  timeConfirmed: boolean;
  soldOut: boolean;
  price: Price;
  ticketUrl: string | null;
  ageRating: AgeRating | null;
  /** true = classificação oficial do Ministério; false = autoclassificação (símbolo provisório). */
  ageRatingOfficial: boolean;
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
    venueAddress: row.venue_address,
    regionId: row.region_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeConfirmed: row.time_confirmed ?? true,
    soldOut: row.session_status === 'sold_out',
    price: priceFromColumns(row.price_kind, row.price_min_cents, row.price_max_cents),
    ticketUrl: row.ticket_url,
    ageRating: isAgeRating(row.age_rating) ? row.age_rating : null,
    ageRatingOfficial: row.age_rating_official ?? false,
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

// ---------------------------------------------------------------------------
// Interface aprovada em 2026-10-16 (Rolês, Agenda, Explorar, Você).

/** Texto comparável para busca: minúsculas e sem acento. */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Nomes usados na busca e nos filtros (vêm das tabelas de regiões e categorias). */
export interface DiscoveryNames {
  regions: ReadonlyMap<number, string>;
  categories: ReadonlyMap<number, string>;
}

/** A sessão casa com a busca se cada palavra aparece no título, local, região ou categoria. */
export function matchesSearch(session: DiscoverySession, query: string, names: DiscoveryNames): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSearch(
    [session.title, session.venueName, names.regions.get(session.regionId) ?? '', names.categories.get(session.categoryId) ?? ''].join(' '),
  );
  return words.every((w) => haystack.includes(w));
}

export interface DiscoveryFilters {
  /** Dia "AAAA-MM-DD" (Brasília) ou null para todos os próximos. */
  day: string | null;
  categories: number[];
  regions: number[];
  freeOnly: boolean;
}

export const NO_FILTERS: DiscoveryFilters = { day: null, categories: [], regions: [], freeOnly: false };

/** Quantos filtros estão ligados, sem contar o dia (que tem botão próprio). */
export function activeFilterCount(f: DiscoveryFilters): number {
  return f.categories.length + f.regions.length + (f.freeOnly ? 1 : 0);
}

/**
 * Aplica os filtros. "Dia" pega a sessão que acontece naquele dia em Brasília; uma
 * sessão que começou ontem e ainda não acabou conta para hoje.
 */
export function applyFilters(sessions: DiscoverySession[], f: DiscoveryFilters, now: Date): DiscoverySession[] {
  const today = brasiliaDay(now);
  return sessions.filter((s) => {
    if (f.day) {
      const day = brasiliaDay(s.startsAt);
      if (f.day === today ? day > today : day !== f.day) return false;
    }
    if (f.categories.length && !f.categories.includes(s.categoryId)) return false;
    if (f.regions.length && !f.regions.includes(s.regionId)) return false;
    if (f.freeOnly && s.price.kind !== 'free') return false;
    return true;
  });
}

/**
 * Um rolê por evento (a próxima sessão), em ordem de horário. É a lista da tela
 * Rolês. `otherDates` conta as outras sessões do mesmo evento na seleção.
 */
export function onePerEvent(sessions: DiscoverySession[]): FeedItem[] {
  const sorted = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const byEvent = new Map<string, FeedItem>();
  for (const s of sorted) {
    const item = byEvent.get(s.eventId);
    if (item) item.moreSessions += 1;
    else byEvent.set(s.eventId, { session: s, moreSessions: 0 });
  }
  return [...byEvent.values()];
}

export interface WeekDay {
  day: string;
  /** "SEX" */
  weekday: string;
  /** "16" */
  dayOfMonth: string;
  count: number;
}

/** Os próximos `length` dias a partir de hoje, com quantas sessões há em cada um. */
export function weekStrip(sessions: DiscoverySession[], now: Date, length = 7): WeekDay[] {
  const today = brasiliaDay(now);
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const day = brasiliaDay(s.startsAt) < today ? today : brasiliaDay(s.startsAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from({ length }, (_, i) => {
    const day = addDays(today, i);
    const parts = sessionDateParts(`${day}T15:00:00Z`, false);
    return { day, weekday: parts.weekday.toUpperCase(), dayOfMonth: parts.day, count: counts.get(day) ?? 0 };
  });
}

/**
 * Quanto falta para começar: "agora", "em 40 min", "em 2 h". Só para hoje e para o
 * que ainda não começou há mais de 1 h; caso contrário, null.
 */
export function startsIn(iso: string, timeConfirmed: boolean, now: Date): string | null {
  if (!timeConfirmed || brasiliaDay(iso) !== brasiliaDay(now)) return null;
  const minutes = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  if (minutes < -60) return null;
  if (minutes <= 0) return 'agora';
  if (minutes < 60) return `em ${minutes} min`;
  return `em ${Math.round(minutes / 60)} h`;
}

/** Rótulo do botão de dia na tela Rolês: "Hoje", "Amanhã", "Sáb 17" ou "Próximos". */
export function dayLabel(day: string | null, now: Date): string {
  if (!day) return 'Próximos';
  const today = brasiliaDay(now);
  if (day === today) return 'Hoje';
  if (day === addDays(today, 1)) return 'Amanhã';
  const p = sessionDateParts(`${day}T15:00:00Z`, false);
  return `${p.weekday.charAt(0).toUpperCase()}${p.weekday.slice(1)} ${p.day}`;
}

/**
 * A sessão já acabou? Mesma regra da view `discoverable_sessions`: termina em
 * `endsAt`; sem término, 6 h depois do início; com horário a confirmar, no fim do
 * dia (Brasília).
 */
export function sessionIsOver(startsAt: string, endsAt: string | null, timeConfirmed: boolean, now: Date): boolean {
  if (endsAt) return new Date(endsAt) <= now;
  if (timeConfirmed) return new Date(startsAt).getTime() + 6 * 3600_000 <= now.getTime();
  return brasiliaDay(startsAt) < brasiliaDay(now);
}

/** Texto da fita de data na tela Rolês: "HOJE 22H", "AMANHÃ 20H30", "SÁB 17 · 14H", "SÁB 17". */
export function stampLabel(iso: string, timeConfirmed: boolean, now: Date): string {
  const p = sessionDateParts(iso, timeConfirmed);
  const day = brasiliaDay(iso);
  const today = brasiliaDay(now);
  const when = day <= today ? 'HOJE' : day === addDays(today, 1) ? 'AMANHÃ' : `${p.weekday.toUpperCase()} ${p.day}`;
  if (!p.time) return when;
  return when.includes(' ') ? `${when} · ${p.time.toUpperCase()}` : `${when} ${p.time.toUpperCase()}`;
}
