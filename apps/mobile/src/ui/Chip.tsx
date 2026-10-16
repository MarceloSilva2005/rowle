import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, minTouchTarget, radius } from '../theme';

/** Opção de filtro que liga e desliga. */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      hitSlop={{ top: (minTouchTarget - 38) / 2, bottom: (minTouchTarget - 38) / 2 }}
      style={[styles.chip, on && styles.on]}
    >
      <Text style={[styles.text, on && styles.textOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 38, paddingHorizontal: 12, justifyContent: 'center', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  on: { borderColor: colors.brand, backgroundColor: 'rgba(198,255,54,0.1)' },
  text: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 14 },
  textOn: { color: colors.text },
});
