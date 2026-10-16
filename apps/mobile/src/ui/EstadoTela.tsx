import type { MascotPose } from '@rowle/design';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, minTouchTarget, radius, space } from '../theme';
import { Mascote } from './Mascote';

interface Props {
  pose: MascotPose;
  title: string;
  text?: string;
  action?: { label: string; onPress: () => void };
}

/** Tela inteira de carregando, vazio, erro ou sem rede. */
export function EstadoTela({ pose, title, text, action }: Props) {
  return (
    <View style={styles.container}>
      <Mascote pose={pose} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bodyBold,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  text: {
    color: colors.textMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: space.sm,
    minHeight: minTouchTarget,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  buttonText: {
    color: colors.onBrand,
    fontFamily: fontFamily.bodyBold,
    fontSize: 16,
  },
});
