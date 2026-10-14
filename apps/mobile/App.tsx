import { logoSvg, mascotSvg } from '@rowle/design';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, fontFamily, space } from './src/theme';

// Proporção do viewBox do logo (748.8 × 238).
const LOGO_RATIO = 238 / 748.8;
const LOGO_WIDTH = 240;

export default function App() {
  return (
    <View style={styles.container}>
      <SvgXml xml={logoSvg} width={LOGO_WIDTH} height={LOGO_WIDTH * LOGO_RATIO} accessibilityLabel="Rowlê" />
      <SvgXml xml={mascotSvg.acenando} width={180} height={180} accessibilityLabel="Toupeira do Rowlê acenando" />
      <Text style={styles.title}>Descubra rolês no DF.</Text>
      <Text style={styles.subtitle}>Em desenvolvimento.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: space.xl,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bodyBold,
    fontSize: 20,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
});
