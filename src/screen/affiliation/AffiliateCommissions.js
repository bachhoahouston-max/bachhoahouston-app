import React, {useEffect, useMemo, useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Banknote, Info, ReceiptText, ShoppingBag} from 'lucide-react-native';
import {Post} from '../../Assets/Helpers/Service';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import AttributedOrderRow from './components/AttributedOrderRow';
import {TAB_BAR_SPACE} from './components/AffiliateTabBar';
import {Card, EmptyState, Segmented, StatusPill} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {PAYOUT_STATUS, buildAttributedOrders, money, shortDate} from './utils';

const ORDER_FILTERS = [
  {value: 'all', label: 'All', match: () => true},
  {value: 'pending', label: 'Pending', match: item => item.pending},
  {value: 'ready', label: 'Ready', match: item => item.commissionStatus === 'Pending'},
  {value: 'payout', label: 'In payout', match: item => item.commissionStatus === 'Approved'},
  {value: 'paid', label: 'Paid', match: item => item.commissionStatus === 'Paid'},
  {value: 'reversed', label: 'Reversed', match: item => item.commissionStatus === 'Reversed'},
];

const AffiliateCommissions = ({route}) => {
  const {t} = useTranslation();
  const {dashboard, refresh} = useAffiliate();
  const [segment, setSegment] = useState(route?.params?.segment || 'orders');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // "View All" on the dashboard opens this tab on the orders list.
  useEffect(() => {
    if (route?.params?.segment) {
      setSegment(route.params.segment);
    }
  }, [route?.params?.segment]);

  const application = dashboard?.application || {};
  const totals = dashboard?.totals || {};
  const payouts = dashboard?.payouts || [];
  const orders = useMemo(() => buildAttributedOrders(dashboard), [dashboard]);
  const activeFilter = ORDER_FILTERS.find(f => f.value === filter) || ORDER_FILTERS[0];
  const visibleOrders = orders.filter(activeFilter.match);
  const canRequest = Number(totals.available) > 0;
  const zelle = application.zelleEmail || application.zellePhone;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const submitPayout = async () => {
    setRequesting(true);
    try {
      const res = await Post('affiliation/payouts', {}, {});
      if (!res?.status) {
        Alert.alert(t('Payout unavailable'), res?.message || t('No unpaid commission is ready yet.'));
        return;
      }
      Alert.alert(t('Payout requested'), t('Your payout has been sent for owner approval.'));
      setSegment('payouts');
      refresh();
    } catch (error) {
      Alert.alert(t('Payout unavailable'), error?.message || t('Please check your connection.'));
    } finally {
      setRequesting(false);
    }
  };

  const requestPayout = () => {
    Alert.alert(
      t('Request payout'),
      t('Request {{amount}} to be sent to {{zelle}} via Zelle?', {amount: money(totals.available), zelle: zelle || 'Zelle'}),
      [
        {text: t('Cancel'), style: 'cancel'},
        {text: t('Request'), onPress: submitPayout},
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <AffiliateHeader compact title={t('Commissions')} subtitle={t('Track your earnings and payouts')} />

        <View style={styles.body}>
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>{t('Available commission')}</Text>
            <Text style={styles.balanceAmount}>{money(totals.available)}</Text>
            <Text style={styles.balanceMeta}>
              {t('Lifetime earned')} {money(totals.earned)} · {Number(application.commissionRate || 0)}% {t('commission rate')}
            </Text>
            <TouchableOpacity
              style={[styles.payoutButton, (!canRequest || requesting) && styles.payoutDisabled]}
              onPress={requestPayout}
              disabled={!canRequest || requesting}
              activeOpacity={0.85}>
              <Banknote size={18} color={COLORS.primary} />
              <Text style={styles.payoutText}>
                {requesting ? t('Requesting...') : canRequest ? t('Request payout') : t('Nothing to pay out yet')}
              </Text>
            </TouchableOpacity>
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatValue}>{money(totals.inPayout)}</Text>
                <Text style={styles.balanceStatLabel}>{t('In payout request')}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatValue}>{money(totals.paid)}</Text>
                <Text style={styles.balanceStatLabel}>{t('Total paid')}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatValue}>{totals.attributedOrders || 0}</Text>
                <Text style={styles.balanceStatLabel}>{t('Orders')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.note}>
            <Info size={16} color={COLORS.info} />
            <Text style={styles.noteText}>
              {zelle
                ? t('Payouts are sent by Zelle to {{zelle}} after owner approval.', {zelle})
                : t('Add a Zelle email or phone number before requesting a payout.')}
            </Text>
          </View>

          <Segmented
            value={segment}
            onChange={setSegment}
            options={[
              {value: 'orders', label: t('Orders'), count: orders.length},
              {value: 'payouts', label: t('Payouts'), count: payouts.length},
            ]}
          />

          {segment === 'orders' ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}>
                {ORDER_FILTERS.map(option => {
                  const active = option.value === filter;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilter(option.value)}>
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>{t(option.label)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Card style={styles.listCard}>
                {visibleOrders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title={filter === 'all' ? t('No attributed orders yet') : t('Nothing here')}
                    text={filter === 'all' ? t('No commission yet. Share your link to get started.') : t('No orders match this filter.')}
                  />
                ) : (
                  visibleOrders.map((item, index) => (
                    <AttributedOrderRow
                      key={item.key}
                      item={item}
                      showCommissionStatus
                      last={index === visibleOrders.length - 1}
                    />
                  ))
                )}
              </Card>
              <Text style={styles.footnote}>{t('Commission is added when the order is completed or delivered.')}</Text>
            </>
          ) : (
            <Card style={[styles.listCard, styles.payoutsCard]}>
              {payouts.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title={t('No payouts yet')}
                  text={t('When you request a payout it will appear here with its status.')}
                />
              ) : (
                payouts.map((payout, index) => {
                  const config = PAYOUT_STATUS[payout.status] || PAYOUT_STATUS['Pending Approval'];
                  const amount = payout.status === 'Paid' ? payout.paymentAmount ?? payout.totalAmount : payout.totalAmount;
                  return (
                    <View key={payout._id} style={[styles.payoutRow, index < payouts.length - 1 && styles.divider]}>
                      <View style={styles.payoutIcon}>
                        <Banknote size={18} color={config.color} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.payoutTitle}>{money(amount)}</Text>
                        <Text style={styles.payoutMeta}>
                          {shortDate(payout.paidAt || payout.createdAt)} · {payout.orderCount} {t('orders')}
                        </Text>
                        {!!payout.transactionReference && (
                          <Text style={styles.payoutMeta}>{t('Ref')}: {payout.transactionReference}</Text>
                        )}
                        {!!payout.rejectionReason && (
                          <Text style={[styles.payoutMeta, {color: COLORS.danger}]}>{payout.rejectionReason}</Text>
                        )}
                      </View>
                      <StatusPill label={t(config.label)} color={config.color} bg={config.bg} />
                    </View>
                  );
                })
              )}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: TAB_BAR_SPACE},
  body: {paddingHorizontal: 14, paddingTop: 18},
  flex: {flex: 1},
  balance: {backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.lg, padding: 18},
  balanceLabel: {fontFamily: FONTS.Medium, fontSize: 13, color: 'rgba(255,255,255,0.8)'},
  balanceAmount: {fontFamily: FONTS.Bold, fontSize: 32, color: COLORS.white, marginTop: 2},
  balanceMeta: {fontFamily: FONTS.Regular, fontSize: 12, color: 'rgba(255,255,255,0.78)'},
  payoutButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payoutDisabled: {opacity: 0.6},
  payoutText: {fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.primary},
  balanceStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  balanceStat: {flex: 1, alignItems: 'center'},
  balanceDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.18)'},
  balanceStatValue: {fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.white},
  balanceStatLabel: {fontFamily: FONTS.Regular, fontSize: 10.5, color: 'rgba(255,255,255,0.75)', marginTop: 2, textAlign: 'center'},
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: COLORS.infoSoft,
    borderRadius: RADIUS.md,
    padding: 12,
    marginVertical: 14,
  },
  noteText: {flex: 1, fontFamily: FONTS.Regular, fontSize: 12.5, color: COLORS.info, lineHeight: 18},
  filters: {gap: 8, paddingVertical: 12},
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  filterText: {fontFamily: FONTS.Medium, fontSize: 12.5, color: COLORS.textSecondary},
  filterTextActive: {color: COLORS.white},
  listCard: {paddingVertical: 2},
  payoutsCard: {marginTop: 12},
  footnote: {fontFamily: FONTS.Regular, fontSize: 11.5, color: COLORS.muted, textAlign: 'center', marginTop: 10},
  payoutRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14},
  divider: {borderBottomWidth: 1, borderBottomColor: COLORS.divider},
  payoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: {fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.text},
  payoutMeta: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 1},
});

export default AffiliateCommissions;
