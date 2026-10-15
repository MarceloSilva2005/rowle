import { describe, expect, it } from 'vitest';
import { dismissalPair, duplicateReasons, localDay } from './duplicates';

describe('duplicateReasons', () => {
  it('descreve título, dia e local', () => {
    expect(duplicateReasons({ title_similarity: 0.375, same_day: true, same_venue: true, strong: true })).toEqual([
      'Título 38% parecido',
      'Mesmo dia',
      'Mesmo local',
    ]);
  });

  it('chama de mesmo título quando só muda acento ou caixa', () => {
    expect(duplicateReasons({ title_similarity: 1, same_day: false, same_venue: false, strong: true })).toEqual([
      'Mesmo título',
    ]);
  });

  it('não cita título quase sem relação', () => {
    expect(duplicateReasons({ title_similarity: 0.05, same_day: true, same_venue: true, strong: false })).toEqual([
      'Mesmo dia',
      'Mesmo local',
    ]);
  });
});

describe('dismissalPair', () => {
  it('guarda o par sempre na mesma ordem', () => {
    const a = '00000000-0000-0000-0000-0000000000e1';
    const b = '00000000-0000-0000-0000-0000000000e2';
    expect(dismissalPair(b, a)).toEqual(dismissalPair(a, b));
    expect(dismissalPair(b, a)).toEqual({ event_id: a, other_event_id: b });
  });

  it('recusa comparar o evento com ele mesmo', () => {
    expect(() => dismissalPair('x', 'x')).toThrow();
  });
});

describe('localDay', () => {
  it('extrai o dia do datetime-local', () => {
    expect(localDay('2030-11-20T23:30')).toBe('2030-11-20');
    expect(localDay('2030-11-20')).toBe('2030-11-20');
  });

  it('devolve null para formato desconhecido', () => {
    expect(localDay('20/11/2030 23h')).toBeNull();
    expect(localDay(undefined)).toBeNull();
  });
});
