import React, {useContext, useMemo, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Ban, PieChart, ReceiptText, ShoppingBag, WalletCards} from 'lucide-react-native';
import {UserContext} from '../../../App';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import AttributedOrderRow from './components/AttributedOrderRow';
import ReferralCard from './components/ReferralCard';
import {TAB_BAR_SPACE} from './components/AffiliateTabBar';
import {Card, EmptyState, SectionHeader, StatCard} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {APPLICATION_STATUS, buildAttributedOrders, money} from './utils';

const RECENT_LIMIT = 4;

const AffiliateHome = ({navigation}) => {
  const {t} = useTranslation();
  const [user] = useContext(UserContext);
  const {dashboard, refresh} = useAffiliate();
  const [refreshing, setRefreshing] = useState(false);

  const application = dashboard?.application || {};
  const totals = dashboard?.totals || {};
  const suspended = application.status === 'Suspended';
  const orders = useMemo(() => buildAttributedOrders(dashboard), [dashboard]);
  const firstName = String(application.user?.name || user?.name || '').trim().split(' ')[0];
  const statusChip = APPLICATION_STATUS[application.status] || APPLICATION_STATUS.Approved;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <AffiliateHeader
          title={firstName ? t('Welcome, {{name}}', {name: firstName}) : t('Welcome')}
          subtitle={suspended ? t('Your affiliate account is suspended') : t("You're an approved affiliate")}
          chip={{label: t(statusChip.label), color: statusChip.color, bg: COLORS.white, icon: !suspended}}
        />

        <View style={styles.body}>
          {suspended && (
            <View style={styles.alert}>
              <Ban size={18} color={COLORS.danger} />
              <Text style={styles.alertText}>
                {application.rejectionReason
                  ? `${t('Reason')}: ${application.rejectionReason}`
                  : t('Your affiliate account is suspended. Please contact the store.')}
              </Text>
            </View>
          )}

          <View style={styles.stats}>
            <StatCard icon={WalletCards} label={t('Balance due')} value={money(totals.available)} />
            <StatCard icon={PieChart} label={t('Total earned')} value={money(totals.earned)} />
            <StatCard icon={ReceiptText} label={t('Paid lifetime')} value={money(totals.paid)} />
          </View>

          <ReferralCard application={application} suspended={suspended} style={styles.referralCard} />

          <SectionHeader
            title={t('Recent Attributed Orders')}
            actionLabel={orders.length ? t('View All') : undefined}
            onAction={() => navigation.navigate('AffiliateCommissions', {segment: 'orders'})}
            style={styles.sectionGap}
          />
          <Card style={styles.ordersCard}>
            {orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={t('No attributed orders yet')}
                text={t('Share your code. Orders placed with it will show up here.')}
              />
            ) : (
              orders
                .slice(0, RECENT_LIMIT)
                .map((item, index, list) => (
                  <AttributedOrderRow key={item.key} item={item} last={index === list.length - 1} />
                ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: TAB_BAR_SPACE},
  body: {paddingHorizontal: 14, paddingTop: 18},
  alert: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
  },
  alertText: {flex: 1, fontFamily: FONTS.Medium, fontSize: 12.5, color: COLORS.danger, lineHeight: 18},
  stats: {flexDirection: 'row', gap: 8},
  referralCard: {marginTop: 14},
  sectionGap: {marginTop: 22},
  ordersCard: {paddingVertical: 2},
});

export default AffiliateHome;
