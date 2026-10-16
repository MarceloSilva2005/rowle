import { NO_FILTERS, applyFilters, onePerEvent, weekStrip, type DiscoveryFilters } from '@rowle/core';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Catalog } from '../data/catalog';
import { colors, fontFamily, minTouchTarget, radius, space } from '../theme';
import { Chip } from './Chip';
import { WeekStrip } from './WeekStrip';

interface Props {
  visible: boolean;
  catalog: Catalog;
  value: DiscoveryFilters;
  onApply: (f: DiscoveryFilters) => void;
  onClose: () => void;
  /** Na Agenda o dia é escolhido na própria tela. */
  showDay?: boolean;
}

/** Folha de filtros (dia, categoria, região, só grátis) com a contagem ao vivo. */
export function FilterSheet({ visible, catalog, value, onApply, onClose, showDay = true }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [openedWith, setOpenedWith] = useState(value);
  // Reabre com os filtros atuais (sem efeito: compara com o último valor recebido).
  if (value !== openedWith) {
    setOpenedWith(value);
    setDraft(value);
  }

  const week = useMemo(() => weekStrip(catalog.sessions, catalog.loadedAt), [catalog]);
  const count = useMemo(() => onePerEvent(applyFilters(catalog.sessions, draft, catalog.loadedAt)).length, [catalog, draft]);
  // Só regiões que têm rolê, as com mais rolês primeiro.
  const regions = useMemo(() => {
    const n = new Map<number, number>();
    for (const s of catalog.sessions) n.set(s.regionId, (n.get(s.regionId) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [catalog]);
  const categories = useMemo(() => [...new Set(catalog.sessions.map((s) => s.categoryId))], [catalog]);

  const toggle = (key: 'categories' | 'regions', id: number) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(id) ? d[key].filter((x) => x !== id) : [...d[key], id] }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Fechar filtros" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            Filtrar rolês
          </Text>
          <Pressable onPress={() => setDraft({ ...NO_FILTERS, day: showDay ? null : draft.day })} hitSlop={12} accessibilityRole="button">
            <Text style={styles.clear}>Limpar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: space.lg }} showsVerticalScrollIndicator={false}>
          {showDay ? (
            <>
              <Text style={styles.label}>Dia</Text>
              <WeekStrip days={week} selected={draft.day} onSelect={(day) => setDraft((d) => ({ ...d, day: d.day === day ? null : day }))} />
            </>
          ) : null}
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.wrap}>
            {categories.map((id) => (
              <Chip key={id} label={catalog.categories.get(id) ?? ''} on={draft.categories.includes(id)} onPress={() => toggle('categories', id)} />
            ))}
          </View>
          <Text style={styles.label}>Região</Text>
          <View style={styles.wrap}>
            {regions.map((id) => (
              <Chip key={id} label={catalog.regions.get(id) ?? ''} on={draft.regions.includes(id)} onPress={() => toggle('regions', id)} />
            ))}
          </View>
          <Text style={styles.label}>Preço</Text>
          <View style={styles.toggle}>
            <Text style={styles.toggleText}>Só grátis</Text>
            <Switch
              value={draft.freeOnly}
              onValueChange={(freeOnly) => setDraft((d) => ({ ...d, freeOnly }))}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={draft.freeOnly ? colors.bg : colors.textMuted}
              accessibilityLabel="Só grátis"
            />
          </View>
        </ScrollView>
        <Pressable
          onPress={() => onApply(draft)}
          disabled={count === 0}
          accessibilityRole="button"
          style={({ pressed }) => [styles.apply, count === 0 && styles.applyOff, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.applyText, count === 0 && styles.applyTextOff]}>
            {count === 0 ? 'Nenhum rolê com esses filtros' : count === 1 ? 'Ver 1 rolê' : `Ver ${count} rolês`}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '86%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: space.xl - 4, paddingTop: space.md },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: space.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 22 },
  clear: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 15 },
  label: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: space.xl - 4, marginBottom: space.sm + 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: minTouchTarget },
  toggleText: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  apply: { height: 54, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  applyOff: { backgroundColor: colors.surfaceRaised },
  applyText: { color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  applyTextOff: { color: colors.textMuted },
});
