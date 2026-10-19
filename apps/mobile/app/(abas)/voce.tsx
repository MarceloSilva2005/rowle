import { formatCardDate, sessionIsOver } from '@rowle/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatalog } from '../../src/data/catalog';
import { useSaved } from '../../src/data/saved';
import { colors, fontFamily, radius, space } from '../../src/theme';
import { EventRow } from '../../src/ui/EventRow';
import { Icon } from '../../src/ui/Icon';
import { Mascote } from '../../src/ui/Mascote';

/** Você: salvos neste aparelho (sem conta) e a região preferida. */
export default function Voce() {
  const insets = useSafeAreaInsets();
  const { saved, preferredRegion, setPreferredRegion } = useSaved();
  const { state } = useCatalog();
  const catalog = state.status === 'ready' ? state.catalog : null;
  const [tab, setTab] = useState<'proximos' | 'passados'>('proximos');
  const [regionPicker, setRegionPicker] = useState(false);
  const now = useMemo(() => new Date(), []);

  const list = useMemo(() => {
    const upcoming = saved.filter((e) => !sessionIsOver(e.startsAt, e.endsAt, e.timeConfirmed, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = saved.filter((e) => sessionIsOver(e.startsAt, e.endsAt, e.timeConfirmed, now)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return tab === 'proximos' ? upcoming : past;
  }, [saved, tab, now]);

  const regionName = preferredRegion != null ? catalog?.regions.get(preferredRegion) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm }]}>
      <FlatList
        data={list}
        keyExtractor={(e) => e.slug}
        contentContainerStyle={{ paddingHorizontal: space.xl - 4, paddingBottom: space.xxxl, gap: space.md }}
        ListHeaderComponent={
          <View>
            <View style={styles.head}>
              <Mascote pose="acenando" size={72} />
              <Text style={styles.h1} accessibilityRole="header">
                Você
              </Text>
            </View>
            <View style={styles.seg}>
              {(['proximos', 'passados'] as const).map((t) => (
                <Pressable key={t} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} style={[styles.segBtn, tab === t && styles.segOn]}>
                  <Text style={[styles.segText, tab === t && styles.segTextOn]}>{t === 'proximos' ? 'Próximos' : 'Já foram'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{tab === 'proximos' ? 'Nada salvo ainda' : 'Nenhum rolê passado'}</Text>
            {tab === 'proximos' ? (
              <Pressable onPress={() => router.navigate('/')} style={styles.emptyBtn} accessibilityRole="button">
                <Text style={styles.emptyBtnText}>Ver rolês</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item: e }) => (
          <View style={styles.saved}>
            <View style={styles.when}>
              <Text style={styles.whenDay}>{formatCardDate(e.startsAt, e.timeConfirmed, now).split(' · ')[0]?.replace(/,.*/, '')}</Text>
              <Text style={styles.whenTime}>{formatCardDate(e.startsAt, e.timeConfirmed, now).split(' · ')[1] ?? ''}</Text>
            </View>
            <EventRow
              title={e.title}
              categoryName={catalog?.categories.get(e.categoryId) ?? ''}
              categorySlug={catalog?.categorySlugs.get(e.categoryId) ?? 'outros'}
              seed={e.slug}
              coverPath={e.coverPath}
              place={catalog?.regions.get(e.regionId) ? `${e.venueName} · ${catalog.regions.get(e.regionId)}` : e.venueName}
              price={e.priceText}
              accessibilityLabel={`${e.title}. ${formatCardDate(e.startsAt, e.timeConfirmed, now)}. ${e.venueName}`}
              onPress={() => router.push({ pathname: '/evento/[slug]', params: { slug: e.slug } })}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.menu}>
            <Pressable style={styles.menuItem} onPress={() => setRegionPicker(true)} accessibilityRole="button">
              <View>
                <Text style={styles.menuText}>Região preferida</Text>
                <Text style={styles.menuSub}>{regionName ?? 'Nenhuma'}</Text>
              </View>
              <Icon name="seta" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        }
      />
      <Modal visible={regionPicker} transparent animationType="slide" onRequestClose={() => setRegionPicker(false)} statusBarTranslucent>
        <Pressable style={styles.dim} onPress={() => setRegionPicker(false)} accessibilityLabel="Fechar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Text style={styles.sheetTitle}>Região preferida</Text>
          <FlatList
            data={[null, ...(catalog ? [...catalog.regions.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).map(([id]) => id) : [])]}
            keyExtractor={(id) => String(id)}
            renderItem={({ item: id }) => (
              <Pressable style={styles.regionRow} onPress={() => { setPreferredRegion(id); setRegionPicker(false); }} accessibilityRole="radio" accessibilityState={{ checked: preferredRegion === id }}>
                <Text style={styles.regionText}>{id == null ? 'Nenhuma' : catalog?.regions.get(id)}</Text>
                {preferredRegion === id ? <Icon name="check" size={18} color={colors.brand} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm },
  h1: { color: colors.text, fontFamily: fontFamily.display, fontSize: 32, textTransform: 'uppercase' },
  seg: { flexDirection: 'row', gap: space.sm, paddingTop: space.lg, paddingBottom: space.xs },
  segBtn: { minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border },
  segOn: { backgroundColor: colors.text, borderColor: colors.text },
  segText: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 14 },
  segTextOn: { color: colors.bg },
  saved: { flexDirection: 'row', gap: space.md },
  when: { width: 58, paddingTop: 8 },
  whenDay: { color: colors.text, fontFamily: fontFamily.display, fontSize: 22, lineHeight: 26 },
  whenTime: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 12 },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  emptyTitle: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  emptyBtn: { height: 46, paddingHorizontal: space.xl, borderRadius: radius.pill, backgroundColor: colors.brand, justifyContent: 'center' },
  emptyBtnText: { color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 15 },
  menu: { marginTop: space.lg, borderTopWidth: 1, borderTopColor: colors.border },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  menuText: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  menuSub: { color: colors.textMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 13, marginTop: 2 },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '75%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: space.xl - 4, paddingTop: space.lg },
  sheetTitle: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 20, marginBottom: space.sm },
  regionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 50, borderBottomWidth: 1, borderBottomColor: colors.border },
  regionText: { color: colors.text, fontFamily: fontFamily.bodySemiBold, fontSize: 16 },
});
