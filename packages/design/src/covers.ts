/**
 * Capas geradas: cartazes no estilo lambe-lambe, feitos só de formas e cor, para
 * eventos sem imagem autorizada. Cada categoria tem um desenho e uma cor de apoio;
 * o slug do evento varia a composição, para dois eventos da mesma categoria não
 * ficarem iguais. Saída: SVG em texto (react-native-svg e web).
 */

/** Cores de apoio por categoria (permitidas pela documentação mestre para organizar categorias). */
export const categoryColors: Record<string, string> = {
  'shows-musica': '#C6FF36',
  festas: '#FF8FB8',
  'games-geek': '#8FB8FF',
  'cultura-arte': '#C9A7FF',
  gastronomia: '#FF8A5C',
  experiencias: '#7FE3C4',
  'feiras-comunidades': '#FFC24D',
  outros: '#D9DED6',
};

const INK = '#0B0D0C';
const PAPER = '#F3F5F0';

/** Número estável entre 0 e 1 a partir de um texto (FNV-1a). */
function seeded(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const n = (v: number) => Math.round(v * 10) / 10;

type Draw = (w: number, h: number, r: () => number, color: string) => string;

const DRAW: Record<string, Draw> = {
  // Ondas sonoras: anéis concêntricos e uma haste.
  'shows-musica': (w, h, r) => {
    const cx = w * (0.5 + r() * 0.25), cy = h * (0.3 + r() * 0.15), R = Math.min(w, h);
    return [0.5, 0.36, 0.22].map((k, i) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * k)}" fill="none" stroke="${INK}" stroke-width="${n(R * (0.035 - i * 0.008))}"/>`).join('') +
      `<rect x="${n(w * 0.1)}" y="${n(h * 0.12)}" width="${n(w * 0.08)}" height="${n(h * 0.5)}" fill="${INK}" transform="rotate(${n(-30 + r() * 20)} ${n(w * 0.14)} ${n(h * 0.37)})"/>`;
  },
  // Listras diagonais com uma lua cheia.
  festas: (w, h, r) => {
    const a = 12 + r() * 16, step = Math.max(w, h) / 7;
    const stripes = Array.from({ length: 12 }, (_, i) => `<rect x="${n(-w + i * step)}" y="${n(-h)}" width="${n(step * 0.42)}" height="${n(h * 3)}"/>`).join('');
    return `<g fill="${INK}" opacity=".9" transform="rotate(${n(a)} ${n(w / 2)} ${n(h / 2)})">${stripes}</g>` +
      `<circle cx="${n(w * (0.55 + r() * 0.25))}" cy="${n(h * (0.22 + r() * 0.15))}" r="${n(Math.min(w, h) * 0.22)}" fill="${PAPER}"/>`;
  },
  // Pixels e um raio.
  'games-geek': (w, h, r) => {
    const s = Math.min(w, h) / 8;
    const px = Array.from({ length: 18 }, () => `<rect x="${n(Math.floor(r() * 8) * s)}" y="${n(Math.floor(r() * 10) * s)}" width="${n(s)}" height="${n(s)}" opacity="${n(0.35 + r() * 0.55)}"/>`).join('');
    return `<g fill="${INK}">${px}</g><path d="M${n(w * 0.15)} ${n(h * 0.62)} L${n(w * 0.55)} ${n(h * 0.12)} L${n(w * 0.48)} ${n(h * 0.42)} L${n(w * 0.85)} ${n(h * 0.38)} L${n(w * 0.4)} ${n(h * 0.85)} L${n(w * 0.48)} ${n(h * 0.55)}Z" fill="${PAPER}" stroke="${INK}" stroke-width="${n(Math.min(w, h) * 0.02)}" stroke-linejoin="round"/>`;
  },
  // Aspas e um recorte de papel.
  'cultura-arte': (w, h, r) => {
    const S = Math.min(w, h);
    return `<path d="M${n(w * 0.1)} ${n(h * 0.5)} q0 -${n(S * 0.28)} ${n(S * 0.24)} -${n(S * 0.32)} v${n(S * 0.1)} q-${n(S * 0.1)} ${n(S * 0.06)} -${n(S * 0.1)} ${n(S * 0.14)} h${n(S * 0.1)} v${n(S * 0.18)} h-${n(S * 0.24)}Z" fill="${INK}"/>` +
      `<path d="M${n(w * 0.1 + S * 0.3)} ${n(h * 0.5)} q0 -${n(S * 0.28)} ${n(S * 0.24)} -${n(S * 0.32)} v${n(S * 0.1)} q-${n(S * 0.1)} ${n(S * 0.06)} -${n(S * 0.1)} ${n(S * 0.14)} h${n(S * 0.1)} v${n(S * 0.18)} h-${n(S * 0.24)}Z" fill="${INK}"/>` +
      `<rect x="${n(w * 0.58)}" y="${n(h * 0.1)}" width="${n(S * 0.3)}" height="${n(S * 0.3)}" fill="${PAPER}" transform="rotate(${n(6 + r() * 14)} ${n(w * 0.73)} ${n(h * 0.25)})"/>`;
  },
  // Toalha listrada e um prato.
  gastronomia: (w, h, r, color) => {
    const rows = 9;
    const stripes = Array.from({ length: rows }, (_, i) => `<rect x="0" y="${n((i * h) / rows)}" width="${w}" height="${n(h / rows / 2)}" fill="${INK}" opacity=".85"/>`).join('');
    const cx = w * (0.4 + r() * 0.2), cy = h * (0.32 + r() * 0.1), R = Math.min(w, h) * 0.26;
    return stripes + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R)}" fill="${PAPER}" stroke="${INK}" stroke-width="${n(R * 0.12)}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.45)}" fill="${color}"/>`;
  },
  // Ondas de trilha.
  experiencias: (w, h, r) => {
    const amp = Math.min(w, h) * 0.05, rowsN = 6;
    return Array.from({ length: rowsN }, (_, i) => {
      const y = h * (0.1 + i * 0.13) + r() * 6;
      let d = `M0 ${n(y)}`;
      for (let x = 0; x < w; x += w / 6) d += ` q${n(w / 24)} -${n(amp)} ${n(w / 12)} 0 t${n(w / 12)} 0`;
      return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(amp * 0.6)}" stroke-linecap="round"/>`;
    }).join('');
  },
  // Barracas: círculos, quadrados e triângulos em grade.
  'feiras-comunidades': (w, h, r) => {
    const cols = 5, s = w / cols, size = s * 0.7;
    let out = '';
    for (let i = 0; i < 20; i++) {
      const x = (i % cols) * s + s * 0.15, y = Math.floor(i / cols) * s * 1.1 + s * 0.2, k = Math.floor(r() * 3);
      out += k === 0 ? `<circle cx="${n(x + size / 2)}" cy="${n(y + size / 2)}" r="${n(size / 2)}"/>` : k === 1 ? `<rect x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}" rx="${n(size * 0.12)}"/>` : `<path d="M${n(x)} ${n(y + size)} L${n(x + size / 2)} ${n(y)} L${n(x + size)} ${n(y + size)}Z"/>`;
    }
    return `<g fill="${INK}">${out}</g>`;
  },
  // Retícula.
  outros: (w, h, r) => {
    const cols = 12, step = w / cols, rowsN = Math.ceil(h / step);
    let out = '';
    const fx = r(), fy = r();
    for (let y = 0; y < rowsN; y++) for (let x = 0; x < cols; x++) {
      const t = (Math.abs(x / cols - fx) + Math.abs(y / rowsN - fy)) / 2;
      out += `<circle cx="${n(x * step + step / 2)}" cy="${n(y * step + step / 2)}" r="${n(step * 0.45 * (1 - t))}"/>`;
    }
    return `<g fill="${INK}">${out}</g>`;
  },
};

export interface CoverOptions {
  /** Slug da categoria (ex.: "festas"). Desconhecida vira "outros". */
  category: string;
  /** Texto estável que varia a composição (o slug do evento). */
  seed: string;
  width: number;
  height: number;
  /** Palavra grande no pé do cartaz (opcional; omitir quando o título vai por cima). */
  word?: string;
}

/** SVG da capa gerada. Decorativa: o título e as informações vêm do app, por cima. */
export function coverSvg({ category, seed, width: w, height: h, word }: CoverOptions): string {
  const key = DRAW[category] ? category : 'outros';
  const color = categoryColors[key] ?? categoryColors.outros!;
  const r = seeded(`${key}:${seed}`);
  const text = word
    ? `<text x="${n(w * 0.07)}" y="${n(h * 0.93)}" font-family="Anton_400Regular, Anton" font-size="${n(Math.min(w * 0.32, h * 0.42))}" fill="${INK}">${word.replace(/[<&>]/g, '')}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><rect width="${w}" height="${h}" fill="${color}"/>${DRAW[key]!(w, h, r, color)}${text}</svg>`;
}
