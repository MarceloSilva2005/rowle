import { mascotSvg, type MascotPose } from '@rowle/design';
import { SvgXml } from 'react-native-svg';

const LABELS: Record<MascotPose, string> = {
  acenando: 'Toupeira do Rowlê acenando',
  carregando: 'Três toupeiras saindo da toca',
  procurando: 'Toupeira procurando com uma lupa',
  erro: 'Toupeira com olhar de erro',
  dormindo: 'Toupeira dormindo',
};

export function Mascote({ pose, size = 160 }: { pose: MascotPose; size?: number }) {
  return <SvgXml xml={mascotSvg[pose]} width={size} height={size} accessibilityLabel={LABELS[pose]} />;
}
