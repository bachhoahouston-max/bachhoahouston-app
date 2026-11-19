import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Building2, Clock, Eye, Globe, Mail, MapPin, Phone, Star, Tag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { UserContext } from '../../../../App';
import DriverHeader from '../../../Assets/Component/DriverHeader';
import { GetApi, Post } from '../../../Assets/Helpers/Service';
import { exploreColors, exploreStyles, StoreImage, StoreNotice } from './components';
import StoreCommunity from './StoreCommunity';
import { formatStoreHours, getStoreOpenStatus, localizedStoreText, readStoreResponse } from './storeDirectory';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function websiteLink(website) {
  const address = website?.trim();
  if (!address) return undefined;
  if (/^https?:\/\//i.test(address)) return address;
  return /^[\w-]+(?:\.[\w-]+)+(?:[/?#]|$)/.test(address) ? `https://${address}` : undefined;
}

function OpeningHours({ hours, today }) {
  const { t } = useTranslation();

  return (
    <View style={[styles.infoBox, styles.hoursBox]}>
      <View style={styles.infoLabelRow}>
        <Clock size={16} color={exploreColors.green} />
        <Text style={[exploreStyles.semibold, styles.infoLabel]}>{t('Opening hours')}</Text>
      </View>
      {[1, 2, 3, 4, 5, 6, 0].map(day => {
        const range = formatStoreHours(hours.find(entry => entry.day === day));
        const style = [exploreStyles.text, styles.hoursText, day === today && exploreStyles.semibold];
        return (
          <View key={day} style={styles.hoursLine}>
            <Text style={style}>{t(weekdays[day])}</Text>
            <Text style={[style, styles.hoursTime]}>{range || t('Closed')}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ContactDetails({ store, twoColumns }) {
  const { t } = useTranslation();
  const dialNumber = store.phone?.replace(/[^\d+]/g, '');
  const details = [
    { label: t('Address'), value: store.address, icon: MapPin },
    { label: t('Phone'), value: store.phone, icon: Phone, url: dialNumber && `tel:${dialNumber}` },
    { label: t('Email'), value: store.email, icon: Mail, url: store.email && `mailto:${store.email}` },
    { label: t('Website'), value: store.website, icon: Globe, url: websiteLink(store.website) },
    { label: t('City'), value: store.city, icon: Building2 },
    { label: t('Company'), value: store.companyName, icon: Building2 },
  ].filter(detail => detail.value);

  const openLink = async url => {
    try {
      await Linking.openURL(url);
    } catch {
      Toast.show({ type: 'error', text1: t('Unable to open link') });
    }
  };

  if (!details.length) return null;

  return (
    <View style={[styles.contactGrid, twoColumns && styles.contactColumns]}>
      {details.map(({ label, value, icon: Icon, url }) => (
        <View key={label} style={[styles.infoBox, twoColumns && styles.contactTile]}>
          <View style={styles.infoLabelRow}>
            <Icon size={16} color={exploreColors.green} />
            <Text style={[exploreStyles.semibold, styles.infoLabel]}>{label}</Text>
          </View>
          {url ? (
            <Pressable accessibilityRole="link" onPress={() => openLink(url)}>
              <Text style={[exploreStyles.text, styles.infoValue]}>{value}</Text>
            </Pressable>
          ) : <Text style={[exploreStyles.text, styles.infoValue]}>{value}</Text>}
        </View>
      ))}
    </View>
  );
}

function StoreOverview({ store, wide, twoColumns }) {
  const { t, i18n } = useTranslation();
  const title = localizedStoreText(store.title, store.title_v, i18n.language) || t('Store details');
  const description = localizedStoreText(store.shortDescription, store.shortDescription_v, i18n.language);
  const category = localizedStoreText(store.category?.name, store.category?.v_name, i18n.language);
  const openStatus = getStoreOpenStatus(store);
  const statusColor = openStatus?.isOpen ? exploreColors.open : exploreColors.closed;
  const reviewCount = Number(store.reviewCount || 0);

  return (
    <View style={styles.overview}>
      <StoreImage url={store.image} icon={Tag} size={88} strokeWidth={1.2} style={[styles.hero, wide && styles.wideHero]} />
      {category ? <Text style={[exploreStyles.semibold, styles.category]}>{category}</Text> : null}
      <View style={[styles.overviewContent, wide && styles.wideOverviewContent]}>
        <Text accessibilityRole="header" style={[exploreStyles.bold, styles.title, wide && styles.wideTitle]}>{title}</Text>
        {description ? <Text style={[exploreStyles.text, styles.description]}>{description}</Text> : null}
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Eye size={18} color={exploreColors.green} />
            <Text style={[exploreStyles.text, exploreStyles.medium, styles.metricText]}>{store.viewCount || 0} {t('views')}</Text>
          </View>
          <View style={styles.metric}>
            <Star size={18} color={exploreColors.amber} fill={exploreColors.amber} />
            <Text style={[exploreStyles.semibold, styles.metricText, styles.rating]}>
              {Number(store.averageRating || 0).toFixed(1)} ({reviewCount} {t('reviews', { count: reviewCount })})
            </Text>
          </View>
          {openStatus && (
            <View style={styles.metric}>
              <Clock size={18} color={statusColor} />
              <Text style={[exploreStyles.semibold, styles.metricText, { color: statusColor }]}>
                {openStatus.isOpen ? t('Open') : t('Closed')}
              </Text>
            </View>
          )}
        </View>
        {openStatus && <OpeningHours hours={store.openingHours} today={openStatus.todayHours?.day} />}
        <ContactDetails store={store} twoColumns={twoColumns} />
      </View>
    </View>
  );
}

const loadMessages = {
  hidden: 'Explore Houston is unavailable',
  missing: 'Store not found',
  error: 'Unable to load store',
};

export default function ExploreHoustonStore({ navigation, route }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [user] = useContext(UserContext);
  const storeId = route.params?.storeId;
  const wide = width >= 768;
  const [store, setStore] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [retry, setRetry] = useState(0);
  const viewRecordedFor = useRef(null);

  useEffect(() => {
    if (!storeId) {
      setLoadState('missing');
      return;
    }

    let active = true;
    const id = encodeURIComponent(storeId);
    async function loadStore() {
      try {
        const data = readStoreResponse(await GetApi(`getStoreById/${id}`));
        if (!active) return;
        if (!data?._id) {
          setLoadState('missing');
          return;
        }
        setStore(data);
        setLoadState('ready');

        if (viewRecordedFor.current !== storeId) {
          viewRecordedFor.current = storeId;
          Post(`recordStoreView/${id}`, {}).then(readStoreResponse).then(view => {
            if (active && Number.isFinite(view?.viewCount)) {
              setStore(current => ({ ...current, viewCount: view.viewCount }));
            }
          }).catch(() => {
            // A failed view count write should not interrupt browsing.
          });
        }
      } catch (error) {
        if (!active) return;
        if (error?.message === 'Store module not found.') {
          setLoadState('hidden');
        } else if (error?.message === 'Store not found.') {
          setLoadState('missing');
        } else {
          setLoadState('error');
        }
      }
    }

    loadStore();
    return () => { active = false; };
  }, [storeId, retry]);

  const refresh = () => {
    setLoadState('loading');
    setRetry(previous => previous + 1);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <DriverHeader item={t('Explore Houston')} showback backAccessibilityLabel={t('Back to stores')} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, wide && styles.wideContent]}>
        {loadState === 'loading' ? <StoreNotice loading /> : loadState === 'ready' ? (
          <>
            <StoreOverview store={store} wide={wide} twoColumns={width >= 640} />
            <StoreCommunity
              key={store._id}
              store={store}
              isLoggedIn={Boolean(user?.token)}
              onSignIn={() => navigation.navigate('Auth', { screen: 'SignIn' })}
              onReviewSummary={({ averageRating, reviewCount }) => {
                setStore(current => ({ ...current, averageRating, reviewCount }));
              }}
              wide={wide}
            />
          </>
        ) : (
          <StoreNotice
            title={t(loadMessages[loadState])}
            description={loadState === 'missing' ? t('Please return to the store list') : undefined}
            onRetry={loadState === 'error' ? refresh : undefined}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 1104, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  wideContent: { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 48 },
  overview: { ...exploreStyles.shadow, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' },
  hero: { height: 256 },
  wideHero: { height: 384 },
  category: {
    ...exploreStyles.shadow,
    position: 'absolute',
    top: 20,
    left: 20,
    maxWidth: '85%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: exploreColors.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  overviewContent: { padding: 24 },
  wideOverviewContent: { padding: 40 },
  title: { fontSize: 30, lineHeight: 36, color: exploreColors.text },
  wideTitle: { fontSize: 36, lineHeight: 40 },
  description: { marginTop: 24, maxWidth: 768, fontSize: 16, lineHeight: 28 },
  metrics: { ...exploreStyles.row, flexWrap: 'wrap', columnGap: 20, rowGap: 8, marginTop: 20 },
  metric: { ...exploreStyles.row, gap: 8 },
  metricText: { color: exploreColors.body, fontSize: 14, lineHeight: 20 },
  rating: { color: exploreColors.amber },
  infoBox: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: exploreColors.lightBorder, backgroundColor: exploreColors.surface },
  infoLabelRow: { ...exploreStyles.row, gap: 8 },
  infoLabel: { color: exploreColors.muted, fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase', flexShrink: 1 },
  infoValue: { marginTop: 8, color: '#1f2937', fontSize: 14, lineHeight: 20 },
  hoursBox: { marginTop: 24, maxWidth: 448, gap: 4 },
  hoursLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  hoursText: { fontSize: 14, lineHeight: 20, flexShrink: 1 },
  hoursTime: { textAlign: 'right' },
  contactGrid: { marginTop: 32, gap: 16 },
  contactColumns: { flexDirection: 'row', flexWrap: 'wrap' },
  contactTile: { width: '48%' },
});
