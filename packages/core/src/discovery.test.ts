import { describe, expect, it } from 'vitest';
import {
  addDays,
  brasiliaDay,
  buildFeedSections,
  formatCardDate,
  readDiscoveryRow,
  sessionDateParts,
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
    regionId: 1,
    startsAt: '2026-10-16T23:00:00Z',
    endsAt: null,
    timeConfirmed: true,
    soldOut: false,
    price: { kind: 'unknown' },
    ticketUrl: null,
    ...overrides,
  };
}

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
  };

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
