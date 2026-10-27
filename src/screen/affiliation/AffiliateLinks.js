import React, {useCallback, useState} from 'react';
import {ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {CircleDollarSign, Link2, Plus, Search, Share2} from 'lucide-react-native';
import {GetApi} from '../../Assets/Helpers/Service';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import {TAB_BAR_SPACE} from './components/AffiliateTabBar';
import ProductLinkModal from './components/ProductLinkModal';
import ReferralCard from './components/ReferralCard';
import {Button, Card, EmptyState, SectionHeader, StatCard} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {copyText, displayLink, money, shareProductLink} from './utils';

const PREVIEW_LIMIT = 3;
const TRENDING_LIMIT = 3;

const AffiliateLinks = ({navigation}) => {
  const {t} = useTranslation();
  const {dashboard, refresh} = useAffiliate();
  const [refreshing, setRefreshing] = useState(false);
  const [links, setLinks] = useState([]);
  const [totals, setTotals] = useState({links: 0, revenue: 0});
  const [linksLoading, setLinksLoading] = useState(true);
  const [trending, setTrending] = useState([]);
  const [showAll, setShowAll] = useState(false);
  // {product} links that product straight away; {} opens the product list.
  const [picker, setPicker] = useState(null);

  const application = dashboard?.application || {};
  const suspended = application.status === 'Suspended';
  const canCreate = !suspended && !!application.referralCode;

  const loadLinks = useCallback(
    () =>
      GetApi('affiliation/links', {})
        .then(res => {
          if (res?.status) {
            setLinks(res.data?.links || []);
            setTotals(res.data?.totals || {links: 0, revenue: 0});
          }
        })
        .catch(() => {})
        .finally(() => setLinksLoading(false)),
    [],
  );

  const loadTrending = useCallback(
    () =>
      GetApi(`affiliation/link-products?limit=${TRENDING_LIMIT}`, {})
        .then(res => res?.status && setTrending(res.data?.products || []))
        .catch(() => {}),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadLinks();
      loadTrending();
    }, [loadLinks, loadTrending]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadLinks(), loadTrending()]);
    setRefreshing(false);
  };

  const visibleLinks = showAll ? links : links.slice(0, PREVIEW_LIMIT);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <AffiliateHeader compact inline title={t('My links')} onBack={() => navigation.navigate('AffiliateHome')} />

        <View style={styles.body}>
          <View style={styles.stats}>
            <StatCard icon={Link2} label={t('Active Links')} value={String(totals.links || 0)} />
            <StatCard icon={CircleDollarSign} label={t('Revenue')} value={money(totals.revenue)} />
          </View>

          <ReferralCard
            application={application}
            suspended={suspended}
            rateBadge={t('Storewide')}
            style={styles.sectionGap}
          />

          <Card style={styles.sectionGap}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('Generate Custom Product Link')}</Text>
              <View style={styles.instant}>
                <Text style={styles.instantText}>{t('INSTANT')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pickerField}
              activeOpacity={0.8}
              onPress={() => setPicker({})}
              disabled={!canCreate}>
              <Search size={16} color={COLORS.muted} />
              <Text style={styles.pickerPlaceholder} numberOfLines={1}>{t('Search a product from the shop')}</Text>
              <View style={styles.browse}>
                <Text style={styles.browseText}>{t('Browse')}</Text>
              </View>
            </TouchableOpacity>

            <Button
              label={t('Create Affiliate Link')}
              icon={Plus}
              onPress={() => setPicker({})}
              disabled={!canCreate}
              style={styles.createButton}
            />

            {!!trending.length && (
              <>
                <Text style={styles.overline}>{t('Trending in Houston')}</Text>
                <View style={styles.chips}>
                  {trending.map(product => (
                    <TouchableOpacity
                      key={product._id}
                      style={styles.chip}
                      onPress={() => setPicker({product})}
                      disabled={!canCreate}
                      activeOpacity={0.75}>
                      <Text style={styles.chipText} numberOfLines={1}>+ {product.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </Card>

          <Card style={styles.sectionGap}>
            <SectionHeader
              title={t('Active Links ({{count}})', {count: links.length})}
              actionLabel={links.length > PREVIEW_LIMIT ? (showAll ? t('Show less') : t('View All')) : undefined}
              onAction={() => setShowAll(value => !value)}
              style={styles.linksHeader}
            />
            {linksLoading && !links.length ? (
              <ActivityIndicator style={styles.loader} color={COLORS.primary} />
            ) : links.length === 0 ? (
              <EmptyState
                icon={Link2}
                title={t('No product links yet')}
                text={t('Tap "Create Affiliate Link", pick a product and share the link.')}
              />
            ) : (
              visibleLinks.map(link => (
                <View key={link._id} style={styles.linkCard}>
                  <Text style={styles.linkName} numberOfLines={2}>{link.product?.name || t('Product unavailable')}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>{displayLink(link.url)}</Text>
                  <View style={styles.linkFooter}>
                    <Text style={styles.linkStats}>
                      {t('{{clicks}} clicks • {{orders}} orders', {clicks: link.clicks, orders: link.orders})}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyPill}
                      onPress={() => copyText(link.url, t('Link copied'))}
                      disabled={suspended}>
                      <Text style={styles.copyPillText}>{t('Copy')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => shareProductLink(t, link)}
                      disabled={suspended}
                      hitSlop={10}
                      accessibilityLabel={t('Share')}>
                      <Share2 size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </Card>

          <SectionHeader title={t('How it works')} style={styles.sectionGap} />
          <Card>
            {[
              {title: t('Pick a product'), text: t('Tap "Create Affiliate Link" and choose any product from the shop.')},
              {title: t('Share your link'), text: t('Post the product link or your referral code where your audience shops.')},
              {title: t('Customers order'), text: t('They open your link in the app, or enter your code at checkout.')},
              {title: t('You earn commission'), text: t('Commission is added when the order is completed or delivered.')},
            ].map((step, index, list) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepRail}>
                  <View style={styles.stepDot}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  {index < list.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={[styles.flex, styles.stepBody]}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      <ProductLinkModal
        visible={!!picker}
        initialProduct={picker?.product}
        onClose={() => setPicker(null)}
        onCreated={loadLinks}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: TAB_BAR_SPACE},
  body: {paddingHorizontal: 14, paddingTop: 18},
  flex: {flex: 1},
  stats: {flexDirection: 'row', gap: 10},
  sectionGap: {marginTop: 18},
  cardHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  cardTitle: {flex: 1, fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.text},
  instant: {backgroundColor: COLORS.primarySoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3},
  instantText: {fontFamily: FONTS.Bold, fontSize: 10.5, color: COLORS.primary, letterSpacing: 0.5},
  pickerField: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    height: 46,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerPlaceholder: {flex: 1, fontFamily: FONTS.Regular, fontSize: 13, color: COLORS.muted},
  browse: {backgroundColor: COLORS.neutralSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6},
  browseText: {fontFamily: FONTS.SemiBold, fontSize: 12, color: COLORS.textSecondary},
  createButton: {flex: 0, marginTop: 12},
  overline: {
    fontFamily: FONTS.SemiBold,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  chip: {
    maxWidth: '100%',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {fontFamily: FONTS.Medium, fontSize: 12, color: COLORS.primary},
  linksHeader: {marginBottom: 2},
  loader: {marginVertical: 24},
  linkCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 10,
  },
  linkName: {fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.text},
  linkUrl: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 3},
  linkFooter: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14},
  linkStats: {flex: 1, fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.textSecondary},
  copyPill: {backgroundColor: COLORS.primarySoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5},
  copyPillText: {fontFamily: FONTS.SemiBold, fontSize: 12, color: COLORS.primary},
  step: {flexDirection: 'row'},
  stepRail: {alignItems: 'center', width: 30},
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {fontFamily: FONTS.Bold, fontSize: 13, color: COLORS.white},
  stepLine: {flex: 1, width: 2, backgroundColor: COLORS.primaryBorder, marginVertical: 4},
  stepBody: {paddingLeft: 12, paddingBottom: 16},
  stepTitle: {fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.text},
  stepText: {fontFamily: FONTS.Regular, fontSize: 12.5, color: COLORS.muted, marginTop: 2, lineHeight: 18},
});

export default AffiliateLinks;
