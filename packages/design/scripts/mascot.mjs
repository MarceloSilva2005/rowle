// A toupeira do Rowlê, construída com a mesma geometria do logo "Letreiro":
// corpo em retângulo arredondado, os mesmos óculos, sombra 3D verde-lima e
// formas exatas (círculos, arcos, letras da Bungee). Nada é desenhado "a olho":
// tudo sai das constantes abaixo e é espelhado em torno do centro.
// Quadro de 260 × 260.
import { bungeeGlyph, roundedRect, SHADES } from './logo.mjs';
import { C } from './palette.mjs';

export { C };

const CX = 130; // eixo de simetria
const BODY_W = 132;
const BODY_R = 52;
const BODY_TOP = 56;
const BODY_H = 260;
const GROUND_Y = 214; // topo da faixa do chão
const DEPTH = 8; // sombra 3D, como no logo
const PAW_R = 15;

const n = (v) => Number(v.toFixed(2));

function circle(cx, cy, r) {
  return `M${n(cx - r)} ${n(cy)} A${r} ${r} 0 1 0 ${n(cx + r)} ${n(cy)} A${r} ${r} 0 1 0 ${n(cx - r)} ${n(cy)} Z`;
}

function fill(d, color, extra = '') {
  return `<path d="${d}" fill="${color}"${extra}/>`;
}

/** Sombra 3D: cópias deslocadas em diagonal, como a do logo. */
function extrude(ds, depth = DEPTH, color = C.lime) {
  const shapes = ds.map((d) => fill(d, color)).join('');
  return Array.from({ length: depth }, (_, i) => `<g transform="translate(${i + 1} ${i + 1})">${shapes}</g>`).join('');
}

function bodyPath(dy) {
  return roundedRect(CX - BODY_W / 2, BODY_TOP + dy, BODY_W, BODY_H, BODY_R);
}

// O visor: o brilho verde-lima dos óculos faz o papel dos olhos. A forma muda
// com o humor; o resto do rosto fica fixo (base estável, só a expressão varia).
// Centros das lentes no desenho dos óculos (largura 140).
const LENSES = [36, 104];
const LENS_Y = 27;

const EYES = {
  neutro: (c) => `<rect x="${c - 12}" y="${LENS_Y - 5}" width="24" height="10" rx="5" fill="${C.lime}"/>`,
  feliz: (c) => `<path d="M${c - 13} ${LENS_Y + 5} Q${c} ${LENS_Y - 13} ${c + 13} ${LENS_Y + 5}" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>`,
  x: (c) => `<path d="M${c - 9} ${LENS_Y - 9} L${c + 9} ${LENS_Y + 9} M${c + 9} ${LENS_Y - 9} L${c - 9} ${LENS_Y + 9}" stroke="${C.lime}" stroke-width="7" stroke-linecap="round"/>`,
  fechado: (c) => `<path d="M${c - 12} ${LENS_Y + 2} H${c + 12}" stroke="${C.lime}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.7"/>`,
};

function visor(top, eyes = 'neutro') {
  // Alinhado às bordas do corpo: preto sobre o fundo escuro sumiria.
  const s = BODY_W / 140;
  const x = CX - BODY_W / 2;
  const y = top + 34;
  const look = LENSES.map((c) => EYES[eyes](c)).join('');
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})"><path d="${SHADES}" fill="${C.ink}"/>${look}</g>`;
}

let clipIds = 0;

/** Lado direito do corpo um tom mais escuro: luz vindo da esquerda, igual em todas as poses. */
function sideShade(dy) {
  const id = `lado-${++clipIds}`;
  const top = BODY_TOP + dy;
  return `<clipPath id="${id}"><path d="${bodyPath(dy)}"/></clipPath><rect x="${CX + BODY_W / 2 - 24}" y="${top}" width="24" height="${BODY_H}" fill="${C.furShade}" clip-path="url(#${id})"/>`;
}

const MOUTHS = {
  sorriso: (y) =>
    fill(`M${CX - 17} ${y} A17 17 0 0 0 ${CX + 17} ${y} Z`, C.ink) +
    `<ellipse cx="${CX}" cy="${y + 10}" rx="7" ry="4" fill="${C.pink}"/>`,
  esforco: (y) =>
    fill(roundedRect(CX - 18, y - 2, 36, 16, 8), C.ink) + fill(roundedRect(CX - 13, y + 1, 26, 5, 2.5), C.paper),
  o: (y) => fill(circle(CX, y + 6, 7), C.ink),
  ondulada: (y) =>
    `<path d="M${CX - 18} ${y + 6} L${CX - 9} ${y} L${CX} ${y + 6} L${CX + 9} ${y} L${CX + 18} ${y + 6}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
};

/** Corpo, barriga, óculos, nariz e boca, com o topo do corpo deslocado em `dy`. */
function mole(dy, { mouth, eyes = 'neutro' } = {}) {
  const top = BODY_TOP + dy;
  return (
    fill(bodyPath(dy), C.fur) +
    sideShade(dy) +
    fill(roundedRect(CX - 38, top + 124, 76, 200, 38), C.belly) +
    visor(top, eyes) +
    `<ellipse cx="${CX}" cy="${top + 86}" rx="17" ry="11.5" fill="${C.pink}"/>` +
    (mouth ? MOUTHS[mouth](top + 108) : '')
  );
}

function ground() {
  return fill(roundedRect(26, GROUND_Y, 208, 12, 6), C.lime);
}

const GROUND_PAWS = [circle(CX - 58, GROUND_Y - 4, PAW_R), circle(CX + 58, GROUND_Y - 4, PAW_R)];

function paws(ds) {
  return extrude(ds) + ds.map((d) => fill(d, C.pink)).join('');
}

/** Toupeira saindo do chão: corpo e sombra cortados na faixa do chão. */
function emerging(dy, face) {
  return `<g clip-path="url(#above-ground)">${extrude([bodyPath(dy)])}${mole(dy, face)}</g>${ground()}`;
}

/** Arco de movimento centrado em (cx, cy), do ângulo a0 ao a1 (graus). */
function motionArc(cx, cy, r, a0, a1, width = 6) {
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `<path d="M${n(x0)} ${n(y0)} A${r} ${r} 0 0 1 ${n(x1)} ${n(y1)}" stroke="${C.lime}" stroke-width="${width}" stroke-linecap="round" fill="none"/>`;
}

// Carregando: três toupeiras pequenas saindo da toca em sequência, como os
// "três pontinhos". Cada uma é a toupeira inteira em escala, recortada no chão.
const LOADING_SCALE = 0.48;
const LOADING_X = [CX - 70, CX, CX + 70];
const LOADING_STATIC = [0, 40, 85]; // quanto cada uma está afundada no quadro estático
export const LOADING_HIDDEN = 150; // posição de repouso na animação (quase escondida)

/** As três toupeiras; `dys` define o afundamento de cada uma, `className` permite animar. */
export function loadingMoles(dys, { className } = {}) {
  const ty = GROUND_Y - GROUND_Y * LOADING_SCALE;
  return LOADING_X.map((x, i) => {
    const tx = x - CX * LOADING_SCALE;
    const cls = className ? ` class="${className} ${className}-${i}"` : '';
    return `<g transform="translate(${n(tx)} ${n(ty)}) scale(${LOADING_SCALE})"><g clip-path="url(#above-ground)"><g${cls}>${extrude([bodyPath(dys[i])])}${mole(dys[i])}</g></g></g>`;
  }).join('');
}

function glyph(ch, x, baseline, size, color = C.lime) {
  return fill(bungeeGlyph(ch, x, baseline, size).d, color);
}

function svg(content, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" role="img" aria-label="${title}"><title>${title}</title><defs><clipPath id="above-ground"><rect width="260" height="${GROUND_Y}"/></clipPath></defs>${content}</svg>\n`;
}

export const poses = {
  acenando: () => {
    const wave = circle(CX + 70, BODY_TOP + 96, PAW_R + 1);
    return svg(
      emerging(0, { mouth: 'sorriso', eyes: 'feliz' }) +
        paws([GROUND_PAWS[0], wave]) +
        motionArc(CX + 70, BODY_TOP + 96, 30, -75, -15) +
        motionArc(CX + 70, BODY_TOP + 96, 42, -70, -20),
      'Toupeira do Rowlê acenando',
    );
  },

  carregando: () =>
    svg(
      loadingMoles(LOADING_STATIC) + ground(),
      'Três toupeiras do Rowlê saindo da toca: carregando',
    ),

  procurando: () => {
    // A lupa fica exatamente sobre a lente direita dos óculos, com um brilho redondo.
    const s = BODY_W / 140;
    const lens = [CX - BODY_W / 2 + 104 * s, BODY_TOP + 34 + 26 * s];
    const r = 27;
    const a = Math.PI / 4;
    const h0 = [lens[0] + (r + 3) * Math.cos(a), lens[1] + (r + 3) * Math.sin(a)];
    const h1 = [h0[0] + 26 * Math.cos(a), h0[1] + 26 * Math.sin(a)];
    const grip = circle(h1[0], h1[1], PAW_R - 1);
    return svg(
      emerging(0, { mouth: 'o' }) +
        paws([GROUND_PAWS[0]]) +
        `<path d="M${n(h0[0])} ${n(h0[1])} L${n(h1[0])} ${n(h1[1])}" stroke="${C.paper}" stroke-width="11" stroke-linecap="round"/>` +
        `<circle cx="${n(lens[0])}" cy="${n(lens[1])}" r="${r}" fill="${C.ink}" stroke="${C.paper}" stroke-width="8"/>` +
        `<circle cx="${n(lens[0] - 8)}" cy="${n(lens[1] - 8)}" r="6" fill="${C.lime}"/>` +
        `<circle cx="${n(lens[0] + 5)}" cy="${n(lens[1] + 4)}" r="3" fill="${C.lime}"/>` +
        paws([grip]) +
        glyph('?', 14, 104, 92),
      'Toupeira do Rowlê procurando com uma lupa',
    );
  },

  erro: () =>
    svg(
      emerging(0, { mouth: 'ondulada', eyes: 'x' }) +
        paws(GROUND_PAWS) +
        glyph('!', 214, 100, 92) +
        // Gota de suor colada no canto da cabeça.
        fill('M54 62 C60 72 66 78 66 86 A12 12 0 0 1 42 86 C42 78 48 72 54 62 Z', C.sky),
      'Toupeira do Rowlê preocupada: algo deu errado',
    ),

  dormindo: () =>
    svg(
      emerging(64, { eyes: 'fechado' }) +
        paws(GROUND_PAWS) +
        glyph('Z', 150, 116, 46) +
        glyph('Z', 180, 82, 62) +
        glyph('Z', 214, 40, 44),
      'Toupeira do Rowlê dormindo',
    ),
};
