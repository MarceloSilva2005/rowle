/**
 * Preço de uma sessão. Valores em centavos de real.
 *
 * `unknown` existe para que a ausência de informação nunca vire "Grátis":
 * sem preço confirmado, o app diz que não sabe.
 */
export type Price =
  | { kind: 'free' }
  | { kind: 'fixed'; amountCents: number }
  | { kind: 'from'; amountCents: number }
  | { kind: 'range'; minCents: number; maxCents: number }
  | { kind: 'on_request' }
  | { kind: 'unknown' };

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

function isValidCents(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export class InvalidPriceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPriceError';
  }
}

export function validatePrice(price: Price): Price {
  switch (price.kind) {
    case 'fixed':
    case 'from':
      if (!isValidCents(price.amountCents)) {
        throw new InvalidPriceError('O valor precisa ser um número inteiro de centavos maior que zero.');
      }
      return price;
    case 'range':
      if (!isValidCents(price.minCents) || !isValidCents(price.maxCents)) {
        throw new InvalidPriceError('Os valores da faixa precisam ser inteiros de centavos maiores que zero.');
      }
      if (price.minCents >= price.maxCents) {
        throw new InvalidPriceError('O menor valor da faixa precisa ser menor que o maior.');
      }
      return price;
    default:
      return price;
  }
}

export function formatPrice(price: Price): string {
  validatePrice(price);
  switch (price.kind) {
    case 'free':
      return 'Grátis';
    case 'fixed':
      return formatCents(price.amountCents);
    case 'from':
      return `A partir de ${formatCents(price.amountCents)}`;
    case 'range':
      return `${formatCents(price.minCents)} a ${formatCents(price.maxCents)}`;
    case 'on_request':
      return 'Sob consulta';
    case 'unknown':
      return 'Preço não informado';
  }
}

/**
 * Converte um valor digitado em reais ("30", "30,50", "1.200,00", "R$ 25")
 * para centavos. Devolve null se não for um valor válido.
 */
export function parseReaisToCents(input: string): number | null {
  const cleaned = input.replace(/R\$/i, '').replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** Monta o preço a partir das colunas da sessão no banco. */
export function priceFromColumns(
  kind: Price['kind'],
  minCents: number | null,
  maxCents: number | null,
): Price {
  switch (kind) {
    case 'fixed':
    case 'from':
      return { kind, amountCents: minCents ?? 0 };
    case 'range':
      return { kind, minCents: minCents ?? 0, maxCents: maxCents ?? 0 };
    default:
      return { kind };
  }
}
