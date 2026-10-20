import { categoryColors } from '@rowle/design';
import { formatCardDate, formatPrice, sessionDateParts } from '@rowle/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { openRoute, openTicket, shareEvent } from '../../src/actions';
import { useCatalog } from '../../src/data/catalog';
import { useEventDetail, type EventDetail, type EventSession } from '../../src/data/event';
import { useSaved } from '../../src/data/saved';
import { coverUri } from '../../src/supabase';
import { colors, fontFamily, radius, space } from '../../src/theme';
import { ClassInd } from '../../src/ui/ClassInd';
import { Cover, Shade } from '../../src/ui/Cover';
import { EstadoTela } from '../../src/ui/EstadoTela';
import { Icon } from '../../src/ui/Icon';
import { ReportSheet } from '../../src/ui/ReportSheet';

const COVER_HEIGHT = 300;

export default function Ficha() {
  const { slug, sessao } = useLocalSearchParams<{ slug: string; sessao?: string }>();
  const { state, retry } = useEventDetail(slug);
  const insets = useSafeAreaInsets();

  if (state.status !== 'ready') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <TopBar />
        {state.status === 'loading' ? (
          <EstadoTela pose="carregando" title="Abrindo o rolê…" />
        ) : state.status === 'not-found' ? (
          <EstadoTela pose="triste" title="Esse rolê não está mais no Rowlê" text="Pode ter sido retirado pela curadoria." action={{ label: 'Ver outros rolês', onPress: () => router.replace('/') }} />
        ) : (
          <EstadoTela pose="erro" title="Não deu para abrir o rolê" text="Confira a conexão e tente de novo." action={{ label: 'Tentar de novo', onPress: retry }} />
        )}
      </View>
    );
  }
  return <FichaPronta event={state.event} initialSession={sessao} />;
}

function TopBar({ event, session }: { event?: EventDetail; session?: EventSession }) {
  const insets = useSafeAreaInsets();
  const { isSaved, toggle } = useSaved();
  const saved = event ? isSaved(event.slug) : false;
  return (
    <View style={[styles.topBar, { top: insets.top + space.sm }]}>
      <Round icon="voltar" label="Voltar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      {event && session ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Round icon="enviar" label="Enviar" onPress={() => shareEvent({ title: event.title, startsAt: session.startsAt, timeConfirmed: session.timeConfirmed, venueName: session.venue.name })} />
          <Round
            icon="salvar"
            filled={saved}
            label={saved ? 'Remover dos salvos' : 'Salvar'}
            onPress={() =>
              toggle({
                slug: event.slug,
                title: event.title,
                categoryId: event.categoryId,
                venueName: session.venue.name,
                regionId: session.venue.regionId,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                timeConfirmed: session.timeConfirmed,
                priceText: formatPrice(session.price),
                coverPath: event.coverPath,
                savedAt: new Date().toISOString(),
              })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function Round({ icon, label, onPress, filled }: { icon: 'voltar' | 'enviar' | 'salvar'; label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.round}>
      <Icon name={icon} size={20} filled={filled} />
    </Pressable>
  );
}

function FichaPronta({ event, initialSession }: { event: EventDetail; initialSession?: string }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { state } = useCatalog();
  const catalog = state.status === 'ready' ? state.catalog : null;
  const [selected, setSelected] = useState(initialSession && event.sessions.some((s) => s.id === initialSession) ? initialSession : event.sessions[0]?.id);
  const session = event.sessions.find((s) => s.id === selected) ?? event.sessions[0];
  const now = useMemo(() => new Date(), []);
  const categorySlug = catalog?.categorySlugs.get(event.categoryId) ?? 'outros';
  const categoryName = catalog?.categories.get(event.categoryId) ?? '';
  const region = session ? catalog?.regions.get(session.venue.regionId) : undefined;
  const cancelled = event.status === 'cancelled' || session?.status === 'cancelled';
  const postponed = event.status === 'postponed' || session?.status === 'postponed';
  const verified = event.lastVerifiedAt ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(event.lastVerifiedAt)).replace('.', '') : null;
  const canBuy = session?.ticketUrl && !cancelled && session.status !== 'sold_out';
  const [reporting, setReporting] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ height: COVER_HEIGHT }}>
          <Cover category={categorySlug} seed={event.slug} uri={coverUri(event.coverPath)} width={width} height={COVER_HEIGHT} />
          <Shade stops={[[0, 0.6], [0.3, 0], [1, 0]]} />
        </View>
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <View style={styles.catRow}>
            <Text style={[styles.cat, { color: categoryColors[categorySlug] ?? colors.textMuted }]}>{categoryName}</Text>
            {event.ageRating ? <ClassInd rating={event.ageRating} size={32} /> : null}
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {event.title}
          </Text>
          {event.organization ? (
            <View style={styles.orgRow}>
              <Text style={styles.avatar}>{initials(event.organization.name)}</Text>
              <Text style={styles.org} numberOfLines={1}>
                {event.organization.name}
              </Text>
            </View>
          ) : null}

          {cancelled || postponed ? (
            <View style={[styles.alert, cancelled ? styles.alertDanger : styles.alertWarn]}>
              <Icon name="aviso" size={20} color={colors.bg} hole={cancelled ? colors.danger : colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{cancelled ? 'Cancelado' : 'Adiado'}</Text>
                {event.statusNote ? <Text style={styles.alertText}>{event.statusNote}</Text> : null}
              </View>
            </View>
          ) : null}

          {session ? (
            <>
              <View style={styles.stub}>
                <StubCell label="Quando" value={formatCardDate(session.startsAt, session.timeConfirmed, now).replace(' · ', '\n')} />
                <StubCell label="Preço" value={formatPrice(session.price).replace(' a ', '\na ')} divider />
                <StubCell label="Onde" value={region ?? session.venue.name} divider />
                <View style={[styles.notch, { left: -8 }]} />
                <View style={[styles.notch, { right: -8 }]} />
              </View>

              {event.sessions.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sessions}>
                  {event.sessions.map((s) => {
                    const p = sessionDateParts(s.startsAt, s.timeConfirmed);
                    const on = s.id === session.id;
                    return (
                      <Pressable key={s.id} onPress={() => setSelected(s.id)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={formatCardDate(s.startsAt, s.timeConfirmed, now)} style={[styles.sess, on && styles.sessOn]}>
                        <Text style={styles.sessSmall}>{p.weekday.toUpperCase()}</Text>
                        <Text style={styles.sessDay}>{p.day}</Text>
                        <Text style={styles.sessSmall}>{p.time ?? 'a confirmar'}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              <Pressable onPress={() => openRoute(session.venue.name, session.venue.address)} accessibilityRole="button" accessibilityLabel={`${session.venue.name}, ${session.venue.address}. Abrir rota`} style={styles.addr}>
                <View style={styles.mini}>
                  <Icon name="pin" size={22} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrName}>{session.venue.name}</Text>
                  <Text style={styles.addrText}>{session.venue.address}</Text>
                </View>
                <Text style={styles.go}>Rota</Text>
                <Icon name="rota" size={16} color={colors.brand} />
              </Pressable>

              {event.accessibilityNotes || session.venue.accessibilityNotes ? (
                <View style={styles.line}>
                  <Icon name="acessivel" size={20} color={colors.brand} />
                  <Text style={styles.lineText}>{event.accessibilityNotes ?? session.venue.accessibilityNotes}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.empty}>Sem datas marcadas no momento.</Text>
          )}

          {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

          {verified ? (
            <View style={styles.line}>
              <Icon name="check" size={18} color={colors.brand} />
              <Text style={styles.verified}>Conferido pela curadoria em {verified}</Text>
            </View>
          ) : null}

          <Pressable onPress={() => setReporting(true)} accessibilityRole="button" hitSlop={8} style={styles.report}>
            <Icon name="aviso" size={18} color={colors.textMuted} hole={colors.bg} />
            <Text style={styles.reportText}>Denunciar rolê</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TopBar event={event} session={session} />
      <ReportSheet visible={reporting} eventId={event.id} sessionId={session?.id} onClose={() => setReporting(false)} />

      {session && !cancelled ? (
        <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Pressable
            onPress={() => (canBuy ? openTicket(session.ticketUrl!) : openRoute(session.venue.name, session.venue.address))}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.ctaText}>{canBuy ? 'Comprar ingresso' : session.status === 'sold_out' ? 'Esgotado · ver rota' : 'Como chegar'}</Text>
            <Text style={styles.ctaPrice}>{formatPrice(session.price)}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function StubCell({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.cell, divider && styles.cellDivider]}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(11,13,12,0.72)', alignItems: 'center', justifyContent: 'center' },
  sheet: { marginTop: -56, backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: space.xl - 4, paddingTop: space.md },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: space.md },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, minHeight: 32 },
  cat: { flex: 1, fontFamily: fontFamily.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: fontFamily.display, fontSize: 36, lineHeight: 38, textTransform: 'uppercase', marginTop: 6 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceRaised, color: colors.text, fontFamily: fontFamily.brand, fontSize: 11, textAlign: 'center', lineHeight: 28, overflow: 'hidden' },
  org: { flex: 1, color: colors.textMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  alert: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', borderRadius: radius.lg, padding: space.md, marginTop: space.lg },
  alertDanger: { backgroundColor: colors.danger },
  alertWarn: { backgroundColor: colors.warning },
  alertTitle: { color: colors.bg, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  alertText: { color: colors.bg, fontFamily: fontFamily.body, fontSize: 14, marginTop: 2 },
  stub: { flexDirection: 'row', marginTop: space.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  notch: { position: 'absolute', top: '50%', marginTop: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.bg },
  cell: { flex: 1, padding: space.md },
  cellDivider: { borderLeftWidth: 2, borderLeftColor: colors.border, borderStyle: 'dashed' },
  cellLabel: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  cellValue: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 15, lineHeight: 20, marginTop: 4 },
  sessions: { gap: space.sm, marginTop: space.md },
  sess: { minWidth: 72, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  sessOn: { borderColor: colors.brand, backgroundColor: 'rgba(198,255,54,0.1)' },
  sessSmall: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 11 },
  sessDay: { color: colors.text, fontFamily: fontFamily.display, fontSize: 24, lineHeight: 28 },
  addr: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: space.md },
  mini: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  addrName: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 15 },
  addrText: { color: colors.textMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 13, marginTop: 2 },
  go: { color: colors.brand, fontFamily: fontFamily.bodyBold, fontSize: 14 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  lineText: { flex: 1, color: colors.text, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  empty: { color: colors.textMuted, fontFamily: fontFamily.body, fontSize: 15, marginTop: space.lg },
  desc: { color: colors.text, fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24, marginTop: space.lg },
  report: { flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start', minHeight: 48, marginTop: space.lg },
  reportText: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 14, textDecorationLine: 'underline' },
  verified: { color: colors.textMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 13 },
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl - 4, paddingTop: space.md, backgroundColor: colors.bg },
  cta: { height: 58, borderRadius: 29, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 8 },
  ctaText: { color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  ctaPrice: { height: 44, lineHeight: 44, paddingHorizontal: space.lg, borderRadius: 22, backgroundColor: colors.bg, color: colors.brand, fontFamily: fontFamily.bodyBold, fontSize: 14, overflow: 'hidden' },
});
