import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('remove acentos e pontuação', () => {
    expect(slugify('Festa Junina da Ceilândia — 2ª edição!')).toBe('festa-junina-da-ceilandia-2a-edicao');
  });

  it('troca & por "e" e junta separadores', () => {
    expect(slugify('Samba & Choro   na Laje')).toBe('samba-e-choro-na-laje');
  });

  it('respeita o tamanho máximo sem terminar em hífen', () => {
    const slug = slugify('palavra '.repeat(30), 20);
    expect(slug.length).toBeLessThanOrEqual(20);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('devolve vazio para texto sem letras', () => {
    expect(slugify('!!!')).toBe('');
  });
});
