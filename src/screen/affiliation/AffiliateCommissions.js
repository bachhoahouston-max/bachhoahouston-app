import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment-timezone';
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Filter,
  Info,
  Percent,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native';
import { Post } from '../../Assets/Helpers/Service';
import { useAffiliate } from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import CommissionHistoryRow, { CommissionHistoryHeader } from './components/CommissionHistoryRow';
import { TAB_BAR_SPACE } from './components/AffiliateTabBar';
import { Card, EmptyState, StatusPill } from './components/ui';
import { COLORS, FONTS, RADIUS } from './theme';
import { PAYOUT_STATUS, TZ, buildAttributedOrders, money, shortDate } from './utils';

// Commission status tabs. "Pending" is earned and ready for payout,
// "Approved" is inside a payout request, "Processing" is an order that has
// not been completed yet (no commission amount so far).
const STATUS_TABS = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'pending', label: 'Pending', match: item => item.commissionStatus === 'Pending' },
  { value: 'approved', label: 'Approved', match: item => item.commissionStatus === 'Approved' },
  { value: 'paid', label: 'Paid', match: item => item.commissionStatus === 'Paid' },
  { value: 'processing', label: 'Processing', match: item => item.pending },
  { value: 'reversed', label: 'Reversed', match: item => item.commissionStatus === 'Reversed' },
];

const DATE_RANGES = [
  { value: 0, label: 'All time' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const SummaryCard = ({ icon: Icon, label, value, meta }) => (
  <View style={styles.summary}>
    <View style={styles.summaryIcon}>
      <Icon size={15} color={COLORS.primary} />
    </View>
    <Text style={styles.summaryLabel} numberOfLines={2}>{label}</Text>
    <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text style={styles.summaryMeta} numberOfLines={1}>{meta}</Text>
  </View>
);

const AffiliateCommissions = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { dashboard, refresh } = useAffiliate();
  const scrollRef = useRef(null);
  const payoutsY = useRef(0);
  const [tab, setTab] = useState('all');
  const [range, setRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const application = dashboard?.application || {};
  const totals = dashboard?.totals || {};
  const payouts = dashboard?.payouts || [];
  const rate = Number(application.commissionRate || 0);
  const orders = useMemo(() => buildAttributedOrders(dashboard), [dashboard]);
  const rangeOrders = useMemo(() => {
    if (!range) {
      return orders;
    }
    const since = moment().tz(TZ).subtract(range, 'days');
    return orders.filter(item => moment(item.date).isAfter(since));
  }, [orders, range]);
  const activeTab = STATUS_TABS.find(f => f.value === tab) || STATUS_TABS[0];
  const visibleOrders = rangeOrders.filter(activeTab.match);
  const countOf = status => orders.filter(item => item.commissionStatus === status).length;
  const canRequest = Number(totals.available) > 0;
  const zelle = application.zelleEmail || application.zellePhone;
  const activeRange = DATE_RANGES.find(r => r.value === range) || DATE_RANGES[0];

  const scrollToPayouts = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: payoutsY.current, animated: true }), 300);
  };

  // Links to this tab can ask for the payout list.
  useEffect(() => {
    if (route?.params?.segment === 'payouts') {
      scrollToPayouts();
    }
  }, [route?.params?.segment]);

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
      scrollToPayouts();
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
      t('Request {{amount}} to be sent to {{zelle}} via Zelle?', { amount: money(totals.available), zelle: zelle || 'Zelle' }),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Request'), onPress: submitPayout },
      ],
    );
  };

  const showRateDetails = () => {
    Alert.alert(
      t('Your Commission Rate'),
      t('You earn {{rate}}% of the eligible amount of every order placed with your referral code or links, once the order is completed or delivered.', { rate }),
    );
  };

  const shareReport = () => {
    const lines = visibleOrders.map(item =>
      [
        `#${item.orderNumber}`,
        shortDate(item.date),
        item.eligibleAmount == null ? '—' : money(item.eligibleAmount),
        item.commission == null ? '—' : money(item.commission),
        t(item.pending ? 'Pending' : item.orderStatus),
      ].join(' · '),
    );
    const message = [
      t('Commission report'),
      `${t('Pending Commission')}: ${money(totals.available)}`,
      `${t('Approved')}: ${money(totals.inPayout)}`,
      `${t('Total Paid')}: ${money(totals.paid)}`,
      `${t('Commission Rate')}: ${rate}%`,
      '',
      ...(lines.length ? lines : [t('No orders match this filter.')]),
    ].join('\n');
    Share.share({ title: t('Commission report'), message }).catch(() => { });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <AffiliateHeader compact inline title={t('My commissions')} onBack={() => navigation.navigate('AffiliateHome')} />

        <View style={styles.body}>
          <View style={styles.summaryRow}>
            <SummaryCard
              icon={Wallet}
              label={t('Pending Commission')}
              value={money(totals.available)}
              meta={t('From {{count}} orders', { count: countOf('Pending') })}
            />
            <SummaryCard
              icon={CheckCircle2}
              label={t('Approved')}
              value={money(totals.inPayout)}
              meta={t('From {{count}} orders', { count: countOf('Approved') })}
            />
            <SummaryCard
              icon={CircleDollarSign}
              label={t('Total Paid')}
              value={money(totals.paid)}
              meta={t('Lifetime earnings')}
            />
          </View>

          {/* <View style={styles.rateCard}>
            <View style={styles.rateIcon}>
              <Percent size={20} color={COLORS.white} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rateLabel}>{t('Your Commission Rate')}</Text>
              <Text style={styles.rateValue}>{rate}%</Text>
            </View>
            <TouchableOpacity style={styles.rateButton} onPress={showRateDetails} activeOpacity={0.85}>
              <Text style={styles.rateButtonText}>{t('View Details')}</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View> */}

          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>{t('Available commission')}</Text>
            <Text style={styles.balanceAmount}>{money(totals.available)}</Text>
            <Text style={styles.balanceMeta}>
              {t('Lifetime earned')} {money(totals.earned)} · {rate}% {t('commission rate')}
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
                ? t('Payouts are sent by Zelle to {{zelle}} after owner approval.', { zelle })
                : t('Add a Zelle email or phone number before requesting a payout.')}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('Commission History')}</Text>
            <TouchableOpacity
              style={[styles.filterButton, (showFilters || range) && styles.filterButtonActive]}
              onPress={() => setShowFilters(v => !v)}
              activeOpacity={0.85}>
              <Filter size={14} color={COLORS.primary} />
              <Text style={styles.filterButtonText}>{range ? t(activeRange.label) : t('Filter')}</Text>
              <ChevronRight size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.ranges}>
              {DATE_RANGES.map(option => {
                const active = option.value === range;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.rangeChip, active && styles.rangeChipActive]}
                    onPress={() => {
                      setRange(option.value);
                      setShowFilters(false);
                    }}>
                    <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{t(option.label)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsBar}
            contentContainerStyle={styles.tabs}>
            {STATUS_TABS.map(option => {
              const active = option.value === tab;
              const count = option.value === 'all' ? 0 : rangeOrders.filter(option.match).length;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setTab(option.value)}
                  activeOpacity={0.85}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {t(option.label)}
                    {option.value === 'all' ? '' : ` (${count})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Card style={styles.tableCard}>
            {visibleOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={tab === 'all' && !range ? t('No attributed orders yet') : t('Nothing here')}
                text={tab === 'all' && !range ? t('No commission yet. Share your link to get started.') : t('No orders match this filter.')}
              />
            ) : (
              <>
                <CommissionHistoryHeader />
                {visibleOrders.map((item, index) => (
                  <CommissionHistoryRow
                    key={item.key}
                    item={item}
                    fallbackRate={item.pending ? rate : undefined}
                    last={index === visibleOrders.length - 1}
                  />
                ))}
              </>
            )}
          </Card>

          <View onLayout={e => (payoutsY.current = e.nativeEvent.layout.y)}>
            <Text style={[styles.sectionTitle, styles.payoutsTitle]}>{t('Payout history')}</Text>
            <Card style={styles.listCard}>
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
                          <Text style={[styles.payoutMeta, { color: COLORS.danger }]}>{payout.rejectionReason}</Text>
                        )}
                      </View>
                      <StatusPill label={t(config.label)} color={config.color} bg={config.bg} />
                    </View>
                  );
                })
              )}
            </Card>
          </View>

          <View style={styles.important}>
            <View style={styles.importantIcon}>
              <Info size={12} color={COLORS.white} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.importantTitle}>{t('Important')}</Text>
              <Text style={styles.importantText}>
                {t('Commissions are calculated only for completed or delivered orders. Canceled, refunded or adjusted orders do not earn commission.')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.reportButton} onPress={shareReport} activeOpacity={0.85}>
            <FileText size={18} color={COLORS.white} />
            <Text style={styles.reportText}>{t('View Commission Report')}</Text>
            <ChevronRight size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: TAB_BAR_SPACE },
  body: { paddingHorizontal: 14, paddingTop: 18 },
  flex: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summary: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primaryBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontFamily: FONTS.Medium, fontSize: 11.5, color: COLORS.primaryDark, lineHeight: 15, minHeight: 30 },
  summaryValue: { fontFamily: FONTS.Bold, fontSize: 17, color: COLORS.text, marginTop: 6 },
  summaryMeta: { fontFamily: FONTS.Regular, fontSize: 10, color: COLORS.muted, marginTop: 2 },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
  },
  rateIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateLabel: { fontFamily: FONTS.Medium, fontSize: 13, color: COLORS.text },
  rateValue: { fontFamily: FONTS.SemiBold, fontSize: 20, color: COLORS.text, marginTop: 2 },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  rateButtonText: { fontFamily: FONTS.SemiBold, fontSize: 12.5, color: COLORS.primary },
  balance: { backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.lg, padding: 18, marginTop: 12 },
  balanceLabel: { fontFamily: FONTS.Medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontFamily: FONTS.Bold, fontSize: 32, color: COLORS.white, marginTop: 2 },
  balanceMeta: { fontFamily: FONTS.Regular, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
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
  payoutDisabled: { opacity: 0.6 },
  payoutText: { fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.primary },
  balanceStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  balanceStat: { flex: 1, alignItems: 'center' },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  balanceStatValue: { fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.white },
  balanceStatLabel: { fontFamily: FONTS.Regular, fontSize: 10.5, color: 'rgba(255,255,255,0.75)', marginTop: 2, textAlign: 'center' },
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: COLORS.infoSoft,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 12,
  },
  noteText: { flex: 1, fontFamily: FONTS.Regular, fontSize: 12.5, color: COLORS.info, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
  sectionTitle: { fontFamily: FONTS.Bold, fontSize: 16, color: COLORS.text },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
  },
  filterButtonActive: { borderColor: COLORS.primary },
  filterButtonText: { fontFamily: FONTS.Medium, fontSize: 12.5, color: COLORS.primary },
  ranges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  rangeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rangeText: { fontFamily: FONTS.Medium, fontSize: 12, color: COLORS.textSecondary },
  rangeTextActive: { color: COLORS.white },
  tabsBar: {
    marginTop: 12,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  tabs: { padding: 4, gap: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabActive: { backgroundColor: COLORS.primaryDark },
  tabText: { fontFamily: FONTS.Medium, fontSize: 12.5, color: COLORS.textSecondary },
  tabTextActive: { fontFamily: FONTS.SemiBold, color: COLORS.white },
  tableCard: { marginTop: 12, paddingHorizontal: 10, paddingVertical: 8 },
  payoutsTitle: { marginTop: 22, marginBottom: 10 },
  listCard: { paddingVertical: 2 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  payoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: { fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.text },
  payoutMeta: { fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 1 },
  important: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
  },
  importantIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  importantTitle: { fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.text },
  importantText: { fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginTop: 2 },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    marginTop: 18,
    borderRadius: 26,
    backgroundColor: COLORS.primaryDark,
  },
  reportText: { fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.white },
});

export default AffiliateCommissions;
