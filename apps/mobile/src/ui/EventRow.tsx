import { categoryColors } from '@rowle/design';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, space } from '../theme';
import { coverUri } from '../supabase';
import { Cover } from './Cover';

interface Props {
  title: string;
  categoryName: string;
  categorySlug: string;
  seed: string;
  coverPath?: string | null;
  place: string;
  price: string;
  soldOut?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Linha de evento (Agenda e salvos): miniatura da capa, categoria, título, local e preço. */
export function EventRow({ title, categoryName, categorySlug, seed, coverPath, place, price, soldOut, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <Cover category={categorySlug} seed={seed} uri={coverUri(coverPath)} width={72} height={88} style={styles.thumb} />
      <View style={styles.body}>
        <Text style={[styles.cat, { color: categoryColors[categorySlug] ?? colors.textMuted }]} numberOfLines={1}>
          {categoryName}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.place} numberOfLines={1}>
          {place}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{price}</Text>
          {soldOut ? <Text style={styles.soldOut}>Esgotado</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 10 },
  thumb: { borderRadius: radius.md },
  body: { flex: 1, minWidth: 0 },
  cat: { fontFamily: fontFamily.bodyBold, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 21, marginTop: 2 },
  place: { color: colors.textMuted, fontFamily: fontFamily.body, fontSize: 13, marginTop: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 5 },
  price: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 13 },
  soldOut: { color: colors.onWarning, backgroundColor: colors.warning, fontFamily: fontFamily.bodyBold, fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
});
