import { describe, expect, it } from 'vitest';
import { brasiliaLocalToIso, formatSessionDate, isoToBrasiliaLocal } from './datetime';

describe('horário de Brasília', () => {
  it('converte o campo datetime-local para instante com fuso -03:00', () => {
    expect(brasiliaLocalToIso('2026-10-18T21:00')).toBe('2026-10-18T21:00:00-03:00');
    expect(new Date(brasiliaLocalToIso('2026-10-18T21:00')).toISOString()).toBe('2026-10-19T00:00:00.000Z');
  });

  it('rejeita valores fora do formato', () => {
    expect(() => brasiliaLocalToIso('18/10/2026 21:00')).toThrow();
  });

  it('volta do instante para o campo, sem depender do fuso da máquina', () => {
    expect(isoToBrasiliaLocal('2026-10-19T00:30:00Z')).toBe('2026-10-18T21:30');
  });

  it('formata a sessão em português', () => {
    expect(formatSessionDate('2026-10-19T00:00:00Z')).toBe('dom., 18 de out. · 21h');
    expect(formatSessionDate('2026-10-19T00:30:00Z')).toBe('dom., 18 de out. · 21h30');
  });

  it('avisa quando o horário não foi confirmado', () => {
    expect(formatSessionDate('2026-10-18T15:00:00Z', false)).toBe('dom., 18 de out. · horário a confirmar');
  });
});
