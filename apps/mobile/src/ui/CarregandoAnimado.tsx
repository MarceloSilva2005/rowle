import { mascotHeadSvg } from '@rowle/design';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, fontFamily } from '../theme';

const HEAD_W = 100;
const HEAD_H = Math.round((HEAD_W * 200) / 272); // quadro da cabeça: 272 × 200
const WINDOW = 116; // até onde a cabeça aparece; abaixo disso, fica atrás da fita
const HIDDEN = HEAD_H + 12;
// Uma toupeira por vez, com um relógio só para as três: cada uma ocupa uma faixa fixa
// do ciclo (sobe, espia, volta) e a próxima só começa depois. Relógios separados
// escorregam e acabam sobrepondo as toupeiras.
const UP = 260;
const HOLD = 240;
const DOWN = 220;
const SLOT = UP + HOLD + DOWN;
const PAUSE = 200; // depois da terceira, antes de recomeçar
const CYCLE = 3 * SLOT + PAUSE;

/** Posição de cada toupeira (0 = à vista, 1 = atrás da fita) ao longo do ciclo (0..1). */
function track(i: number) {
  const s = i * SLOT;
  const at = (ms: number) => ms / CYCLE;
  return {
    inputRange: [0, at(s), at(s + UP * 0.75), at(s + UP), at(s + UP + HOLD), at(s + SLOT), 1],
    outputRange: [1, 1, -0.06, 0, 0, 1, 1], // leve passada para cima ao sair
  };
}
// Parado (menos movimento): a do meio à vista, as dos lados espiando.
const STILL = [0.45, 0, 0.45];

/**
 * Carregando: três toupeiras saindo de trás da fita lima, uma por vez. O texto vai na
 * própria fita. Com "remover animações" ligado, fica parado.
 */
export function CarregandoAnimado({ texto }: { texto: string }) {
  const [reduce, setReduce] = useState<boolean | null>(null);
  const [clock] = useState(() => new Animated.Value(0));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduce !== false) return;
    const loop = Animated.loop(Animated.timing(clock, { toValue: 1, duration: CYCLE, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduce, clock]);

  return (
    <View style={styles.stage} accessible accessibilityRole="progressbar" accessibilityLabel={texto}>
      <View style={styles.window}>
        {[0, 1, 2].map((i) => {
          const { inputRange, outputRange } = track(i);
          const translateY =
            reduce === false
              ? clock.interpolate({ inputRange, outputRange: outputRange.map((o) => o * HIDDEN) })
              : STILL[i]! * HIDDEN;
          return (
            <Animated.View key={i} style={[styles.head, { transform: [{ translateY }] }]} renderToHardwareTextureAndroid>
              <SvgXml xml={mascotHeadSvg} width={HEAD_W} height={HEAD_H} />
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.fita}>
        <Text style={styles.fitaText} numberOfLines={1} adjustsFontSizeToFit importantForAccessibility="no">
          {texto.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 330, height: WINDOW + 46 },
  window: { position: 'absolute', left: 8, right: 8, top: 0, height: WINDOW, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', overflow: 'hidden' },
  head: { width: HEAD_W },
  fita: { position: 'absolute', left: -8, right: -8, top: WINDOW - 14, height: 52, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, transform: [{ rotate: '-3deg' }] },
  fitaText: { color: colors.onBrand, fontFamily: fontFamily.brand, fontSize: 22, letterSpacing: 0.5 },
});
