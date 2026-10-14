import { describe, expect, it } from 'vitest';
import { formatPrice, InvalidPriceError, parseReaisToCents, priceFromColumns } from './price';

// Intl usa espaço não separável entre "R$" e o valor.
const nb = (s: string) => s.replace(/R\$ /g, 'R$ ');

describe('formatPrice', () => {
  it('nunca transforma preço desconhecido em gratuito', () => {
    expect(formatPrice({ kind: 'unknown' })).toBe('Preço não informado');
  });

  it('formata os casos confirmados em reais', () => {
    expect(formatPrice({ kind: 'free' })).toBe('Grátis');
    expect(formatPrice({ kind: 'fixed', amountCents: 3000 })).toBe(nb('R$ 30,00'));
    expect(formatPrice({ kind: 'from', amountCents: 2550 })).toBe(nb('A partir de R$ 25,50'));
    expect(formatPrice({ kind: 'range', minCents: 2000, maxCents: 120000 })).toBe(
      nb('R$ 20,00 a R$ 1.200,00'),
    );
    expect(formatPrice({ kind: 'on_request' })).toBe('Sob consulta');
  });

  it('rejeita valores zerados, negativos ou fracionados', () => {
    expect(() => formatPrice({ kind: 'fixed', amountCents: 0 })).toThrow(InvalidPriceError);
    expect(() => formatPrice({ kind: 'from', amountCents: -100 })).toThrow(InvalidPriceError);
    expect(() => formatPrice({ kind: 'fixed', amountCents: 10.5 })).toThrow(InvalidPriceError);
  });

  it('rejeita faixa invertida ou vazia', () => {
    expect(() => formatPrice({ kind: 'range', minCents: 5000, maxCents: 5000 })).toThrow(
      InvalidPriceError,
    );
    expect(() => formatPrice({ kind: 'range', minCents: 8000, maxCents: 5000 })).toThrow(
      InvalidPriceError,
    );
  });
});

describe('parseReaisToCents', () => {
  it('entende os formatos que a curadoria digita', () => {
    expect(parseReaisToCents('30')).toBe(3000);
    expect(parseReaisToCents('30,5')).toBe(3050);
    expect(parseReaisToCents('R$ 25,90')).toBe(2590);
    expect(parseReaisToCents('1.200,00')).toBe(120000);
  });

  it('recusa o que não é valor', () => {
    expect(parseReaisToCents('')).toBeNull();
    expect(parseReaisToCents('trinta')).toBeNull();
    expect(parseReaisToCents('30.5')).toBeNull();
  });
});

describe('priceFromColumns', () => {
  it('reconstrói o preço a partir das colunas', () => {
    expect(priceFromColumns('from', 3000, null)).toEqual({ kind: 'from', amountCents: 3000 });
    expect(priceFromColumns('range', 2000, 5000)).toEqual({ kind: 'range', minCents: 2000, maxCents: 5000 });
    expect(priceFromColumns('unknown', null, null)).toEqual({ kind: 'unknown' });
  });
});
