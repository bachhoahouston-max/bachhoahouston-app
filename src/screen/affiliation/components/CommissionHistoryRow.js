import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import moment from 'moment-timezone';
import {COLORS, FONTS} from '../theme';
import {TZ, money, orderPill, shortDate} from '../utils';
import {StatusPill} from './ui';

export const CommissionHistoryHeader = () => {
  const {t} = useTranslation();
  return (
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.headText, styles.orderCol]}>{t('Order #')}</Text>
      <Text style={[styles.headText, styles.timeCol]}>{t('Date')}</Text>
      <Text style={[styles.headText, styles.amountCol, styles.right]}>{t('Eligible Amount')}</Text>
      <Text style={[styles.headText, styles.amountCol, styles.right]}>{t('Commission')}</Text>
      <Text style={[styles.headText, styles.statusCol, styles.center]}>{t('Status')}</Text>
    </View>
  );
};

const CommissionHistoryRow = ({item, last, fallbackRate}) => {
  const {t} = useTranslation();
  const reversed = item.commissionStatus === 'Reversed';
  const rate = item.rate ?? fallbackRate;
  const pill = item.pending
    ? {label: t('Pending'), ...orderPill('pending')}
    : {label: t(item.orderStatus), ...orderPill(item.orderStatus)};

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.orderCol}>
        <Text style={styles.orderNo} numberOfLines={1}>#{item.orderNumber}</Text>
        <Text style={styles.sub} numberOfLines={1}>{shortDate(item.date)}</Text>
        {!!item.linkProduct && (
          <Text style={styles.source} numberOfLines={1}>{t('via {{name}} link', {name: item.linkProduct})}</Text>
        )}
      </View>
      <Text style={[styles.time, styles.timeCol]}>{item.date ? moment(item.date).tz(TZ).format('hh:mm A') : ''}</Text>
      <View style={styles.amountCol}>
        <Text style={[styles.value, styles.right]}>{item.eligibleAmount == null ? '—' : money(item.eligibleAmount)}</Text>
        {rate != null && <Text style={[styles.sub, styles.right]}>{Number(rate)}%</Text>}
      </View>
      <Text style={[styles.value, styles.strong, styles.amountCol, styles.right, reversed && styles.reversed]}>
        {item.commission == null ? '—' : money(item.commission)}
      </Text>
      <View style={[styles.statusCol, styles.pillWrap]}>
        <StatusPill {...pill} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 4},
  header: {paddingTop: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider},
  divider: {borderBottomWidth: 1, borderBottomColor: COLORS.divider},
  headText: {fontFamily: FONTS.Medium, fontSize: 10.5, color: COLORS.muted},
  orderCol: {flex: 1.3},
  timeCol: {flex: 0.95},
  amountCol: {flex: 1},
  statusCol: {flex: 1.15},
  right: {textAlign: 'right'},
  center: {textAlign: 'center'},
  orderNo: {fontFamily: FONTS.SemiBold, fontSize: 12, color: COLORS.text},
  sub: {fontFamily: FONTS.Regular, fontSize: 10, color: COLORS.muted, marginTop: 2},
  source: {fontFamily: FONTS.Medium, fontSize: 10, color: COLORS.primary, marginTop: 2},
  time: {fontFamily: FONTS.Regular, fontSize: 11, color: COLORS.textSecondary},
  value: {fontFamily: FONTS.Medium, fontSize: 12, color: COLORS.text},
  strong: {fontFamily: FONTS.SemiBold},
  reversed: {color: COLORS.muted, textDecorationLine: 'line-through'},
  pillWrap: {alignItems: 'center'},
});

export default CommissionHistoryRow;
