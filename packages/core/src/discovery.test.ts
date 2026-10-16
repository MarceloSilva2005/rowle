import { describe, expect, it } from 'vitest';
import {
  addDays,
  brasiliaDay,
  buildFeedSections,
  formatCardDate,
  readDiscoveryRow,
  sessionDateParts,
  normalizeSearch,
  matchesSearch,
  applyFilters,
  NO_FILTERS,
  activeFilterCount,
  onePerEvent,
  weekStrip,
  startsIn,
  dayLabel,
  sessionIsOver,
  stampLabel,
  weekendDays,
  type DiscoverySession,
} from './discovery';

function session(overrides: Partial<DiscoverySession>): DiscoverySession {
  return {
    sessionId: 's1',
    eventId: 'e1',
    eventSlug: 'evento',
    title: 'Evento',
    categoryId: 1,
    coverPath: null,
    isSponsored: false,
    venueId: 'v1',
    venueName: 'Local',
    venueAddress: null,
    regionId: 1,
    startsAt: '2026-10-16T23:00:00Z',
    endsAt: null,
    timeConfirmed: true,
    soldOut: false,
    price: { kind: 'unknown' },
    ticketUrl: null,
    ageRating: null,
    ageRatingOfficial: false,
    ...overrides,
  };
}

const row = {
    session_id: 's',
    event_id: 'e',
    event_slug: 'show',
    title: 'Show',
    category_id: 1,
    cover_path: null,
    is_sponsored: false,
    venue_id: 'v',
    venue_name: 'Clube',
    region_id: 1,
    starts_at: '2026-10-17T00:00:00Z',
    ends_at: null,
    time_confirmed: true,
    session_status: 'sold_out' as const,
    price_kind: 'range' as const,
    price_min_cents: 2000,
    price_max_cents: 4000,
    ticket_url: 'https://ingressos.example/show',
    age_rating: '18' as const,
    age_rating_official: false,
    venue_address: 'SCLN 408',
  };

// Sexta, 16 de outubro de 2026, 15h em Brasília.
const FRIDAY = new Date('2026-10-16T18:00:00Z');

describe('dias no horário de Brasília', () => {
  it('usa o dia de Brasília, não o UTC', () => {
    expect(brasiliaDay('2026-10-17T01:00:00Z')).toBe('2026-10-16');
  });

  it('soma dias atravessando o mês', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('acha o fim de semana', () => {
    expect(weekendDays('2026-10-16')).toEqual(['2026-10-17', '2026-10-18']);
    expect(weekendDays('2026-10-12')).toEqual(['2026-10-17', '2026-10-18']);
    expect(weekendDays('2026-10-17')).toEqual(['2026-10-17', '2026-10-18']);
    expect(weekendDays('2026-10-18')).toEqual(['2026-10-18']);
  });
});

describe('data do cartão', () => {
  it('diz hoje e amanhã', () => {
    expect(formatCardDate('2026-10-17T00:00:00Z', true, FRIDAY)).toBe('Hoje · 21h');
    expect(formatCardDate('2026-10-17T23:30:00Z', true, FRIDAY)).toBe('Amanhã · 20h30');
  });

  it('usa a data completa depois de amanhã', () => {
    expect(formatCardDate('2026-10-19T00:00:00Z', true, FRIDAY)).toBe('dom., 18 de out. · 21h');
  });

  it('mantém o aviso de horário a confirmar', () => {
    expect(formatCardDate('2026-10-16T15:00:00Z', false, FRIDAY)).toBe('Hoje · horário a confirmar');
  });
});

describe('seções do feed', () => {
  it('separa hoje, fim de semana e próximos dias', () => {
    const sections = buildFeedSections(
      [
        session({ sessionId: 'a', eventId: 'a', startsAt: '2026-10-17T00:00:00Z' }),
        session({ sessionId: 'b', eventId: 'b', startsAt: '2026-10-17T20:00:00Z' }),
        session({ sessionId: 'c', eventId: 'c', startsAt: '2026-10-21T22:00:00Z' }),
      ],
      FRIDAY,
    );
    expect(sections.map((s) => [s.key, s.items.map((i) => i.session.sessionId)])).toEqual([
      ['today', ['a']],
      ['weekend', ['b']],
      ['upcoming', ['c']],
    ]);
  });

  it('não repete o evento dentro da seção e conta as outras datas', () => {
    const weekend = buildFeedSections(
      [
        session({ sessionId: 'dom', startsAt: '2026-10-18T20:00:00Z' }),
        session({ sessionId: 'sab', startsAt: '2026-10-17T20:00:00Z' }),
      ],
      FRIDAY,
    )[0]!;
    expect(weekend.key).toBe('weekend');
    expect(weekend.items).toHaveLength(1);
    expect(weekend.items[0]!.session.sessionId).toBe('sab');
    expect(weekend.items[0]!.moreSessions).toBe(1);
  });

  it('coloca em hoje a sessão que começou ontem e ainda não acabou', () => {
    const today = buildFeedSections([session({ startsAt: '2026-10-15T20:00:00Z' })], FRIDAY)[0]!;
    expect(today.key).toBe('today');
  });

  it('não sobe patrocinado na ordem', () => {
    const today = buildFeedSections(
      [
        session({ sessionId: 'pago', eventId: 'p', isSponsored: true, startsAt: '2026-10-16T23:30:00Z' }),
        session({ sessionId: 'cedo', eventId: 'c', startsAt: '2026-10-16T22:00:00Z' }),
      ],
      FRIDAY,
    )[0]!;
    expect(today.items.map((i) => i.session.sessionId)).toEqual(['cedo', 'pago']);
  });

  it('não mostra seção vazia', () => {
    expect(buildFeedSections([], FRIDAY)).toEqual([]);
  });
});

describe('linha da view', () => {

  it('monta preço e esgotado', () => {
    const read = readDiscoveryRow(row);
    expect(read?.price).toEqual({ kind: 'range', minCents: 2000, maxCents: 4000 });
    expect(read?.soldOut).toBe(true);
  });

  it('descarta linha sem campo essencial', () => {
    expect(readDiscoveryRow({ ...row, title: null })).toBeNull();
  });
});

describe('partes da data', () => {
  it('separa dia, mês, dia da semana e hora em Brasília', () => {
    expect(sessionDateParts('2026-10-19T00:30:00Z', true)).toEqual({
      weekday: 'dom',
      day: '18',
      month: 'out',
      time: '21h30',
    });
  });

  it('não inventa hora', () => {
    expect(sessionDateParts('2026-10-18T15:00:00Z', false).time).toBeNull();
  });
});

describe('busca, filtros e agenda', () => {
  const names = {
    regions: new Map([[1, 'Plano Piloto'], [9, 'Ceilândia']]),
    categories: new Map([[1, 'Shows e música'], [2, 'Festas']]),
  };
  const forro = session({ sessionId: 'f', eventId: 'f', title: 'Noite de forró pé de serra', categoryId: 2, regionId: 9, venueName: 'Galpão Norte', startsAt: '2026-10-17T01:00:00Z', price: { kind: 'range', minCents: 2000, maxCents: 4000 } });
  const choro = session({ sessionId: 'c', eventId: 'c', title: 'Roda de choro', categoryId: 1, regionId: 1, venueName: 'Espaço Cerrado', startsAt: '2026-10-16T21:30:00Z', price: { kind: 'free' } });
  const feira = session({ sessionId: 'a', eventId: 'a', title: 'Feira', categoryId: 2, regionId: 1, startsAt: '2026-10-17T13:00:00Z', price: { kind: 'free' } });
  const feira2 = session({ sessionId: 'b', eventId: 'a', title: 'Feira', categoryId: 2, regionId: 1, startsAt: '2026-10-18T13:00:00Z', price: { kind: 'free' } });

  it('normaliza acento e maiúsculas', () => {
    expect(normalizeSearch('  Forró PÉ ')).toBe('forro pe');
  });

  it('busca em título, local, região e categoria, palavra por palavra', () => {
    expect(matchesSearch(forro, 'forro', names)).toBe(true);
    expect(matchesSearch(forro, 'ceilandia galpao', names)).toBe(true);
    expect(matchesSearch(forro, 'festas', names)).toBe(true);
    expect(matchesSearch(forro, 'forro plano', names)).toBe(false);
    expect(matchesSearch(forro, '   ', names)).toBe(true);
  });

  it('filtra por dia, categoria, região e grátis, combinados', () => {
    const all = [forro, choro, feira, feira2];
    expect(applyFilters(all, { ...NO_FILTERS, day: '2026-10-16' }, FRIDAY).map((s) => s.sessionId)).toEqual(['f', 'c']);
    expect(applyFilters(all, { ...NO_FILTERS, freeOnly: true }, FRIDAY).map((s) => s.sessionId)).toEqual(['c', 'a', 'b']);
    expect(applyFilters(all, { ...NO_FILTERS, categories: [2], regions: [1] }, FRIDAY).map((s) => s.sessionId)).toEqual(['a', 'b']);
    expect(applyFilters(all, { day: '2026-10-17', categories: [2], regions: [], freeOnly: true }, FRIDAY).map((s) => s.sessionId)).toEqual(['a']);
  });

  it('conta filtros ligados sem o dia', () => {
    expect(activeFilterCount({ day: '2026-10-16', categories: [1, 2], regions: [9], freeOnly: true })).toBe(4);
  });

  it('mostra um rolê por evento, com a próxima sessão', () => {
    const items = onePerEvent([feira2, forro, feira, choro]);
    expect(items.map((i) => i.session.sessionId)).toEqual(['c', 'f', 'a']);
    expect(items[2]!.moreSessions).toBe(1);
  });

  it('monta a semana a partir de hoje com a contagem por dia', () => {
    const week = weekStrip([forro, choro, feira, feira2], FRIDAY);
    expect(week).toHaveLength(7);
    expect(week[0]).toEqual({ day: '2026-10-16', weekday: 'SEX', dayOfMonth: '16', count: 2 });
    expect(week[1]!.count).toBe(1);
    expect(week[6]!.day).toBe('2026-10-22');
  });

  it('diz quanto falta para começar, só hoje', () => {
    expect(startsIn('2026-10-16T21:30:00Z', true, FRIDAY)).toBe('em 4 h');
    expect(startsIn('2026-10-16T18:40:00Z', true, FRIDAY)).toBe('em 40 min');
    expect(startsIn('2026-10-16T17:30:00Z', true, FRIDAY)).toBe('agora');
    expect(startsIn('2026-10-17T13:00:00Z', true, FRIDAY)).toBeNull();
    expect(startsIn('2026-10-16T21:30:00Z', false, FRIDAY)).toBeNull();
  });

  it('dá nome ao dia escolhido', () => {
    expect(dayLabel(null, FRIDAY)).toBe('Próximos');
    expect(dayLabel('2026-10-16', FRIDAY)).toBe('Hoje');
    expect(dayLabel('2026-10-17', FRIDAY)).toBe('Amanhã');
    expect(dayLabel('2026-10-18', FRIDAY)).toBe('Dom 18');
  });

  it('lê a classificação da view', () => {
    expect(readDiscoveryRow({ ...row, age_rating: '18', age_rating_official: true })?.ageRating).toBe('18');
    expect(readDiscoveryRow({ ...row, age_rating: null, age_rating_official: null })?.ageRatingOfficial).toBe(false);
  });
});

describe('fim da sessão e fita de data', () => {
  it('segue a regra da view pública', () => {
    expect(sessionIsOver('2026-10-16T10:00:00Z', null, true, FRIDAY)).toBe(true); // 6 h depois
    expect(sessionIsOver('2026-10-16T14:00:00Z', null, true, FRIDAY)).toBe(false);
    expect(sessionIsOver('2026-10-16T14:00:00Z', '2026-10-16T17:00:00Z', true, FRIDAY)).toBe(true);
    expect(sessionIsOver('2026-10-16T03:00:00Z', null, false, FRIDAY)).toBe(false); // vale até o fim do dia
    expect(sessionIsOver('2026-10-15T15:00:00Z', null, false, FRIDAY)).toBe(true);
  });

  it('escreve a fita', () => {
    expect(stampLabel('2026-10-17T01:00:00Z', true, FRIDAY)).toBe('HOJE 22H');
    expect(stampLabel('2026-10-17T23:30:00Z', true, FRIDAY)).toBe('AMANHÃ 20H30');
    expect(stampLabel('2026-10-18T17:00:00Z', true, FRIDAY)).toBe('DOM 18 · 14H');
    expect(stampLabel('2026-10-18T13:00:00Z', false, FRIDAY)).toBe('DOM 18');
  });
});
