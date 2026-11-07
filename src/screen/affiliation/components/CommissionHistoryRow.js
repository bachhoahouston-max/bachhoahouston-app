import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import moment from 'moment-timezone';
import { COLORS, FONTS, RADIUS, SHADOW } from '../theme';
import { TZ, money, orderPill, shortDate } from '../utils';
import { StatusPill } from './ui';

const CommissionHistoryRow = ({ item, last, fallbackRate }) => {
  const { t } = useTranslation();
  const reversed = item.commissionStatus === 'Reversed';
  const deducted = item.deductionAmount > 0;
  const rate = item.rate ?? fallbackRate;
  const pill = item.pending
    ? { label: t('Pending'), ...orderPill('pending') }
    : deducted
      ? { label: t('Reversed'), ...orderPill('Return') }
      : { label: t(item.orderStatus), ...orderPill(item.orderStatus) };

  return (
    <View style={[styles.card, !last && styles.cardSpacing]}>
      <View style={styles.topRow}>
        <View style={styles.order}>
          <Text style={styles.orderNo} numberOfLines={1}>#{item.orderNumber}</Text>
          {!!item.linkProduct && (
            <Text style={styles.source} numberOfLines={1}>{t('via {{name}} link', { name: item.linkProduct })}</Text>
          )}
        </View>
        <StatusPill {...pill} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.sub}>{shortDate(item.date)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.sub}>{item.date ? moment(item.date).tz(TZ).format('hh:mm A') : ''}</Text>
      </View>

      <View style={styles.details}>
        <View>
          <Text style={styles.label}>{t('Eligible Amount')}</Text>
          <Text style={styles.value}>{item.eligibleAmount == null ? '—' : money(item.eligibleAmount)}</Text>
          {rate != null && <Text style={styles.sub}>{Number(rate)}% {t('commission rate')}</Text>}
        </View>
        <View style={styles.commission}>
          <Text style={styles.label}>{t('Commission')}</Text>
          <Text style={[styles.value, styles.strong, reversed && styles.reversed]}>
            {item.commission == null ? '—' : money(item.commission)}
          </Text>
        </View>
      </View>

      {item.deductionAmount > 0 && (
        <Text style={styles.deduction} numberOfLines={1}>
          {t('Deducted {{amount}}', { amount: money(item.deductionAmount) })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...SHADOW,
  },
  cardSpacing: { marginBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  order: { flex: 1 },
  orderNo: { fontFamily: FONTS.SemiBold, fontSize: 12, color: COLORS.text },
  sub: { fontFamily: FONTS.Regular, fontSize: 10, color: COLORS.muted, marginTop: 2 },
  source: { fontFamily: FONTS.Medium, fontSize: 10, color: COLORS.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  dot: { fontFamily: FONTS.Regular, fontSize: 10, color: COLORS.muted, marginHorizontal: 5 },
  details: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  commission: { flex: 1, alignItems: 'flex-end' },
  label: { fontFamily: FONTS.Regular, fontSize: 10, color: COLORS.muted },
  value: { fontFamily: FONTS.Medium, fontSize: 13, color: COLORS.text, marginTop: 2 },
  strong: { fontFamily: FONTS.SemiBold },
  reversed: { color: COLORS.muted, textDecorationLine: 'line-through' },
  deduction: { fontFamily: FONTS.Medium, fontSize: 9.5, color: COLORS.danger, textAlign: 'right', marginTop: 8 },
});

export default CommissionHistoryRow;
