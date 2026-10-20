import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../theme';

// Ícones "Bloco" (24 × 24): glifos cheios e grossos, da família do letreiro.
// `c` é a cor do glifo; `hole` é a cor do fundo, usada nos recortes (lentes, folha da
// agenda, picote do ingresso). Ligado: tinta sobre lima, com a sombra 3D do logo.
type Draw = (c: string, hole: string, filled: boolean) => ReactNode;

const St = ({ d, c, w = 3 }: { d: string; c: string; w?: number }) => (
  <Path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const Fl = ({ d, c }: { d: string; c: string }) => <Path d={d} fill={c} />;

// Óculos do logo (SHADES, 140 de largura) reduzidos a 23 × 8,5, com os riscos de brilho e o nariz.
const SHADES = 'M0 22 C30 0 112 0 140 20 L134 44 C110 54 88 48 70 38 C52 50 28 54 6 44 Z';
const TICKET = 'M2.5 6h19v4.2a1.8 1.8 0 0 0 0 3.6V18h-19v-4.2a1.8 1.8 0 0 0 0-3.6Z';

const SHAPES = {
  roles: (c, hole) => (
    <G transform="translate(0.5 7.3) scale(0.164)">
      <Fl d={SHADES} c={c} />
      <St d="M22 21 L46 15 M94 15 L118 21" c={hole} w={9} />
      <Ellipse cx={70} cy={49} rx={14} ry={10} fill={c} />
    </G>
  ),
  agenda: (c, hole) => (
    <>
      <Fl d="M4 6.5A2 2 0 0 1 6 4.5h12a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" c={c} />
      <Fl d="M6.5 10h11v8.5h-11Z" c={hole} />
      <Fl d="M13.5 14h3v3h-3Z" c={c} />
      <St d="M8.5 2.5v4M15.5 2.5v4" c={c} w={2.6} />
    </>
  ),
  explorar: (c) => <St d="M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM15.6 15.6l5 5" c={c} w={3.2} />,
  voce: (c) => <Fl d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM3.5 21c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7Z" c={c} />,
  salvar: (c, _hole, filled) =>
    filled ? <Fl d="M6 2.5h12a1 1 0 0 1 1 1V21l-7-4.4L5 21V3.5a1 1 0 0 1 1-1Z" c={c} /> : <St d="M6.5 3.5h11V19.5l-5.5-3.6-5.5 3.6Z" c={c} w={2.6} />,
  enviar: (c) => (
    <>
      <Fl d="M21.5 2.5 2.5 10.3l7.5 3Z" c={c} />
      <Fl d="M21.5 2.5 13.8 21.5l-3-7.3Z" c={c} />
    </>
  ),
  rota: (c) => (
    <>
      <St d="M5 20.5v-5.5a6 6 0 0 1 6-6h6" c={c} />
      <Fl d="M15 3.5 21.5 9 15 14.5Z" c={c} />
    </>
  ),
  ingresso: (c, hole) => (
    <>
      <Fl d={TICKET} c={c} />
      {[8.5, 11.5, 14.5].map((y) => (
        <Circle key={y} cx={15} cy={y} r={1} fill={hole} />
      ))}
    </>
  ),
  pin: (c, hole) => (
    <>
      <Fl d="M12 22s-7.5-6.6-7.5-12.5a7.5 7.5 0 0 1 15 0C19.5 15.4 12 22 12 22Z" c={c} />
      <Circle cx={12} cy={9.5} r={2.8} fill={hole} />
    </>
  ),
  filtro: (c) => <St d="M4 6.5h16M7 12h10M10 17.5h4" c={c} />,
  voltar: (c) => <St d="M15 5l-7 7 7 7" c={c} />,
  seta: (c) => <St d="M9 5l7 7-7 7" c={c} />,
  check: (c) => <St d="m5 12 4.5 4.5L19 7" c={c} />,
  fechar: (c) => <St d="M6 6l12 12M18 6 6 18" c={c} />,
  acessivel: (c) => (
    <>
      <Circle cx={12} cy={4.3} r={2.3} fill={c} />
      <St d="M5 8.8c2.5.7 4.7 1 7 1s4.5-.3 7-1M12 9.8v4.4m0 0-3 6.3m3-6.3 3 6.3" c={c} w={2.6} />
    </>
  ),
  aviso: (c, hole) => (
    <>
      <Path d="M12 3.5 2.5 20h19Z" fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />
      <St d="M12 10v4.2M12 17.2v.1" c={hole} w={2.6} />
    </>
  ),
} satisfies Record<string, Draw>;

export type IconName = keyof typeof SHAPES;

/**
 * `hole` é a cor do que fica atrás do ícone (padrão: o fundo do app, ou lima no ligado).
 * `on` (ligado) desenha a sombra 3D do letreiro em papel, deslocada para baixo e à direita.
 */
export function Icon({
  name,
  size = 24,
  color = colors.text,
  filled = false,
  on = false,
  hole = on ? colors.brand : colors.bg,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
  on?: boolean;
  hole?: string;
}) {
  const draw: Draw = SHAPES[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
      {on ? <G transform="translate(1.4 1.4)">{draw(colors.text, colors.text, filled)}</G> : null}
      {draw(color, hole, filled)}
    </Svg>
  );
}
