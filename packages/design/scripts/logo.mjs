// Logotipo do Rowlê: "Letreiro". Letras da Bungee (OFL, letreiros urbanos)
// convertidas em contornos, com sombra 3D. O "O" foi redesenhado como o rosto
// da toupeira, e o Ê inverte as cores. O FAQ da OFL permite usar a fonte em
// logos e converter em contornos; o desenho resultante é nosso.
//
// Variações: dark (cores, fundo escuro), light (sobre verde-lima ou claro),
// mono (uma cor) e symbol (o rosto isolado, para avatar e ícone).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import { C } from './palette.mjs';

const require = createRequire(import.meta.url);
const buf = readFileSync(require.resolve('@expo-google-fonts/bungee/400Regular/Bungee_400Regular.ttf'));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const SIZE = 200;
const BASELINE = 200;
const CAP_TOP = 56;
const TRACK = 2;
const DEPTH = 14; // profundidade da sombra 3D
const FACE_W = 126; // largura do "O" redesenhado
const FACE_TOP = CAP_TOP - 3;
const FACE_H = BASELINE - FACE_TOP + 3;
const FACE_RADIUS = 34;

// Óculos da toupeira normalizados (largura 140).
const SHADES = 'M0 22 C30 0 112 0 140 20 L134 44 C110 54 88 48 70 38 C52 50 28 54 6 44 Z';

function shades(x, y, width, { fill, glint }) {
  const s = width / 140;
  const g = glint ? `<path d="M20 20 L46 14 M94 14 L120 20" stroke="${glint}" stroke-width="7" stroke-linecap="round"/>` : '';
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${SHADES}" fill="${fill}"/>${g}</g>`;
}

function roundedRect(x, y, w, h, r) {
  return `M${x} ${y + r} Q${x} ${y} ${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} Z`;
}

/** O "O" como rosto da toupeira, com o canto superior esquerdo em (x, FACE_TOP). */
function face(x, { body, lens, glint, nose }) {
  const sw = FACE_W * 1.24;
  const noseEl = nose
    ? `<ellipse cx="${x + FACE_W / 2}" cy="${FACE_TOP + FACE_H * 0.64}" rx="${FACE_W * 0.15}" ry="${FACE_W * 0.1}" fill="${nose}"/>`
    : '';
  return (
    `<path d="${roundedRect(x, FACE_TOP, FACE_W, FACE_H, FACE_RADIUS)}" fill="${body}"/>` +
    shades(x - (sw - FACE_W) / 2, FACE_TOP + FACE_H * 0.3, sw, { fill: lens, glint }) +
    noseEl
  );
}

function faceSilhouette(x, fill) {
  return face(x, { body: fill, lens: fill, glint: null, nose: null });
}

function extrude(draw) {
  return Array.from({ length: DEPTH }, (_, i) => `<g transform="translate(${i + 1} ${i + 1})">${draw()}</g>`).join('');
}

// Distribuição das letras: R, [rosto], W, L, Ê.
const letters = (() => {
  let x = 0;
  return ['R', 'O', 'W', 'L', 'Ê'].map((ch) => {
    if (ch === 'O') {
      const slot = { ch, x, face: true };
      x += FACE_W + TRACK;
      return slot;
    }
    const g = font.charToGlyph(ch);
    const p = g.getPath(x, BASELINE, SIZE);
    const slot = { ch, x, d: p.toPathData(2), bb: p.getBoundingBox() };
    x += (g.advanceWidth * SIZE) / font.unitsPerEm + TRACK;
    return slot;
  });
})();

const WIDTH = letters[letters.length - 1].bb.x2;
const FACE_X = letters.find((l) => l.face).x;
const VIEWBOX = `-12 -14 ${WIDTH + DEPTH + 26} 238`;

function doc(viewBox, body, label = 'Rowlê') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
}

function wordmark({ text, accent, depth, accentDepth = depth, body, lens, glint, nose }) {
  const flat = (fill, accentFill) =>
    letters.map((l) => (l.face ? faceSilhouette(l.x, fill) : `<path d="${l.d}" fill="${l.ch === 'Ê' ? accentFill : fill}"/>`)).join('');
  const shadow = depth ? extrude(() => flat(depth, accentDepth)) : '';
  const top = letters
    .map((l) => (l.face ? face(l.x, { body, lens, glint, nose }) : `<path d="${l.d}" fill="${l.ch === 'Ê' ? accent : text}"/>`))
    .join('');
  return doc(VIEWBOX, shadow + top);
}

/** Arte do símbolo (rosto com sombra) num quadro próprio, origem no canto do rosto. */
export function symbolArt({ depth = C.lime, body = C.paper, lens = C.ink, glint = C.lime, nose = C.pink } = {}) {
  const at = (x) => x - FACE_X;
  const shadow = depth ? extrude(() => `<g transform="translate(${-FACE_X} ${-FACE_TOP})">${faceSilhouette(FACE_X, depth)}</g>`) : '';
  return {
    width: FACE_W + (depth ? DEPTH : 0),
    height: FACE_H + (depth ? DEPTH : 0),
    svg: shadow + `<g transform="translate(${at(0)} ${-FACE_TOP})">${face(FACE_X, { body, lens, glint, nose })}</g>`,
  };
}

/** Rosto em uma cor só, com os óculos vazados (para ícone temático). */
export function symbolSilhouetteMask(id) {
  const sw = FACE_W * 1.24;
  const s = sw / 140;
  return {
    width: FACE_W,
    height: FACE_H,
    defs: `<mask id="${id}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="${FACE_W + 120}" height="${FACE_H + 120}"><rect x="-60" y="-60" width="${FACE_W + 120}" height="${FACE_H + 120}" fill="#fff"/><g transform="translate(${-(sw - FACE_W) / 2} ${FACE_H * 0.3}) scale(${s})"><path d="${SHADES}" fill="#000"/></g></mask>`,
    svg: `<path d="${roundedRect(0, 0, FACE_W, FACE_H, FACE_RADIUS)}" fill="#FFFFFF" mask="url(#${id})"/>`,
  };
}

export function logo() {
  const pad = 46;
  const art = symbolArt();
  const sw = art.width + pad * 2;
  const sh = art.height + pad * 2;
  return {
    dark: wordmark({ text: C.paper, accent: C.lime, depth: C.lime, accentDepth: C.paper, body: C.paper, lens: C.ink, glint: C.lime, nose: C.pink }),
    light: wordmark({ text: C.paper, accent: C.paper, depth: C.ink, body: C.paper, lens: C.ink, glint: C.lime, nose: C.pink }),
    mono: wordmark({ text: C.ink, accent: C.ink, depth: null, body: C.ink, lens: C.paper, glint: null, nose: null }),
    symbol: doc(
      `0 0 ${sw} ${sh}`,
      `<rect width="${sw}" height="${sh}" rx="52" fill="${C.ink}"/><g transform="translate(${pad} ${pad})">${art.svg}</g>`,
      'Símbolo Rowlê',
    ),
  };
}

/** Contorno de uma letra da Bungee, com a linha de base em `y` e corpo `size`. */
export function bungeeGlyph(ch, x, y, size) {
  const p = font.charToGlyph(ch).getPath(x, y, size);
  return { d: p.toPathData(2), bb: p.getBoundingBox() };
}

export { SHADES, roundedRect };
