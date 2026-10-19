import { logoSvg } from '@rowle/design';
import {
  activeFilterCount,
  applyFilters,
  dayLabel,
  formatCardDate,
  formatPrice,
  onePerEvent,
  stampLabel,
  type FeedItem,
} from '@rowle/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions, type ViewToken } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { openRoute, openTicket, shareEvent } from '../../src/actions';
import { useCatalog, type Catalog } from '../../src/data/catalog';
import { snapshot, useSaved } from '../../src/data/saved';
import { colors, fontFamily, radius, space } from '../../src/theme';
import { ClassInd } from '../../src/ui/ClassInd';
import { Cover, Shade } from '../../src/ui/Cover';
import { EstadoTela } from '../../src/ui/EstadoTela';
import { FilterSheet } from '../../src/ui/FilterSheet';
import { Icon, type IconName } from '../../src/ui/Icon';
import { Mascote } from '../../src/ui/Mascote';

const LOGO_RATIO = 238 / 748.8;

type Page = { kind: 'event'; item: FeedItem } | { kind: 'end' };

export default function Roles() {
  const { state, refreshing, refresh, retry, filters, setFilters } = useCatalog();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState(false);
  const [height, setHeight] = useState(0);
  const [index, setIndex] = useState(0);

  // Para capturas e testes locais: com EXPO_PUBLIC_PREVIEW_STATES=1, a URL força um
  // estado (rowle:///?previa=erro). Desligado nos builds publicados.
  const params = useLocalSearchParams<{ previa?: string }>();
  const previa = process.env.EXPO_PUBLIC_PREVIEW_STATES === '1' ? params.previa : undefined;
  const forced = { carregando: 'loading', erro: 'error', 'sem-internet': 'offline' } as const;
  const status = (previa && previa in forced ? forced[previa as keyof typeof forced] : state.status) as typeof state.status;
  const catalog = state.status === 'ready' ? state.catalog : null;

  const items = useMemo(
    () => (catalog && previa !== 'vazio' ? onePerEvent(applyFilters(catalog.sessions, filters, catalog.loadedAt)) : []),
    [catalog, filters, previa],
  );
  // Filtros mudam também pela Agenda: a lista recomeça do primeiro rolê.
  const listKey = JSON.stringify(filters);
  const [keyShown, setKeyShown] = useState(listKey);
  if (listKey !== keyShown) {
    setKeyShown(listKey);
    setIndex(0);
  }
  const pages: Page[] = useMemo(() => (items.length ? [...items.map((item) => ({ kind: 'event' as const, item })), { kind: 'end' as const }] : []), [items]);

  // A FlatList exige a mesma função sempre (useState com valor inicial é estável).
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  });

  const header = (
    <View style={[styles.head, { top: insets.top + space.sm }]} pointerEvents="box-none">
      <SvgXml xml={logoSvg} width={92} height={92 * LOGO_RATIO} accessibilityLabel="Rowlê" />
      {catalog ? (
        <View style={styles.headActions}>
          <Pressable style={styles.pillBtn} onPress={() => setSheet(true)} accessibilityRole="button" accessibilityLabel={`Dia: ${dayLabel(filters.day, catalog.loadedAt)}. Trocar`}>
            <Icon name="agenda" size={16} />
            <Text style={styles.pillText}>{dayLabel(filters.day, catalog.loadedAt)}</Text>
          </Pressable>
          <Pressable style={[styles.pillBtn, styles.iconBtn]} onPress={() => setSheet(true)} accessibilityRole="button" accessibilityLabel="Filtros">
            <Icon name="filtro" size={18} />
            {activeFilterCount(filters) > 0 ? <Text style={styles.badge}>{activeFilterCount(filters)}</Text> : null}
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  if (status !== 'ready' || !catalog) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60 }]}>
        {header}
        {status === 'loading' ? (
          <EstadoTela pose="carregando" title="Procurando rolês…" />
        ) : status === 'offline' ? (
          <EstadoTela pose="procurando" title="Sem internet" text="Confira a conexão e tente de novo." action={{ label: 'Tentar de novo', onPress: retry }} />
        ) : (
          <EstadoTela pose="erro" title="Não deu para carregar os rolês" text="Pode ser instabilidade. Tente de novo em instantes." action={{ label: 'Tentar de novo', onPress: retry }} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {pages.length === 0 ? (
        <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
          {catalog.sessions.length === 0 ? (
            <EstadoTela pose="dormindo" title="Nenhum rolê marcado por enquanto" text="A agenda é atualizada todo dia." action={{ label: 'Atualizar', onPress: retry }} />
          ) : (
            <EstadoTela pose="procurando" title="Nenhum rolê com esses filtros" action={{ label: 'Ver todos os rolês', onPress: () => setFilters({ day: null, categories: [], regions: [], freeOnly: false }) }} />
          )}
        </View>
      ) : height > 0 ? (
        <FlatList
          key={listKey}
          data={pages}
          keyExtractor={(p) => (p.kind === 'event' ? p.item.session.sessionId : 'fim')}
          renderItem={({ item: p, index: i }) =>
            p.kind === 'event' ? (
              <RolePage item={p.item} catalog={catalog} height={height} topInset={insets.top} position={i + 1} total={items.length} />
            ) : (
              <EndPage height={height} onAll={() => setFilters({ day: null, categories: [], regions: [], freeOnly: false })} filtered={filters.day !== null || activeFilterCount(filters) > 0} />
            )
          }
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.onBrand]} progressBackgroundColor={colors.brand} progressViewOffset={insets.top + 56} />}
        />
      ) : null}
      {header}
      {pages.length > 1 ? (
        <View style={[styles.dots, { top: insets.top + 120 }]} pointerEvents="none">
          {pages.slice(Math.max(0, Math.min(index - 2, pages.length - 5)), Math.max(0, Math.min(index - 2, pages.length - 5)) + 5).map((p, k) => {
            const real = Math.max(0, Math.min(index - 2, pages.length - 5)) + k;
            return <View key={real} style={[styles.dot, real === index && styles.dotOn]} />;
          })}
        </View>
      ) : null}
      <FilterSheet
        visible={sheet}
        catalog={catalog}
        value={filters}
        onClose={() => setSheet(false)}
        onApply={(f) => {
          setFilters(f);
          setSheet(false);
        }}
      />
    </View>
  );
}

function RolePage({ item, catalog, height, topInset, position, total }: { item: FeedItem; catalog: Catalog; height: number; topInset: number; position: number; total: number }) {
  const { width } = useWindowDimensions();
  const { isSaved, toggle } = useSaved();
  const s = item.session;
  const slug = catalog.categorySlugs.get(s.categoryId) ?? 'outros';
  const saved = isSaved(s.eventSlug);
  const region = catalog.regions.get(s.regionId);
  const price = formatPrice(s.price);
  const open = useCallback(() => router.push({ pathname: '/evento/[slug]', params: { slug: s.eventSlug, sessao: s.sessionId } }), [s.eventSlug, s.sessionId]);
  const titleSize = s.title.length > 34 ? 36 : s.title.length > 22 ? 42 : 48;
  const when = formatCardDate(s.startsAt, s.timeConfirmed, catalog.loadedAt);

  return (
    <View style={{ width, height }}>
      <Cover category={slug} seed={s.eventSlug} width={width} height={height} style={StyleSheet.absoluteFill} />
      <Shade stops={[[0, 0.8], [0.22, 0], [0.42, 0], [0.76, 0.94], [1, 1]]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={open} accessibilityRole="button" accessibilityLabel={`${s.title}. ${when}. ${s.venueName}${region ? `, ${region}` : ''}. ${price}. Abrir detalhes`} />

      <Text style={[styles.fita, { top: Math.max(topInset + 150, height * 0.4) }]} accessibilityElementsHidden importantForAccessibility="no">
        {stampLabel(s.startsAt, s.timeConfirmed, catalog.loadedAt)}
      </Text>

      <View style={styles.side}>
        <Action icon="salvar" label={saved ? 'Salvo' : 'Salvar'} filled={saved} onPress={() => toggle(snapshot(s))} />
        <Action icon="enviar" label="Enviar" onPress={() => shareEvent({ title: s.title, startsAt: s.startsAt, timeConfirmed: s.timeConfirmed, venueName: s.venueName })} />
        <Action icon="rota" label="Rota" onPress={() => openRoute(s.venueName, s.venueAddress)} />
        {s.ticketUrl && !s.soldOut ? <Action icon="ingresso" label="Ingresso" primary onPress={() => openTicket(s.ticketUrl!)} /> : null}
      </View>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={styles.tags}>
          <Text style={styles.chip}>{catalog.categories.get(s.categoryId)?.replace(' e vida noturna', '')}</Text>
          {s.ageRating ? <ClassInd rating={s.ageRating} official={s.ageRatingOfficial} size={30} /> : null}
          {s.isSponsored ? <Text style={styles.sponsored}>Patrocinado</Text> : null}
        </View>
        <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.02 }]} numberOfLines={3}>
          {s.title}
        </Text>
        <View style={styles.meta}>
          <Icon name="pin" size={16} color="#DDE3D8" />
          <Text style={styles.metaText} numberOfLines={1}>
            {s.venueName}
            {region ? ` · ${region}` : ''}
          </Text>
        </View>
        <View style={styles.tags}>
          <Text style={styles.price}>{price}</Text>
          {s.soldOut ? <Text style={styles.soldOut}>Esgotado</Text> : null}
          {item.moreSessions > 0 ? <Text style={styles.more}>{item.moreSessions === 1 ? '+1 data' : `+${item.moreSessions} datas`}</Text> : null}
        </View>
        <Text style={styles.hint}>
          {position} de {total} · deslize para o próximo
        </Text>
      </View>
    </View>
  );
}

function Action({ icon, label, onPress, primary, filled }: { icon: IconName; label: string; onPress: () => void; primary?: boolean; filled?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.action}>
      <View style={[styles.actionCircle, primary && styles.actionPrimary]}>
        <Icon name={icon} size={22} color={primary ? colors.onBrand : colors.text} filled={filled} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function EndPage({ height, onAll, filtered }: { height: number; onAll: () => void; filtered: boolean }) {
  return (
    <View style={[styles.end, { height }]}>
      <Mascote pose="acenando" size={150} />
      <Text style={styles.endTitle}>Por agora é isso</Text>
      <Text style={styles.endText}>Volte mais tarde para ver rolês novos.</Text>
      {filtered ? (
        <Pressable onPress={onAll} style={styles.endBtn} accessibilityRole="button">
          <Text style={styles.endBtnText}>Ver todos os rolês</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headActions: { flexDirection: 'row', gap: space.sm },
  pillBtn: { height: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: 'rgba(11,13,12,0.72)', borderWidth: 1, borderColor: 'rgba(243,245,240,0.2)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 42, paddingHorizontal: 0, justifyContent: 'center' },
  pillText: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 14 },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.brand, color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 11, textAlign: 'center', lineHeight: 18, paddingHorizontal: 4, overflow: 'hidden' },
  dots: { position: 'absolute', right: 10, gap: 6 },
  dot: { width: 4, height: 18, borderRadius: 2, backgroundColor: 'rgba(243,245,240,0.35)' },
  dotOn: { height: 30, backgroundColor: colors.brand },
  fita: { position: 'absolute', left: -8, backgroundColor: colors.brand, color: colors.onBrand, fontFamily: fontFamily.brand, fontSize: 19, paddingLeft: 24, paddingRight: 18, paddingTop: 9, paddingBottom: 6, transform: [{ rotate: '-4deg' }], overflow: 'hidden' },
  side: { position: 'absolute', right: space.lg, bottom: 210, gap: space.lg, alignItems: 'center' },
  action: { alignItems: 'center', gap: 5, minWidth: 56 },
  actionCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(11,13,12,0.72)', borderWidth: 1, borderColor: 'rgba(243,245,240,0.18)', alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  actionText: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 11, textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  bottom: { position: 'absolute', left: space.xl - 4, right: 92, bottom: space.lg },
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  chip: { backgroundColor: colors.text, color: colors.bg, fontFamily: fontFamily.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, overflow: 'hidden' },
  sponsored: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 12, borderWidth: 1, borderColor: 'rgba(243,245,240,0.4)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm },
  title: { color: colors.text, fontFamily: fontFamily.display, textTransform: 'uppercase', marginTop: space.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md, marginBottom: space.md },
  metaText: { color: '#DDE3D8', fontFamily: fontFamily.bodySemiBold, fontSize: 15, flexShrink: 1 },
  price: { color: colors.brand, fontFamily: fontFamily.bodyBold, fontSize: 15, borderWidth: 1.5, borderColor: colors.brand, backgroundColor: 'rgba(198,255,54,0.14)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md, overflow: 'hidden' },
  soldOut: { color: colors.onWarning, backgroundColor: colors.warning, fontFamily: fontFamily.bodyBold, fontSize: 13, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm, overflow: 'hidden' },
  more: { color: colors.text, backgroundColor: colors.surfaceRaised, fontFamily: fontFamily.bodyBold, fontSize: 13, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm, overflow: 'hidden' },
  hint: { color: 'rgba(243,245,240,0.6)', fontFamily: fontFamily.bodySemiBold, fontSize: 12, marginTop: space.md },
  end: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.xl },
  endTitle: { color: colors.text, fontFamily: fontFamily.display, fontSize: 32, textTransform: 'uppercase', marginTop: space.md },
  endText: { color: colors.textMuted, fontFamily: fontFamily.body, fontSize: 16, textAlign: 'center' },
  endBtn: { marginTop: space.md, height: 48, paddingHorizontal: space.xl, borderRadius: radius.pill, backgroundColor: colors.brand, justifyContent: 'center' },
  endBtnText: { color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 16 },
});
