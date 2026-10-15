import { isoToBrasiliaLocal } from './datetime';
import { parseReaisToCents, validatePrice, type Price } from './price';

/**
 * Leitura de divulgação de eventos sem IA: dados estruturados da página
 * (schema.org em JSON-LD), meta tags e padrões comuns em texto de rede social
 * ("sáb, 21/11 às 21h", "R$ 30", "entrada franca"). Tudo o que sai daqui é
 * sugestão: a curadoria confere na fonte antes de publicar.
 */
export type ExtractedEvent = {
  title?: string;
  description?: string;
  /** Formato do datetime-local, no horário de Brasília. */
  startsAtLocal?: string;
  endsAtLocal?: string;
  /** Falso quando só a data foi encontrada. */
  timeConfirmed?: boolean;
  venueName?: string;
  venueAddress?: string;
  organizerName?: string;
  price?: Price;
  ticketUrl?: string;
  sourceUrl?: string;
  categorySlug?: string;
  /** A página diz que o evento foi cancelado ou adiado. */
  cancelled?: boolean;
  /** Campos tirados só de meta tags (título genérico da página): o texto colado vale mais. */
  weakFields?: ('title' | 'description')[];
};

export type ExtractionOrigin = 'página' | 'texto';

export type Extraction = {
  data: ExtractedEvent;
  origins: Partial<Record<keyof ExtractedEvent, ExtractionOrigin>>;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', eacute: 'é', ecirc: 'ê', iacute: 'í',
  oacute: 'ó', ocirc: 'ô', otilde: 'õ', uacute: 'ú', ccedil: 'ç',
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã', Eacute: 'É', Ecirc: 'Ê', Iacute: 'Í',
  Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Uacute: 'Ú', Ccedil: 'Ç',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole;
    }
    return NAMED_ENTITIES[code] ?? whole;
  });
}

const clean = (value: unknown, max = 5000): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const text = decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : undefined;
};

const httpsUrl = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';
  return /^https:\/\/[^\s]+$/i.test(text) ? text : undefined;
};

// ---------------------------------------------------------------------------
// Datas

/** Converte data/hora do schema.org para o datetime-local de Brasília. */
function schemaDate(value: unknown): { local: string; timeConfirmed: boolean } | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(text);
  if (dateOnly) return { local: `${dateOnly[1]}T00:00`, timeConfirmed: false };
  const local = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(text);
  if (local) return { local: `${local[1]}T${local[2]}`, timeConfirmed: true };
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) && !Number.isNaN(Date.parse(text))) {
    return { local: isoToBrasiliaLocal(text), timeConfirmed: true };
  }
  return undefined;
}

const MONTHS: Record<string, number> = {
  jan: 1, janeiro: 1, fev: 2, fevereiro: 2, mar: 3, marco: 3, abr: 4, abril: 4, mai: 5, maio: 5,
  jun: 6, junho: 6, jul: 7, julho: 7, ago: 8, agosto: 8, set: 9, setembro: 9, out: 10, outubro: 10,
  nov: 11, novembro: 11, dez: 12, dezembro: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');

function validDay(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** Sem ano no texto: a próxima vez que esse dia acontece a partir de hoje. */
function inferYear(month: number, day: number, today: string): number {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  return month < m || (month === m && day < d) ? y + 1 : y;
}

const strip = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Primeira data do texto, como AAAA-MM-DD. */
export function findDate(text: string, today: string): string | undefined {
  const plain = strip(text);
  const candidates: { index: number; year?: number; month: number; day: number }[] = [];

  const written = /\b(\d{1,2})(?:º|o)?\s*(?:de\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b\.?(?:\s*(?:de\s+)?(\d{4}))?/g;
  for (const m of plain.matchAll(written)) {
    candidates.push({ index: m.index, day: Number(m[1]), month: MONTHS[m[2]!]!, year: m[3] ? Number(m[3]) : undefined });
  }
  const numeric = /(?<![\d/])(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?![\d/])/g;
  for (const m of plain.matchAll(numeric)) {
    const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : undefined;
    candidates.push({ index: m.index, day: Number(m[1]), month: Number(m[2]), year });
  }

  candidates.sort((a, b) => a.index - b.index);
  for (const c of candidates) {
    if (c.month < 1 || c.month > 12) continue;
    const year = c.year ?? inferYear(c.month, c.day, today);
    if (validDay(year, c.month, c.day)) return `${year}-${pad(c.month)}-${pad(c.day)}`;
  }
  return undefined;
}

/** Horários do texto ("21h", "21h30", "21:30"), na ordem em que aparecem. */
export function findTimes(text: string): string[] {
  const times: string[] = [];
  const pattern = /(?<![\d/:,.])([01]?\d|2[0-3])(?:\s?h\s?([0-5]\d)?|:([0-5]\d)\s?h?)(?![\d])/gi;
  for (const m of text.matchAll(pattern)) {
    const minutes = m[2] ?? m[3] ?? '00';
    times.push(`${pad(Number(m[1]))}:${minutes}`);
  }
  return times;
}

// ---------------------------------------------------------------------------
// Preço

/** Preço a partir de texto livre. Sem pista clara, devolve undefined (nunca "grátis"). */
export function findPrice(text: string): Price | undefined {
  const values = [...text.matchAll(/R\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/gi)]
    .map((m) => parseReaisToCents(m[1]!))
    .filter((v): v is number => v !== null && v > 0);
  const plain = strip(text);
  if (!values.length) {
    if (/\b(gratuit[oa]|gratis|entrada (franca|livre|gratuita)|0800)\b/.test(plain)) return { kind: 'free' };
    if (/\b(sob consulta|valor a combinar|consulte (o )?valor)\b/.test(plain)) return { kind: 'on_request' };
    return undefined;
  }
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (/\ba partir de\s*r\$/.test(plain)) return { kind: 'from', amountCents: unique[0]! };
  if (unique.length === 1) return { kind: 'fixed', amountCents: unique[0]! };
  return { kind: 'range', minCents: unique[0]!, maxCents: unique[unique.length - 1]! };
}

// ---------------------------------------------------------------------------
// Links e categoria

const TICKETING_HOSTS = [
  'sympla.com.br', 'eventim.com.br', 'ingresse.com', 'shotgun.live', 'bilheteriadigital.com',
  'ticketmaster.com.br', 'ingressorapido.com.br', 'blacktag.com.br', 'outgo.com.br', 'zigtickets.com.br',
  'ingressonacional.com.br', 'q2ingressos.com.br', 'uhuu.com', 'even3.com.br', 'doity.com.br',
];

export function isTicketingUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TICKETING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function findUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s<>"'()]+/gi)].map((m) => m[0].replace(/[.,;:!?]+$/, ''));
}

// Palavras que costumam aparecer na divulgação de cada categoria (slugs de reference_data).
const CATEGORY_HINTS: [slug: string, pattern: RegExp][] = [
  ['games-geek', /\b(games?|geek|anime|cosplay|e-?sports?|rpg|campeonato de|board ?games?|nerd)\b/],
  ['gastronomia', /\b(gastronomi\w*|food ?trucks?|degustacao|cervej\w*|chopp|vinhos?|feijoada|comida|culinari\w*|churrasco)\b/],
  ['feiras-comunidades', /\b(feiras?|bazar|brecho|mercadinho|artesanato|encontro de|comunidade|mutirao)\b/],
  ['festas', /\b(festas?|baile|balada|rave|open bar|after|dj set|pista|funk|eletronic\w*)\b/],
  ['shows-musica', /\b(shows?|banda|musica|samba|pagode|forro|rock|jazz|mpb|sertanej\w*|rap|hip ?hop|orquestra|sarau|roda de)\b/],
  ['cultura-arte', /\b(teatro|exposicao|exposicoes|museu|cinema|filme|danca|espetaculo|literatur\w*|poesia|galeria|mostra|peca)\b/],
  ['experiencias', /\b(oficina|workshop|curso|trilha|passeio|tour|aula|vivencia|yoga|corrida)\b/],
];

export function guessCategory(text: string): string | undefined {
  const plain = strip(text);
  let best: { slug: string; hits: number } | undefined;
  for (const [slug, pattern] of CATEGORY_HINTS) {
    const hits = plain.match(new RegExp(pattern.source, 'g'))?.length ?? 0;
    if (hits && (!best || hits > best.hits)) best = { slug, hits };
  }
  return best?.slug;
}

// ---------------------------------------------------------------------------
// Página (HTML)

type JsonObject = Record<string, unknown>;
const isObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v);

function flattenJsonLd(value: unknown, out: JsonObject[] = []): JsonObject[] {
  if (Array.isArray(value)) value.forEach((v) => flattenJsonLd(v, out));
  else if (isObject(value)) {
    out.push(value);
    if (value['@graph']) flattenJsonLd(value['@graph'], out);
  }
  return out;
}

const isEventType = (node: JsonObject) => {
  const types = ([] as unknown[]).concat(node['@type'] ?? []);
  return types.some((t) => typeof t === 'string' && /Event$/.test(t));
};

function schemaPrice(offers: unknown, free: unknown): Price | undefined {
  if (free === true || free === 'true') return { kind: 'free' };
  const list = ([] as unknown[]).concat(offers ?? []).filter(isObject);
  const cents: number[] = [];
  for (const offer of list) {
    const currency = offer.priceCurrency;
    if (typeof currency === 'string' && currency.toUpperCase() !== 'BRL') continue;
    for (const key of ['price', 'lowPrice', 'highPrice']) {
      const raw = offer[key];
      const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.replace(',', '.')) : NaN;
      if (Number.isFinite(value) && value >= 0) cents.push(Math.round(value * 100));
    }
  }
  if (!cents.length) return undefined;
  const paid = [...new Set(cents.filter((c) => c > 0))].sort((a, b) => a - b);
  if (!paid.length) return { kind: 'free' };
  const price: Price =
    paid.length === 1 ? { kind: 'fixed', amountCents: paid[0]! } : { kind: 'range', minCents: paid[0]!, maxCents: paid[paid.length - 1]! };
  return validatePrice(price);
}

function schemaAddress(address: unknown): string | undefined {
  if (typeof address === 'string') return clean(address, 200);
  if (!isObject(address)) return undefined;
  const parts = ['streetAddress', 'addressLocality', 'addressRegion']
    .map((k) => clean(address[k], 120))
    .filter((p): p is string => Boolean(p));
  return parts.length ? parts.join(', ').slice(0, 200) : undefined;
}

function metaContent(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = /\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i.exec(tag);
    const value = clean(content?.[1] ?? content?.[2]);
    if (value) return value;
  }
  return undefined;
}

export function extractFromHtml(html: string, pageUrl: string): ExtractedEvent {
  const result: ExtractedEvent = { sourceUrl: httpsUrl(pageUrl) ?? pageUrl };
  if (isTicketingUrl(pageUrl)) result.ticketUrl = httpsUrl(pageUrl);

  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1]!.trim());
    } catch {
      continue;
    }
    const event = flattenJsonLd(parsed).find(isEventType);
    if (!event) continue;

    result.title = clean(event.name, 140);
    result.description = clean(event.description);
    const start = schemaDate(event.startDate);
    if (start) {
      result.startsAtLocal = start.local;
      result.timeConfirmed = start.timeConfirmed;
    }
    const end = schemaDate(event.endDate);
    if (end?.timeConfirmed && start?.timeConfirmed && end.local > start.local) result.endsAtLocal = end.local;
    const location = ([] as unknown[]).concat(event.location ?? []).find(isObject);
    if (location) {
      result.venueName = clean(location.name, 120);
      result.venueAddress = schemaAddress(location.address);
    }
    const organizer = ([] as unknown[]).concat(event.organizer ?? []).find(isObject);
    if (organizer) result.organizerName = clean(organizer.name, 120);
    try {
      result.price = schemaPrice(event.offers, event.isAccessibleForFree);
    } catch {
      // Oferta com valores incoerentes: melhor deixar o preço em branco.
    }
    const offer = ([] as unknown[]).concat(event.offers ?? []).find(isObject);
    const offerUrl = httpsUrl(offer?.url);
    if (offerUrl) result.ticketUrl = offerUrl;
    const status = typeof event.eventStatus === 'string' ? event.eventStatus : '';
    if (/EventCancelled|EventPostponed/i.test(status)) result.cancelled = true;
    break;
  }

  const weak: ('title' | 'description')[] = [];
  if (!result.title) weak.push('title');
  if (!result.description) weak.push('description');
  if (weak.length) result.weakFields = weak;
  result.title ??= metaContent(html, 'og:title') ?? metaContent(html, 'twitter:title') ?? clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1], 140);
  result.description ??= metaContent(html, 'og:description') ?? metaContent(html, 'description');
  result.title = result.title?.slice(0, 140);
  return result;
}

// ---------------------------------------------------------------------------
// Texto livre

const LABEL_LINE = /^\s*(?:📍|(?:local|onde|endere[cç]o|quando|data|hor[aá]rio|ingressos?|valor|pre[cç]o)\b)/iu;

export function extractFromText(text: string, today: string): ExtractedEvent {
  const result: ExtractedEvent = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const titleLine = lines.find((l) => !/^https?:\/\//i.test(l) && !LABEL_LINE.test(l) && !findDate(l, today));
  const title = titleLine?.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}!?)]+$/gu, '').trim();
  if (title && title.length >= 3) result.title = title.slice(0, 140);

  const date = findDate(text, today);
  if (date) {
    const times = findTimes(text);
    result.startsAtLocal = `${date}T${times[0] ?? '00:00'}`;
    result.timeConfirmed = times.length > 0;
    if (times[1] && times[1] > times[0]!) result.endsAtLocal = `${date}T${times[1]}`;
  }

  for (const line of lines) {
    const venue = /^\s*(?:📍\s*|(?:local|onde)\s*[:\-–]\s*)(.+)$/iu.exec(line);
    if (venue && !result.venueName) {
      const [name, ...rest] = venue[1]!.split(/\s+[-–|]\s+/);
      result.venueName = clean(name, 120);
      if (rest.length) result.venueAddress = clean(rest.join(' - '), 200);
    }
    const address = /^\s*endere[cç]o\s*[:\-–]\s*(.+)$/i.exec(line);
    if (address) result.venueAddress = clean(address[1], 200);
    const producer = /^\s*(?:realiza[cç][aã]o|produ[cç][aã]o|organiza[cç][aã]o)\s*[:\-–]\s*(.+)$/i.exec(line);
    if (producer && !result.organizerName) result.organizerName = clean(producer[1], 120);
  }

  const price = findPrice(text);
  if (price) result.price = price;

  const urls = findUrls(text).filter((u) => u.startsWith('https://'));
  result.ticketUrl = urls.find(isTicketingUrl);
  result.sourceUrl = urls.find((u) => !isTicketingUrl(u)) ?? result.ticketUrl;
  if (!result.ticketUrl) delete result.ticketUrl;
  if (!result.sourceUrl) delete result.sourceUrl;

  // A descrição fica só com o texto corrido: linhas que viraram campos saem.
  const consumed = (l: string) =>
    LABEL_LINE.test(l) ||
    /https?:\/\//i.test(l) ||
    /^\s*(realiza|produ|organiza)/i.test(l) ||
    Boolean(findDate(l, today)) ||
    findTimes(l).length > 0 ||
    /R\$/.test(l);
  const body = lines.filter((l) => l !== titleLine && !consumed(l)).join('\n').trim();
  if (body) result.description = body.slice(0, 5000);
  return result;
}

/** Junta as duas leituras: o que veio da página tem prioridade; o texto completa. */
export function combineExtractions(page: ExtractedEvent | null, text: ExtractedEvent | null): Extraction {
  const data: ExtractedEvent = {};
  const origins: Extraction['origins'] = {};
  const weak = new Set<keyof ExtractedEvent>(page?.weakFields ?? []);
  const keys = new Set([...Object.keys(page ?? {}), ...Object.keys(text ?? {})]) as Set<keyof ExtractedEvent>;
  keys.delete('weakFields');
  for (const key of keys) {
    const fromPage = page?.[key];
    const fromText = text?.[key];
    if (fromPage !== undefined && !(weak.has(key) && fromText !== undefined)) {
      (data as Record<string, unknown>)[key] = fromPage;
      origins[key] = 'página';
    } else if (fromText !== undefined) {
      (data as Record<string, unknown>)[key] = fromText;
      origins[key] = 'texto';
    }
  }
  // O horário só vale junto da data de onde veio.
  if (data.startsAtLocal && origins.startsAtLocal !== origins.timeConfirmed) {
    data.timeConfirmed = (origins.startsAtLocal === 'página' ? page : text)?.timeConfirmed;
    origins.timeConfirmed = origins.startsAtLocal;
  }
  if (data.endsAtLocal && origins.endsAtLocal !== origins.startsAtLocal) {
    delete data.endsAtLocal;
    delete origins.endsAtLocal;
  }
  const hintText = [data.title, data.description, data.venueName].filter(Boolean).join(' ');
  if (hintText) {
    const slug = guessCategory(hintText);
    if (slug) data.categorySlug = slug;
  }
  return { data, origins };
}
