import { activeFilterCount, applyFilters, brasiliaDay, formatCardDate, formatPrice, sessionDateParts, startsIn, weekStrip } from '@rowle/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatalog } from '../../src/data/catalog';
import { colors, fontFamily, space } from '../../src/theme';
import { EstadoTela } from '../../src/ui/EstadoTela';
import { EventRow } from '../../src/ui/EventRow';
import { FilterSheet } from '../../src/ui/FilterSheet';
import { Icon } from '../../src/ui/Icon';
import { WeekStrip } from '../../src/ui/WeekStrip';

/** Agenda: a semana no topo e o dia escolhido como linha do tempo. */
export default function Agenda() {
  const { state, refreshing, refresh, retry, filters, setFilters } = useCatalog();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState(false);
  const catalog = state.status === 'ready' ? state.catalog : null;
  const day = filters.day ?? (catalog ? brasiliaDay(catalog.loadedAt) : null);

  const week = useMemo(() => (catalog ? weekStrip(catalog.sessions, catalog.loadedAt) : []), [catalog]);
  const sessions = useMemo(
    () => (catalog ? applyFilters(catalog.sessions, { ...filters, day }, catalog.loadedAt).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : []),
    [catalog, filters, day],
  );

  if (!catalog) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {state.status === 'loading' ? (
          <EstadoTela pose="carregando" title="Procurando rolês…" />
        ) : (
          <EstadoTela pose={state.status === 'offline' ? 'procurando' : 'erro'} title={state.status === 'offline' ? 'Sem internet' : 'Não deu para carregar a agenda'} text="Confira a conexão e tente de novo." action={{ label: 'Tentar de novo', onPress: retry }} />
        )}
      </View>
    );
  }

  const today = brasiliaDay(catalog.loadedAt);
  const filtersOn = activeFilterCount(filters);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.head}>
        <Text style={styles.h1} accessibilityRole="header">
          Agenda
        </Text>
        <Pressable style={styles.filterBtn} onPress={() => setSheet(true)} accessibilityRole="button" accessibilityLabel={filtersOn ? `Filtros, ${filtersOn} ligados` : 'Filtros'}>
          <Icon name="filtro" size={18} />
          {filtersOn ? <Text style={styles.badge}>{filtersOn}</Text> : null}
        </Pressable>
      </View>
      <View style={styles.week}>
        <WeekStrip days={week} selected={day} onSelect={(d) => setFilters({ ...filters, day: d })} />
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.sessionId}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.onBrand]} progressBackgroundColor={colors.brand} />}
        ListHeaderComponent={
          sessions.length && day === today ? (
            <View style={styles.now}>
              <View style={styles.nowDot} />
              <Text style={styles.nowText}>Hoje</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EstadoTela pose="dormindo" title="Nenhum rolê nesse dia" text={filtersOn ? 'Tente tirar alguns filtros.' : 'Escolha outro dia da semana.'} />
        }
        renderItem={({ item: s }) => {
          const p = sessionDateParts(s.startsAt, s.timeConfirmed);
          const soon = startsIn(s.startsAt, s.timeConfirmed, catalog.loadedAt);
          const slug = catalog.categorySlugs.get(s.categoryId) ?? 'outros';
          const region = catalog.regions.get(s.regionId);
          return (
            <View style={styles.slot}>
              <View style={styles.time}>
                <Text style={styles.hour}>{p.time ?? '—'}</Text>
                <Text style={styles.sub}>{p.time ? soon ?? '' : 'a confirmar'}</Text>
              </View>
              <View style={styles.rail}>
                <View style={styles.railLine} />
                <View style={styles.railDot} />
              </View>
              <EventRow
                title={s.title}
                categoryName={catalog.categories.get(s.categoryId) ?? ''}
                categorySlug={slug}
                seed={s.eventSlug}
                place={region ? `${s.venueName} · ${region}` : s.venueName}
                price={formatPrice(s.price)}
                soldOut={s.soldOut}
                accessibilityLabel={`${s.title}. ${formatCardDate(s.startsAt, s.timeConfirmed, catalog.loadedAt)}. ${s.venueName}. ${formatPrice(s.price)}`}
                onPress={() => router.push({ pathname: '/evento/[slug]', params: { slug: s.eventSlug, sessao: s.sessionId } })}
              />
            </View>
          );
        }}
      />
      <FilterSheet visible={sheet} catalog={catalog} value={filters} showDay={false} onClose={() => setSheet(false)} onApply={(f) => { setFilters({ ...f, day }); setSheet(false); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl - 4, paddingBottom: space.sm },
  h1: { color: colors.text, fontFamily: fontFamily.display, fontSize: 34, textTransform: 'uppercase' },
  filterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.brand, color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 11, textAlign: 'center', lineHeight: 18, overflow: 'hidden' },
  week: { paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  now: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl - 4, paddingTop: space.lg, paddingBottom: space.xs },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  nowText: { color: colors.brand, fontFamily: fontFamily.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  // A linha do tempo passa no vão entre o horário e o cartão, sem cruzar o texto.
  slot: { flexDirection: 'row', paddingHorizontal: space.xl - 4, paddingTop: space.md },
  time: { width: 70, paddingTop: 8 },
  hour: { color: colors.text, fontFamily: fontFamily.display, fontSize: 26, lineHeight: 30 },
  sub: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 11, marginTop: 2 },
  rail: { width: 22, alignItems: 'center' },
  railLine: { position: 'absolute', top: -space.md, bottom: 0, width: 2, backgroundColor: colors.border },
  railDot: { marginTop: 16, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.brand },
});
