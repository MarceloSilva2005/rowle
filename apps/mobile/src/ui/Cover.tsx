import { coverSvg } from '@rowle/design';
import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from 'react-native-svg';

interface Props {
  category: string;
  seed: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}

/** Capa gerada do evento (cartaz por categoria). Decorativa: o texto vem por cima. */
export const Cover = memo(function Cover({ category, seed, width, height, style }: Props) {
  const xml = useMemo(() => coverSvg({ category, seed, width: Math.round(width), height: Math.round(height) }), [category, seed, width, height]);
  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  );
});

/** Degradê para escurecer a capa onde há texto (stops: [posição 0..1, opacidade]). */
export function Shade({ stops, color = '#0B0D0C' }: { stops: [number, number][]; color?: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          {stops.map(([offset, opacity]) => (
            <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#shade)" />
    </Svg>
  );
}
