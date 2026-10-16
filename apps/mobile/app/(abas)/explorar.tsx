import { categoryColors } from '@rowle/design';
import { formatCardDate, formatPrice, matchesSearch, onePerEvent, weekendDays, brasiliaDay } from '@rowle/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatalog, type Catalog } from '../../src/data/catalog';
import { useSaved } from '../../src/data/saved';
import { colors, fontFamily, radius, space } from '../../src/theme';
import { Cover, Shade } from '../../src/ui/Cover';
import { EstadoTela } from '../../src/ui/EstadoTela';
import { EventRow } from '../../src/ui/EventRow';
import { Icon } from '../../src/ui/Icon';

type Pick = { kind: 'categoria' | 'regiao'; id: number; name: string } | null;

/** Explorar: busca, categorias em adesivo, regiões e o fim de semana em capas. */
export default function Explorar() {
  const { state, retry } = useCatalog();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState<Pick>(null);
  const catalog = state.status === 'ready' ? state.catalog : null;

  if (!catalog) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {state.status === 'loading' ? (
          <EstadoTela pose="carregando" title="Procurando rolês…" />
        ) : (
          <EstadoTela pose={state.status === 'offline' ? 'procurando' : 'erro'} title={state.status === 'offline' ? 'Sem internet' : 'Não deu para carregar'} text="Confira a conexão e tente de novo." action={{ label: 'Tentar de novo', onPress: retry }} />
        )}
      </View>
    );
  }

  const searching = query.trim().length > 0 || pick !== null;
  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.search}>
        <Icon name="explorar" size={20} color={colors.bg} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Artista, lugar ou rolê"
          placeholderTextColor="#6B726A"
          style={styles.input}
          returnKeyType="search"
          accessibilityLabel="Buscar rolês"
        />
        {searching ? (
          <Pressable onPress={() => { setQuery(''); setPick(null); }} hitSlop={12} accessibilityRole="button" accessibilityLabel="Limpar busca">
            <Icon name="fechar" size={18} color={colors.bg} />
          </Pressable>
        ) : null}
      </View>
      {searching ? <Results catalog={catalog} query={query} pick={pick} onClearPick={() => setPick(null)} /> : <Home catalog={catalog} onPick={setPick} />}
    </View>
  );
}

function Home({ catalog, onPick }: { catalog: Catalog; onPick: (p: Pick) => void }) {
  const { width } = useWindowDimensions();
  const { preferredRegion } = useSaved();
  const categories = useMemo(() => [...new Set(catalog.sessions.map((s) => s.categoryId))], [catalog]);
  const regions = useMemo(() => {
    const n = new Map<number, number>();
    for (const s of catalog.sessions) n.set(s.regionId, (n.get(s.regionId) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => (a[0] === preferredRegion ? -1 : b[0] === preferredRegion ? 1 : b[1] - a[1]));
  }, [catalog, preferredRegion]);
  const weekend = useMemo(() => {
    const days = new Set(weekendDays(brasiliaDay(catalog.loadedAt)));
    return onePerEvent(catalog.sessions.filter((s) => days.has(brasiliaDay(s.startsAt)))).slice(0, 6);
  }, [catalog]);
  const tileW = (width - (space.xl - 4) * 2 - space.sm - 2) / 2;
  const tilts = [-2, 1.5, -1, 2, -1.5, 1, -2, 1.5];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxxl }} showsVerticalScrollIndicator={false}>
      <Text style={styles.h2} accessibilityRole="header">Categorias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickers}>
        {categories.map((id, i) => {
          const slug = catalog.categorySlugs.get(id) ?? 'outros';
          const name = catalog.categories.get(id) ?? '';
          return (
            <Pressable key={id} onPress={() => onPick({ kind: 'categoria', id, name })} accessibilityRole="button" accessibilityLabel={name}>
              <Text style={[styles.sticker, { backgroundColor: categoryColors[slug], transform: [{ rotate: `${tilts[i % tilts.length]}deg` }] }]}>{name.replace(' e vida noturna', '').toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.h2} accessibilityRole="header">Perto de você</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regions}>
        {regions.map(([id, n]) => {
          const name = catalog.regions.get(id) ?? '';
          return (
            <Pressable key={id} onPress={() => onPick({ kind: 'regiao', id, name })} style={styles.region} accessibilityRole="button" accessibilityLabel={`${name}, ${n} ${n === 1 ? 'rolê' : 'rolês'}`}>
              <Text style={styles.regionName}>{name}</Text>
              <Text style={styles.regionCount}>{n === 1 ? '1 rolê' : `${n} rolês`}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {weekend.length ? (
        <>
          <Text style={styles.h2} accessibilityRole="header">Fim de semana</Text>
          <View style={styles.grid}>
            {weekend.map(({ session: s }) => (
              <Pressable key={s.sessionId} onPress={() => router.push({ pathname: '/evento/[slug]', params: { slug: s.eventSlug, sessao: s.sessionId } })} style={[styles.tile, { width: tileW }]} accessibilityRole="button" accessibilityLabel={`${s.title}. ${formatCardDate(s.startsAt, s.timeConfirmed, catalog.loadedAt)}. ${formatPrice(s.price)}`}>
                <Cover category={catalog.categorySlugs.get(s.categoryId) ?? 'outros'} seed={s.eventSlug} width={tileW} height={190} />
                <Shade stops={[[0.35, 0], [1, 0.94]]} />
                {s.price.kind === 'free' ? <Text style={styles.tag}>Grátis</Text> : s.isSponsored ? <Text style={styles.tag}>Patrocinado</Text> : null}
                <View style={styles.cap}>
                  <Text style={styles.capTitle} numberOfLines={2}>{s.title}</Text>
                  <Text style={styles.capSub} numberOfLines={1}>{formatCardDate(s.startsAt, s.timeConfirmed, catalog.loadedAt)} · {catalog.regions.get(s.regionId)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function Results({ catalog, query, pick, onClearPick }: { catalog: Catalog; query: string; pick: Pick; onClearPick: () => void }) {
  const items = useMemo(() => {
    const filtered = catalog.sessions.filter(
      (s) => matchesSearch(s, query, catalog) && (!pick || (pick.kind === 'categoria' ? s.categoryId === pick.id : s.regionId === pick.id)),
    );
    return onePerEvent(filtered);
  }, [catalog, query, pick]);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.session.sessionId}
      contentContainerStyle={{ paddingHorizontal: space.xl - 4, paddingBottom: space.xxxl, gap: space.md }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.resultsHead}>
          {pick ? (
            <Pressable onPress={onClearPick} style={styles.pick} accessibilityRole="button" accessibilityLabel={`Tirar filtro ${pick.name}`}>
              <Text style={styles.pickText}>{pick.name}</Text>
              <Icon name="fechar" size={14} color={colors.bg} />
            </Pressable>
          ) : null}
          <Text style={styles.count}>{items.length === 1 ? '1 rolê' : `${items.length} rolês`}</Text>
        </View>
      }
      ListEmptyComponent={<EstadoTela pose="procurando" title="Nada encontrado" text="Tente outra palavra ou o nome do lugar." />}
      renderItem={({ item: { session: s } }) => {
        const region = catalog.regions.get(s.regionId);
        return (
          <EventRow
            title={s.title}
            categoryName={catalog.categories.get(s.categoryId) ?? ''}
            categorySlug={catalog.categorySlugs.get(s.categoryId) ?? 'outros'}
            seed={s.eventSlug}
            place={`${formatCardDate(s.startsAt, s.timeConfirmed, catalog.loadedAt)} · ${region ?? s.venueName}`}
            price={formatPrice(s.price)}
            soldOut={s.soldOut}
            accessibilityLabel={`${s.title}. ${formatCardDate(s.startsAt, s.timeConfirmed, catalog.loadedAt)}. ${s.venueName}. ${formatPrice(s.price)}`}
            onPress={() => router.push({ pathname: '/evento/[slug]', params: { slug: s.eventSlug, sessao: s.sessionId } })}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: { marginHorizontal: space.lg, height: 52, borderRadius: 26, backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.lg },
  input: { flex: 1, color: colors.bg, fontFamily: fontFamily.bodySemiBold, fontSize: 16, paddingVertical: 0 },
  h2: { color: colors.text, fontFamily: fontFamily.display, fontSize: 24, textTransform: 'uppercase', paddingHorizontal: space.xl - 4, paddingTop: space.xl, paddingBottom: space.md },
  stickers: { paddingHorizontal: space.xl - 4, gap: 10, paddingBottom: 6 },
  sticker: { color: colors.bg, fontFamily: fontFamily.brand, fontSize: 14, paddingHorizontal: 13, paddingVertical: 11, borderRadius: radius.sm, overflow: 'hidden' },
  regions: { paddingHorizontal: space.xl - 4, gap: space.sm },
  region: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 48 },
  regionName: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 15 },
  regionCount: { color: colors.textMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 2, paddingHorizontal: space.xl - 4 },
  tile: { height: 190, borderRadius: 16, overflow: 'hidden' },
  tag: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.bg, color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  cap: { position: 'absolute', left: 10, right: 10, bottom: 9 },
  capTitle: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 14, lineHeight: 17 },
  capSub: { color: '#DDE3D8', fontFamily: fontFamily.bodySemiBold, fontSize: 11, marginTop: 3 },
  resultsHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.lg },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  pickText: { color: colors.bg, fontFamily: fontFamily.bodyBold, fontSize: 13 },
  count: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 13 },
});
