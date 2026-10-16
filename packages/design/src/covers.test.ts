import { describe, expect, it } from 'vitest';
import { categoryColors, coverSvg } from './covers';

const CATEGORIES = ['shows-musica', 'festas', 'games-geek', 'cultura-arte', 'gastronomia', 'experiencias', 'feiras-comunidades', 'outros'];

describe('capas geradas', () => {
  it('tem desenho e cor para cada categoria do banco', () => {
    for (const c of CATEGORIES) {
      const svg = coverSvg({ category: c, seed: 'evento', width: 300, height: 400 });
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain(`fill="${categoryColors[c]}"`);
      expect(svg).not.toContain('NaN');
    }
  });

  it('é estável para o mesmo evento e varia entre eventos', () => {
    const a = coverSvg({ category: 'festas', seed: 'forro', width: 300, height: 400 });
    expect(coverSvg({ category: 'festas', seed: 'forro', width: 300, height: 400 })).toBe(a);
    expect(coverSvg({ category: 'festas', seed: 'samba', width: 300, height: 400 })).not.toBe(a);
  });

  it('usa "outros" para categoria desconhecida', () => {
    expect(coverSvg({ category: 'nova', seed: 'x', width: 100, height: 100 })).toContain(categoryColors.outros);
  });

  it('só escreve a palavra quando pedida, sem deixar passar marcação', () => {
    expect(coverSvg({ category: 'festas', seed: 'x', width: 100, height: 100 })).not.toContain('<text');
    expect(coverSvg({ category: 'festas', seed: 'x', width: 100, height: 100, word: 'A<b>' })).toContain('>Ab</text>');
  });
});
