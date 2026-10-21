import { formatLegalDate, LEGAL_CONTACT_EMAIL, type LegalDocument } from '@rowle/core';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, space } from '../theme';
import { Icon } from './Icon';

/** Política ou termos dentro do app: o mesmo texto do site, disponível sem internet. */
export function LegalScreen({ doc }: { doc: LegalDocument }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm }]}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/voce'))}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={styles.back}
      >
        <Icon name="voltar" size={20} />
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl - 4, paddingBottom: insets.bottom + space.xxxl }}>
        <Text style={styles.h1} accessibilityRole="header">
          {doc.title}
        </Text>
        <Text style={styles.updated}>Atualizado em {formatLegalDate(doc.updatedAt)}</Text>
        {doc.sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.h2} accessibilityRole="header">
              {s.heading}
            </Text>
            {s.paragraphs?.map((p) => <Paragraph key={p} text={p} />)}
            {s.items?.map((i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.body}>•</Text>
                <Text style={[styles.body, { flex: 1 }]}>{i}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Paragraph({ text }: { text: string }) {
  const [before, ...rest] = text.split(LEGAL_CONTACT_EMAIL);
  if (!rest.length) return <Text style={styles.body}>{text}</Text>;
  return (
    <Text style={styles.body}>
      {before}
      <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(`mailto:${LEGAL_CONTACT_EMAIL}`)}>
        {LEGAL_CONTACT_EMAIL}
      </Text>
      {rest.join(LEGAL_CONTACT_EMAIL)}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { width: 48, height: 48, marginLeft: space.sm, alignItems: 'center', justifyContent: 'center' },
  h1: { color: colors.text, fontFamily: fontFamily.display, fontSize: 32, textTransform: 'uppercase', marginTop: space.sm },
  updated: { color: colors.textMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 13, marginTop: space.xs },
  section: { marginTop: space.lg, gap: space.sm },
  h2: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 18 },
  body: { color: colors.text, fontFamily: fontFamily.body, fontSize: 15, lineHeight: 23 },
  item: { flexDirection: 'row', gap: space.sm, paddingLeft: space.xs },
  link: { color: colors.brand, textDecorationLine: 'underline' },
});
