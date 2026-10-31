import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {COLORS, FONTS} from '../theme';
import {COMMISSION_STATUS, money, orderPill, shortDate} from '../utils';
import {StatusPill} from './ui';

/**
 * One attributed order: number + date (+ product link it came through) |
 * eligible amount | commission | status.
 * `showCommissionStatus` swaps the order-status pill for the commission state
 * (ready / in payout / paid / reversed), used on the Commissions page.
 */
const AttributedOrderRow = ({item, last, showCommissionStatus = false}) => {
  const {t} = useTranslation();
  const reversed = item.commissionStatus === 'Reversed';

  let pill = {label: t(item.orderStatus), ...orderPill(item.orderStatus)};
  if (item.pending) {
    pill = {label: t('Pending'), ...orderPill('pending')};
  } else if (showCommissionStatus && COMMISSION_STATUS[item.commissionStatus]) {
    const config = COMMISSION_STATUS[item.commissionStatus];
    pill = {label: t(config.label), color: config.color, bg: config.bg};
  }

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.orderCol}>
        <Text style={styles.orderNo} numberOfLines={1}>#{item.orderNumber}</Text>
        <Text style={styles.date}>{shortDate(item.date)}</Text>
        {!!item.linkProduct && (
          <Text style={styles.source} numberOfLines={1}>{t('via {{name}} link', {name: item.linkProduct})}</Text>
        )}
      </View>
      <View style={styles.col}>
        <Text style={styles.label} numberOfLines={1}>{t('Eligible Amount')}</Text>
        <Text style={styles.value}>{item.eligibleAmount == null ? '—' : money(item.eligibleAmount)}</Text>
      </View>
      <View style={styles.col}>
        <Text style={styles.label} numberOfLines={1}>{t('Commission')}</Text>
        <Text style={[styles.value, reversed && styles.reversed]}>
          {item.commission == null ? '—' : money(item.commission)}
        </Text>
      </View>
      <View style={styles.pillCol}>
        <StatusPill {...pill} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
  divider: {borderBottomWidth: 1, borderBottomColor: COLORS.divider},
  orderCol: {flex: 1.25, paddingRight: 6},
  orderNo: {fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.text},
  date: {fontFamily: FONTS.Regular, fontSize: 11, color: COLORS.muted, marginTop: 2},
  source: {fontFamily: FONTS.Medium, fontSize: 10.5, color: COLORS.primary, marginTop: 2},
  col: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
    paddingHorizontal: 8,
  },
  label: {fontFamily: FONTS.Regular, fontSize: 10, color: COLORS.muted},
  value: {fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.text, marginTop: 2},
  reversed: {color: COLORS.muted, textDecorationLine: 'line-through'},
  pillCol: {width: 74, alignItems: 'flex-end'},
});

export default AttributedOrderRow;
