import { mascotHeadSvg } from '@rowle/design';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors } from '../theme';

const HEAD = 76; // lado do SVG da cabeça (viewBox 260)
const VISIBLE = Math.round((HEAD * 214) / 260); // do topo até a borda da toca
const COL = 58;
// Uma toupeira por vez, com um relógio só para as três: cada uma ocupa uma faixa
// fixa do ciclo e a próxima só começa depois de um intervalo (GAP). Relógios
// separados escorregam e acabam sobrepondo as toupeiras.
const UP = 260;
const HOLD = 240;
const DOWN = 220;
const GAP = 120;
const SLOT = UP + HOLD + DOWN;
const PAUSE = 200; // depois da terceira, antes de recomeçar
const CYCLE = 3 * (SLOT + GAP) + PAUSE;

/** Posição de cada toupeira (0 = à vista, 1 = na toca) ao longo do ciclo (0..1). */
function track(i: number) {
  const s = i * (SLOT + GAP);
  const at = (ms: number) => ms / CYCLE;
  return {
    inputRange: [0, at(s), at(s + UP * 0.75), at(s + UP), at(s + UP + HOLD), at(s + SLOT), 1],
    outputRange: [1, 1, -0.06, 0, 0, 1, 1], // leve passada para cima ao sair da toca
  };
}
// Parado (menos movimento): alturas diferentes, como três pontinhos.
const STILL = [0, 0.3, 0.65];

/** Três toupeiras saindo da toca em sequência. Com "remover animações" ligado, fica parado. */
export function CarregandoAnimado() {
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
    <View style={styles.row} accessible accessibilityLabel="Carregando">
      {[0, 1, 2].map((i) => {
        const { inputRange, outputRange } = track(i);
        const translateY =
          reduce === false
            ? clock.interpolate({ inputRange, outputRange: outputRange.map((o) => o * VISIBLE) })
            : STILL[i]! * VISIBLE;
        return (
          <View key={i} style={styles.col}>
            <View style={styles.window}>
              <Animated.View style={{ transform: [{ translateY }] }} renderToHardwareTextureAndroid>
                <SvgXml xml={mascotHeadSvg} width={HEAD} height={HEAD} />
              </Animated.View>
            </View>
            <View style={styles.hole} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', height: VISIBLE + 8 },
  col: { width: COL, alignItems: 'center' },
  window: { width: HEAD, height: VISIBLE, overflow: 'hidden', alignItems: 'center' },
  hole: { width: COL - 6, height: 5, borderRadius: 3, backgroundColor: colors.border },
});
