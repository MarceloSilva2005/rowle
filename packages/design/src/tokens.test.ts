import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { colors, mascotColors, type ColorToken } from './tokens';

// Toda combinação de texto e fundo usada na interface precisa passar no WCAG AA
// para texto normal (4,5:1). Ao criar uma combinação nova, inclua aqui.
const textPairs: Array<[ColorToken, ColorToken]> = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surfaceRaised'],
  ['textMuted', 'bg'],
  ['textMuted', 'surface'],
  ['textMuted', 'surfaceRaised'],
  ['brand', 'bg'],
  ['brand', 'surface'],
  ['onBrand', 'brand'],
  ['onWarning', 'warning'],
  ['warning', 'surface'],
  ['danger', 'bg'],
  ['danger', 'surface'],
  ['info', 'surface'],
];

describe('contraste das cores', () => {
  it('calcula os extremos corretamente', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it.each(textPairs)('%s sobre %s atinge 4,5:1', (fg, bg) => {
    expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('a cor de borda se distingue do fundo', () => {
    expect(contrastRatio(colors.border, colors.bg)).toBeGreaterThan(1.4);
  });
});

describe('toupeira', () => {
  // Elemento gráfico (WCAG 1.4.11): o corpo precisa se destacar do fundo e das superfícies.
  it.each(['bg', 'surface'] as const)('pelo tem contraste de 3:1 ou mais com %s', (bg) => {
    expect(contrastRatio(mascotColors.fur, colors[bg])).toBeGreaterThanOrEqual(3);
  });
});
