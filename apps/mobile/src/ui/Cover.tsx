import { coverSvg } from '@rowle/design';
import { memo, useMemo, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from 'react-native-svg';

interface Props {
  category: string;
  seed: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  /** Foto do evento. Enquanto carrega, ou se falhar, fica a capa gerada. */
  uri?: string | null;
}

/**
 * Capa do evento: a foto, quando há, por cima da capa gerada (cartaz por categoria), que
 * aparece enquanto a foto carrega ou se ela falhar. Decorativa: o texto vem por cima.
 */
export const Cover = memo(function Cover({ category, seed, width, height, style, uri }: Props) {
  const xml = useMemo(() => coverSvg({ category, seed, width: Math.round(width), height: Math.round(height) }), [category, seed, width, height]);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const photo = uri && failed !== uri ? uri : null;
  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]} importantForAccessibility="no-hide-descendants">
      {/* A capa gerada sai quando a foto carrega: as duas desenhadas juntas pesam no deslizar. */}
      {photo && loaded === photo ? null : <SvgXml xml={xml} width={width} height={height} />}
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          // Decodifica no tamanho da tela (a miniatura não precisa da foto inteira).
          resizeMethod="resize"
          fadeDuration={0}
          onLoad={() => setLoaded(photo)}
          onError={() => setFailed(photo)}
        />
      ) : null}
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
