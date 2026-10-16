import { CLASSIND_COLORS, classIndDescription, classIndLabel, type AgeRating } from '@rowle/core';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../theme';

/**
 * Símbolo da classificação indicativa (Guia ClassInd, anexo H): quadrado com cantos
 * arredondados, número branco, cor oficial e borda branca. Nunca girar, espelhar
 * nem deixar transparente. Autoclassificação mostra o provisório ("A18").
 */
export function ClassInd({ rating, official, size = 30 }: { rating: AgeRating; official: boolean; size?: number }) {
  const label = classIndLabel(rating, official);
  const fontSize = Math.round(size * (label.length > 2 ? 0.46 : label.length > 1 ? 0.58 : 0.68));
  const description = classIndDescription(rating);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Classificação indicativa: ${description}${official ? '' : ', autoclassificação'}`}
      style={[
        styles.box,
        { width: size, height: size, borderRadius: Math.round(size * 0.14), borderWidth: Math.max(2, Math.round(size * 0.07)), backgroundColor: CLASSIND_COLORS[rating] },
      ]}
    >
      <Text allowFontScaling={false} style={[styles.text, { fontSize, lineHeight: Math.round(fontSize * 1.1) }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontFamily: fontFamily.classind, includeFontPadding: false },
});
