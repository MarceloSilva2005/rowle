// A toupeira do Rowlê ("Veludo"): de frente, saindo da toca, em formas geométricas
// cheias. Pelo cinza aveludado (toupeiras reais são escuras), contorno de luz
// verde-lima igual à sombra do logo, focinho rosado curto, mãos de pá com cinco
// garras e os óculos esportivos na testa. Base estável; a expressão vem dos olhos,
// da boca e das mãos. Quadro de 260 × 260, chão em y = 214.
//
// Tamanho mínimo: poses inteiras a partir de 96 dp; abaixo de 64 dp, usar a
// cabeça sem bigodes (headArt). O carregando é feito para 160 dp.
import { bungeeGlyph } from './logo.mjs';

// Tokens da interface (packages/design/src/tokens.ts).
const UI = { bg: '#0B0D0C', surface: '#171A18', border: '#303630', muted: '#A9B1A8', lime: '#C6FF36' };
// Cores da toupeira (as principais também estão em tokens.ts, mascotColors).
const P = {
  fur: '#78817B', // contraste 4,85:1 com o fundo (#0B0D0C)
  furLight: '#A3ADA6',
  furEdge: '#5F6762', // contorno do braço sobre o corpo
  pink: '#FF9DB0',
  pinkDeep: '#E5677F',
  claw: '#F3F5F0',
  ink: '#0B0D0C',
  paper: '#F3F5F0',
  hole: '#000000',
};

// Medidas fixas, iguais em todas as poses.
const CX = 130;
const GROUND = 214;
const EYE_Y = 102;
const EYES_X = [112, 148];
const STROKE = 5; // traço de olhos e boca
const RIM = 7; // profundidade da sombra lima
const BODY = 'M60 214 C56 152 82 132 86 94 C90 58 106 42 130 42 C154 42 170 58 174 94 C178 132 204 152 200 214 Z';
const SHOULDER = { left: [92, 150], right: [168, 150] };
const SHADES = 'M0 22 C30 0 112 0 140 20 L134 44 C110 54 88 48 70 38 C52 50 28 54 6 44 Z';

const n = (v) => Number(v.toFixed(2));
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260">${body}</svg>`;
const g = (inner, t = '', extra = '') => `<g${t ? ` transform="${t}"` : ''}${extra}>${inner}</g>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="${fill}"${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${rx}" ry="${ry}" fill="${fill}"${extra}/>`;
const glyph = (ch, x, y, size, fill, extra = '') => path(bungeeGlyph(ch, x, y, size).d, fill, extra);

let uid = 0;
const id = (p) => `${p}-${++uid}`;

function extrude(inner, depth, color) {
  const solid = inner.replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`).replace(/stroke="[^"]*"/g, `stroke="${color}"`);
  return Array.from({ length: depth }, (_, i) => g(solid, `translate(${depth - i} ${depth - i})`)).join('');
}

function aboveGround(inner) {
  const c = id('chao');
  return `<clipPath id="${c}"><rect x="-60" y="-200" width="380" height="${GROUND + 200}"/></clipPath>${g(inner, '', ` clip-path="url(#${c})"`)}`;
}

function hole() {
  return ellipse(CX, 216, 104, 12, P.hole) + `<rect x="18" y="213" width="224" height="8" rx="4" fill="${UI.border}"/>`;
}

/** Mão de pá: palma larga; cinco garras curtas, levemente curvas e de ponta arredondada. */
function spade() {
  const claw = 'M-4.6 1 V-6 C-4.6 -11 -2.4 -14.6 0.8 -15.4 C3.6 -15 4.6 -11.6 4.6 -7.5 V1 Z';
  const claws = [-17, -8.5, 0, 8.5, 17]
    .map((x, i) => path(claw, P.claw, ` transform="translate(${x} ${-13 + Math.abs(i - 2) * 2.5}) rotate(${(i - 2) * 9})"`))
    .join('');
  const palm = path('M-24 -5 C-24 -15 -15 -18 0 -18 C15 -18 24 -15 24 -5 L22 8 C20 17 11 20 0 20 C-11 20 -20 17 -22 8 Z', P.pink);
  return claws + palm;
}

const hand = ({ at: [x, y], angle, scale = 1 }) => {
  const [sx, sy] = Array.isArray(scale) ? scale : [scale, scale];
  return g(spade(), `translate(${x} ${y}) rotate(${angle}) scale(${sx} ${sy})`);
};

/** Braço curvo (ombro → cotovelo → pulso), com contorno discreto para se separar do corpo. */
function curvedArm(d) {
  return line(d, P.furEdge, 30) + line(d, P.fur, 24);
}

// Mãos por pose. "apoio": na borda da toca, garras por cima do chão.
const HANDS = {
  apoio: { left: { at: [88, 204], angle: 172 }, right: { at: [172, 204], angle: 188 } },
  // Dormindo: mãos deitadas e sobrepostas, como um travesseiro sob o queixo.
  descanso: { left: { at: [109, 204], angle: 166, scale: 0.9 }, right: { at: [153, 205], angle: 196, scale: 0.9 } },
};

const EYES = {
  aberto: () => EYES_X.map((x) => circle(x, EYE_Y, 7, P.ink) + circle(x + 2.5, EYE_Y - 2.5, 2.5, P.paper)).join(''),
  feliz: () => EYES_X.map((x) => line(`M${x - 8} ${EYE_Y + 3} Q${x} ${EYE_Y - 8} ${x + 8} ${EYE_Y + 3}`, P.ink, STROKE)).join(''),
  fechado: () => EYES_X.map((x) => line(`M${x - 8} ${EYE_Y - 1} Q${x} ${EYE_Y + 6} ${x + 8} ${EYE_Y - 1}`, P.ink, STROKE)).join(''),
  // Olhando ao longe: olhos semicerrados (pálpebra reta em cima), mirando para a direita.
  ao_longe: () => EYES_X.map((x) => path(`M${x - 7} ${EYE_Y - 1} H${x + 7} A7 6 0 0 1 ${x - 7} ${EYE_Y - 1} Z`, P.ink) + circle(x + 4.5, EYE_Y + 0.5, 2, P.paper)).join(''),
  // Confuso: um olho arregalado e o outro apertado (sem cara de "derrota").
  // Confuso: olhos de tamanhos diferentes (um arregalado, outro pequeno), sem piscadela.
  confuso: () => circle(112, EYE_Y - 1, 9, P.ink) + circle(115, EYE_Y - 4, 3, P.paper) + circle(148, EYE_Y + 1, 4.5, P.ink),
};

const MOUTHS = {
  sorriso: line('M120 158 Q130 166 140 158', P.ink, STROKE),
  aberta: path('M119 154 Q130 172 141 154 Z', P.ink),
  o: ellipse(130, 160, 5, 6, P.ink),
  torta: line('M118 160 Q124 154 130 160 Q136 166 142 158', P.ink, STROKE),
  calma: line('M124 160 Q130 163 136 160', P.ink, STROKE - 1),
};

function snout({ tilt = 0, whiskers = true } = {}) {
  const w = whiskers ? line('M118 128 L96 122 M118 136 L98 140 M142 128 L164 122 M142 136 L162 140', P.furLight, 3.5) : '';
  const s = path('M117 110 Q130 103 143 110 L138 136 Q130 144 122 136 Z', P.pink) + ellipse(130, 138, 8.5, 7, P.pinkDeep) +
    circle(127, 141, 1.8, P.ink) + circle(133, 141, 1.8, P.ink);
  return g(w + s, tilt ? `rotate(${tilt} 130 120)` : '');
}

function glasses({ glint = true, tilt = 0 } = {}) {
  const shine = glint ? line('M20 20 L46 14 M94 14 L120 20', UI.lime, 8) : '';
  return g(path(SHADES, P.ink) + shine, `rotate(${tilt} 130 66) translate(86 50) scale(0.63)`);
}

function body() {
  const c = id('corpo');
  return aboveGround(extrude(path(BODY, P.hole), RIM, UI.lime)) + path(BODY, P.fur) +
    `<clipPath id="${c}"><path d="${BODY}"/></clipPath>` + ellipse(CX, 200, 46, 50, P.furLight, ` clip-path="url(#${c})" opacity="0.45"`);
}

/**
 * Toupeira completa. `hands`: chave de HANDS; `arm`: braço direito livre
 * (aceno ou coçando a cabeça) no lugar da mão direita apoiada.
 */
function mole({ eyes = 'aberto', mouth = 'sorriso', hands = 'apoio', arm = null, glassesOpt = {}, snoutTilt = 0, faceTilt = 0, whiskers = true }) {
  const h = HANDS[hands];
  const face = glasses(glassesOpt) + EYES[eyes]() + snout({ tilt: snoutTilt, whiskers }) + MOUTHS[mouth];
  const handsArt = hand(h.left) + (arm ? curvedArm(arm.d) + hand(arm.hand) : hand(h.right));
  return body() + g(face, faceTilt ? `rotate(${faceTilt} 130 120)` : '') + handsArt;
}

/** Só a cabeça e o corpo, sem mãos nem bigodes: para o carregando, em tamanho pequeno. */
function head() {
  return body() + glasses() + EYES.aberto() + snout({ whiskers: false }) + MOUTHS.sorriso;
}

const WAVE = line('M240 56 Q252 70 248 88 M250 42 Q268 62 262 94', UI.lime, 5);

export const poses = {
  acenando: () =>
    svg(hole() + mole({
      eyes: 'feliz',
      mouth: 'aberta',
      arm: { d: 'M160 158 Q204 150 206 110', hand: { at: [210, 92], angle: 14 } },
    }) + WAVE),
  // Toupeira acha as coisas pelo faro: focinho erguido, cheirando o ar.
  // Procurando: olhando ao longe com a mão em cima dos olhos, como aba de boné.
  procurando: () =>
    svg(hole() + mole({
      eyes: 'ao_longe',
      mouth: 'o',
      faceTilt: 8,
      // Mão achatada (vista de baixo), como aba sobre os olhos; garras para a esquerda.
      arm: { d: 'M166 150 L212 124 L184 94', hand: { at: [150, 88], angle: -90, scale: [0.5, 0.86] } },
    })),
  // Erro: confusa. Cabeça inclinada, um olho arregalado e o outro apertado,
  // boca torta, óculos tortos e um "?". As duas mãos ficam na toca (sem aceno).
  erro: () =>
    svg(hole() + mole({ eyes: 'confuso', mouth: 'torta', faceTilt: -7, glassesOpt: { glint: false, tilt: -10 } }) +
      glyph('?', 196, 84, 48, UI.lime)),
  dormindo: () =>
    svg(hole() + mole({ eyes: 'fechado', mouth: 'calma', hands: 'descanso', glassesOpt: { glint: false }, faceTilt: 5 }) +
      glyph('Z', 188, 76, 32, UI.lime) + glyph('Z', 216, 46, 22, UI.lime, ' opacity="0.6"')),
  // Quadro estático do carregando (o app anima as três cabeças).
  carregando: () => {
    const S = 0.5;
    const xs = [44, 130, 216];
    const sinks = [0, 26, 56];
    const heads = xs.map((x, i) => {
      const c = id('toca');
      const inner = `<clipPath id="${c}"><rect x="-60" y="-200" width="380" height="414"/></clipPath>` + g(g(head(), `translate(0 ${sinks[i]})`), '', ` clip-path="url(#${c})"`);
      return g(inner, `translate(${n(x - 130 * S)} ${n(200 - 214 * S)}) scale(${S})`);
    });
    const holes = xs.map((x) => ellipse(x, 201, 36, 5, P.hole) + `<rect x="${x - 38}" y="198" width="76" height="6" rx="3" fill="${UI.border}"/>`);
    return svg(heads.join('') + holes.join(''));
  },
};

/** Cabeça isolada (sem mãos nem bigodes), para a animação do carregando no app. */
export const headArt = () => svg(head());
