import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Ícones de traço (24 × 24, traço 2), desenhados para o Rowlê.
const SHAPES = {
  roles: <><Circle cx={12} cy={12} r={9} /><Path d="M15.5 8.5 13.6 13.6 8.5 15.5 10.4 10.4Z" /></>,
  agenda: <><Rect x={3.5} y={5} width={17} height={15} rx={2} /><Path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  explorar: <><Circle cx={11} cy={11} r={7} /><Path d="m20 20-3.5-3.5" /></>,
  voce: <><Circle cx={12} cy={8} r={4} /><Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  salvar: <Path d="M6 4h12v16l-6-4-6 4Z" />,
  enviar: <><Circle cx={18} cy={5} r={2.5} /><Circle cx={6} cy={12} r={2.5} /><Circle cx={18} cy={19} r={2.5} /><Path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></>,
  rota: <Path d="M5 19 19 5M19 5h-8M19 5v8" />,
  ingresso: <><Path d="M3 8a2 2 0 0 0 0 4 2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3Z" /><Path d="M14 6v12" strokeDasharray="2 2" /></>,
  pin: <><Path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" /><Circle cx={12} cy={9} r={2.5} /></>,
  relogio: <><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /></>,
  filtro: <Path d="M4 6h16M7 12h10M10 18h4" />,
  voltar: <Path d="M15 5l-7 7 7 7" />,
  seta: <Path d="M9 5l7 7-7 7" />,
  check: <Path d="m5 12 4.5 4.5L19 7" />,
  fechar: <Path d="M6 6l12 12M18 6 6 18" />,
  acessivel: <><Circle cx={12} cy={4.5} r={1.8} /><Path d="M5 8.5c2.5.7 4.7 1 7 1s4.5-.3 7-1M12 9.5V14m0 0-3 6.5M12 14l3 6.5" /></>,
  aviso: <><Path d="M12 3 2 20h20Z" /><Path d="M12 10v4M12 17v.5" /></>,
} as const;

export type IconName = keyof typeof SHAPES;

export function Icon({ name, size = 24, color = colors.text, filled = false }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {SHAPES[name]}
    </Svg>
  );
}
