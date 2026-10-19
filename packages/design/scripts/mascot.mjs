// A toupeira do Rowlê ("Adesivo", aprovada em 2026-10-19): o rosto do logo (o "O" lima de
// cantos arredondados, óculos esportivos e nariz oval em tinta) como adesivo de lambe,
// com contorno de papel. Os olhos ficam atrás dos óculos: a expressão vem do brilho lima
// nas lentes, da boca e das mãos de pá (palma lima-escuro, quatro garras curtas e
// redondas). Sem braços, sem bigodes, sem chão. Quadro de 260 × 260.
//
// Tamanho mínimo: poses inteiras a partir de 64 dp; abaixo disso, só a cabeça (headArt).
import { bungeeGlyph, SHADES } from './logo.mjs';
import { C } from './palette.mjs';

const K = { ink: C.ink, lime: C.lime, limeDeep: '#A6DB22', paper: C.paper, dim: '#3A413B' };
// Proporções do "O" do logo (logo.mjs): 126 × 150, raio 34.
const LOGO = { w: 126, h: 150, r: 34 };

const f2 = (v) => Number(v.toFixed(2));
const svg = (b, vb = '0 0 260 260') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${b}</svg>`;
const p = (d, f, x = '') => `<path d="${d}" fill="${f}"${x}/>`;
const ln = (d, c, w, x = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
const ci = (x, y, r, f) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${f}"/>`;
const el = (x, y, rx, ry, f, e = '') => `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${f}"${e}/>`;
const g = (inner, t, extra = '') => `<g transform="${t}"${extra}>${inner}</g>`;
const rr = (x, y, w, h, r) => `M${x} ${y + r} Q${x} ${y} ${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} Z`;

// Rosto com 128 de largura, centrado em x = 130. Óculos 1,2× mais largos que o "O".
const W = 128;
const S = W / LOGO.w;
const H = LOGO.h * S;
const X = 130 - W / 2;
const Y = 46;
const GW = W * 1.2;
const GS = GW / 140;
const GX = X - (GW - W) / 2;
const GY = Y + H * 0.3;
const LENS = [[GX + 38 * GS, GY + 25 * GS], [GX + 104 * GS, GY + 25 * GS]];
const NOSE = { x: 130, y: GY + 38 * GS + 13 * S };
const HEAD = rr(X, Y, W, H, LOGO.r * S);
const MID = f2(Y + H / 2);
const OUTLINE = 9;
const BOTTOM = Y + H + OUTLINE - 1; // onde as mãos se apoiam

const LOOK = {
  neutro: () => LENS.map(([x, y]) => ln(`M${f2(x - 9)} ${f2(y - 2)} h18`, K.lime, 6)).join(''),
  feliz: () => LENS.map(([x, y]) => ln(`M${f2(x - 10)} ${f2(y + 3)} q10 -12 20 0`, K.lime, 6)).join(''),
  fechado: () => LENS.map(([x, y]) => ln(`M${f2(x - 9)} ${f2(y)} q9 5 18 0`, K.dim, 5)).join(''),
  confuso: () => ci(LENS[0][0], LENS[0][1] - 1, 9, K.lime) + ci(LENS[1][0], LENS[1][1], 4, K.lime),
  // Triste: o canto de dentro sobe e o de fora cai.
  triste: () => LENS.map(([x, y], i) => ln(i === 0 ? `M${f2(x - 9)} ${f2(y + 4)} q8 -2 17 -8` : `M${f2(x - 8)} ${f2(y - 4)} q9 6 17 8`, K.lime, 5.5)).join(''),
  // Procurando: a lente direita fica atrás da lupa.
  mira: () => ln(`M${f2(LENS[0][0] - 2)} ${f2(LENS[0][1] - 2)} h12`, K.lime, 6),
};
const MOUTH = {
  aberta: p(`M${NOSE.x - 9} ${f2(NOSE.y + 18)} Q${NOSE.x} ${f2(NOSE.y + 33)} ${NOSE.x + 9} ${f2(NOSE.y + 18)} Z`, K.ink),
  o: el(NOSE.x + 4, NOSE.y + 23, 4, 5, K.ink),
  torta: ln(`M${NOSE.x - 10} ${f2(NOSE.y + 22)} q5 -5 10 0 q5 5 10 -2`, K.ink, 4.5),
  triste: ln(`M${NOSE.x - 9} ${f2(NOSE.y + 25)} q9 -7 18 0`, K.ink, 4.5),
  calma: ln(`M${NOSE.x - 6} ${f2(NOSE.y + 21)} q6 3 12 0`, K.ink, 4),
};

/** Cabeça-adesivo: contorno de papel em volta do "O" e dos óculos, depois o rosto. */
function sticker({ look = 'neutro', mouth = null, rot = -4 }) {
  const border = `<path d="${HEAD}" fill="${K.paper}" stroke="${K.paper}" stroke-width="${OUTLINE * 2}" stroke-linejoin="round"/>` +
    g(`<path d="${SHADES}" fill="${K.paper}" stroke="${K.paper}" stroke-width="${f2((OUTLINE * 2) / GS)}" stroke-linejoin="round"/>`, `translate(${f2(GX)} ${f2(GY)}) scale(${f2(GS)})`);
  const face = p(HEAD, K.lime) + g(p(SHADES, K.ink), `translate(${f2(GX)} ${f2(GY)}) scale(${f2(GS)})`) +
    LOOK[look]() + el(NOSE.x, NOSE.y, 15 * S, 10.5 * S, K.ink) + (mouth ? MOUTH[mouth] : '');
  return g(border + face, `rotate(${rot} 130 ${MID})`);
}

/** Mão de pá: palma lima-escuro com contorno e quatro garras redondas (apontam para -y). */
function paw(x, y, angle, s = 1) {
  const claws = [-11, -3.7, 3.7, 11].map((cx, i) => {
    const len = i === 0 || i === 3 ? 14 : 18;
    return `<rect x="${f2(cx - 3.8)}" y="${f2(-6 - len)}" width="7.6" height="${len + 6}" rx="3.8" fill="${K.paper}" stroke="${K.ink}" stroke-width="3"/>`;
  }).join('');
  return g(claws + el(0, 0, 19, 13.5, K.limeDeep, ` stroke="${K.ink}" stroke-width="4"`) + ln('M-9 3 q9 5 18 0', K.ink, 2.5, ' opacity=".3"'), `translate(${f2(x)} ${f2(y)}) rotate(${f2(angle)}) scale(${s})`);
}
// As duas mãos apoiadas na borda de baixo, garras para fora.
const leftHand = () => paw(88, BOTTOM, 174);
const bothHands = () => leftHand() + paw(172, BOTTOM, 186);

/** Glifo da Bungee em lima com a sombra de papel do "Ê" do logo. */
function sign(ch, x, y, size, rot, opacity = 1) {
  const q = bungeeGlyph(ch, x, y, size);
  const c = [f2((q.bb.x1 + q.bb.x2) / 2), f2((q.bb.y1 + q.bb.y2) / 2)];
  const d = f2(size * 0.065);
  return g(g(p(q.d, K.paper), `translate(${d} ${d})`) + p(q.d, K.lime), `rotate(${rot} ${c[0]} ${c[1]})`, opacity < 1 ? ` opacity="${opacity}"` : '');
}

/** Lupa simples (cabo, aro e vidro, olho aumentado em lima), segura pela pata atravessada no cabo. */
function magnifier() {
  const cx = LENS[1][0] + 4;
  const cy = LENS[1][1] + 2;
  const from = [cx + 18, cy + 18];
  const to = [cx + 56, cy + 58];
  const phi = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  const handle = `M${f2(from[0])} ${f2(from[1])} L${f2(to[0])} ${f2(to[1])}`;
  return ln(handle, K.paper, 19) + ln(handle, K.ink, 10) + ci(cx, cy, 29, K.paper) + ci(cx, cy, 24, K.ink) + ci(cx, cy, 9, K.lime) +
    paw(cx + 40, cy + 41, phi - 90, 0.95);
}

export const poses = {
  acenando: () => svg(sticker({ look: 'feliz', mouth: 'aberta' }) + leftHand() + paw(220, 108, 20)),
  procurando: () => svg(sticker({ look: 'mira', mouth: 'o', rot: 3 }) + g(magnifier(), `rotate(3 130 ${MID})`) + leftHand()),
  triste: () => svg(sticker({ look: 'triste', mouth: 'triste', rot: -3 }) + bothHands()),
  erro: () => svg(sticker({ look: 'confuso', mouth: 'torta', rot: -5 }) + bothHands() + sign('?', 210, 62, 54, 12)),
  dormindo: () => svg(sticker({ look: 'fechado', mouth: 'calma', rot: 2 }) + bothHands() + sign('Z', 208, 62, 38, 10) + sign('Z', 236, 30, 24, 14, 0.7)),
  // Quadro parado do carregando (web e "menos movimento"): três cabeças, a do meio no alto.
  // No app, elas saem uma por vez de trás da fita (CarregandoAnimado).
  carregando: () => svg([50, 130, 210].map((x, i) => g(sticker({ rot: [-5, 0, 5][i] }), `translate(${f2(x - 130 * 0.36)} ${f2(180 - (i === 1 ? 26 : 0) - (Y + H) * 0.36)}) scale(0.36)`)).join('')),
};

/** Cabeça isolada (quadro 272 × 200), para a animação do carregando e tamanhos pequenos. */
export const headArt = () => svg(sticker({ rot: -4 }), '-6 26 272 200');
