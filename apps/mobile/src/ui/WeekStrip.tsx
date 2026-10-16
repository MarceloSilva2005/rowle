import type { WeekDay } from '@rowle/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius } from '../theme';

/** Os próximos 7 dias; o ponto indica que há rolê no dia. */
export function WeekStrip({ days, selected, onSelect }: { days: WeekDay[]; selected: string | null; onSelect: (day: string) => void }) {
  return (
    <View style={styles.row}>
      {days.map((d) => {
        const on = d.day === selected;
        return (
          <Pressable
            key={d.day}
            onPress={() => onSelect(d.day)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${d.weekday} ${d.dayOfMonth}, ${d.count === 0 ? 'nenhum rolê' : d.count === 1 ? '1 rolê' : `${d.count} rolês`}`}
            style={[styles.day, on && styles.dayOn]}
          >
            <Text style={[styles.weekday, on && styles.textOn]}>{d.weekday}</Text>
            <Text style={[styles.num, on && styles.textOn]}>{d.dayOfMonth}</Text>
            <View style={[styles.dot, d.count === 0 && styles.dotOff, on && styles.dotOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 44, minHeight: 64, paddingVertical: 8, borderRadius: radius.lg, alignItems: 'center' },
  dayOn: { backgroundColor: colors.brand },
  weekday: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 11, letterSpacing: 1 },
  num: { color: colors.text, fontFamily: fontFamily.display, fontSize: 22, lineHeight: 27 },
  textOn: { color: colors.onBrand },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.brand, marginTop: 4 },
  dotOff: { backgroundColor: 'transparent' },
  dotOn: { backgroundColor: colors.onBrand },
});
