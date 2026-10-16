import { describe, expect, it } from 'vitest';
import { AGE_RATINGS, CLASSIND_COLORS, classIndDescription, classIndLabel, isAgeRating } from './classind';
import type { Database } from './database.types';

describe('classificação indicativa', () => {
  it('tem as sete faixas do guia, na ordem, inclusive 6 anos', () => {
    expect(AGE_RATINGS).toEqual(['L', '6', '10', '12', '14', '16', '18']);
  });

  it('acompanha o enum do banco', () => {
    const fromDb: Database['public']['Enums']['age_rating'][] = ['L', '6', '10', '12', '14', '16', '18'];
    expect([...AGE_RATINGS]).toEqual(fromDb);
  });

  it('usa as cores oficiais', () => {
    expect(CLASSIND_COLORS.L).toBe('#00A651');
    expect(CLASSIND_COLORS['18']).toBe('#000000');
  });

  it('mostra o símbolo provisório quando a classificação não é oficial', () => {
    expect(classIndLabel('18', true)).toBe('18');
    expect(classIndLabel('18', false)).toBe('A18');
    expect(classIndLabel('L', false)).toBe('AL');
  });

  it('descreve em texto', () => {
    expect(classIndDescription('L')).toBe('Livre');
    expect(classIndDescription('14')).toBe('14 anos');
  });

  it('reconhece valores válidos', () => {
    expect(isAgeRating('6')).toBe(true);
    expect(isAgeRating('7')).toBe(false);
    expect(isAgeRating(null)).toBe(false);
  });
});
