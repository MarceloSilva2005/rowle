import { formatCardDate, formatPrice, sessionDateParts, type FeedItem } from '@rowle/core';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, space } from '../theme';

interface Props {
  item: FeedItem;
  regionName: string | undefined;
  categoryName: string | undefined;
  now: Date;
}

export function EventCard({ item, regionName, categoryName, now }: Props) {
  const { session, moreSessions } = item;
  const date = sessionDateParts(session.startsAt, session.timeConfirmed);
  const place = regionName ? `${session.venueName} · ${regionName}` : session.venueName;
  const price = formatPrice(session.price);
  const when = formatCardDate(session.startsAt, session.timeConfirmed, now);
  const more = moreSessions === 1 ? '+1 data' : moreSessions > 1 ? `+${moreSessions} datas` : null;

  const label = [
    session.title,
    when,
    place,
    price,
    session.soldOut ? 'Esgotado' : null,
    more,
    session.isSponsored ? 'Patrocinado' : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.card} accessible accessibilityLabel={label}>
      <View style={styles.date}>
        <Text style={styles.weekday}>{date.weekday}</Text>
        <Text style={styles.day}>{date.day}</Text>
        <Text style={styles.month}>{date.month}</Text>
      </View>
      <View style={styles.body}>
        {categoryName ? <Text style={styles.category}>{categoryName}</Text> : null}
        <Text style={styles.title} numberOfLines={2}>
          {session.title}
        </Text>
        <Text style={styles.line} numberOfLines={2}>
          {date.time ?? 'Horário a confirmar'}
          {' · '}
          {place}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{price}</Text>
          {session.soldOut ? <Text style={[styles.tag, styles.soldOut]}>Esgotado</Text> : null}
          {more ? <Text style={[styles.tag, styles.more]}>{more}</Text> : null}
          {session.isSponsored ? <Text style={[styles.tag, styles.sponsored]}>Patrocinado</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  date: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    backgroundColor: colors.surfaceRaised,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  weekday: {
    color: colors.textMuted,
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  day: {
    color: colors.brand,
    fontFamily: fontFamily.display,
    fontSize: 32,
    lineHeight: 38,
  },
  month: {
    color: colors.text,
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    padding: space.md,
    gap: 2,
  },
  category: {
    color: colors.textMuted,
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bodyBold,
    fontSize: 17,
    lineHeight: 22,
  },
  line: {
    color: colors.textMuted,
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  price: {
    color: colors.text,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
  },
  tag: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  soldOut: { color: colors.onWarning, backgroundColor: colors.warning },
  more: { color: colors.text, backgroundColor: colors.surfaceRaised },
  sponsored: { color: colors.textMuted, borderWidth: 1, borderColor: colors.border },
});
