/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatePickerModal } from 'react-native-paper-dates';
import { Trophy, ImagePlus, Upload, X, Calendar } from 'lucide-react-native';
import { CartContext, LoadContext, UserContext } from '../../../App';
import { ApiFormData, GetApi, Post } from '../../Assets/Helpers/Service';
import { FONTS } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';
import DriverHeader from '../../Assets/Component/DriverHeader';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import {
  buildRewardCartItem,
  cartQtyForProduct,
  cartRewardPoints,
  getAvailableStock,
  rewardCartId,
  rewardLimitError,
  rewardProductImage,
} from '../../Assets/Helpers/rewardCart';

const TABS = [
  { key: 'redeem', label: 'Redeem' },
  { key: 'status', label: 'My Status' },
  { key: 'upload', label: 'Upload' },
];

const C = {
  bg: '#F7F8F5',
  green: '#14532D',
  button: '#1E7B45',
  gold: '#B8862B',
  orange: '#F28020',
  red: '#E3062A',
  grey: '#6B7280',
  lightGrey: '#9CA3AF',
  border: '#E5E7EB',
  chip: '#E9EEF5',
  earn: '#1E9E4A',
};

const fmt = n => Number(n || 0).toLocaleString();

const Rewards = () => {
  const { t } = useTranslation();
  const [user] = useContext(UserContext);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [, setLoading] = useContext(LoadContext);
  const isLoggedIn = !!(user?._id && user?.token);
  const isVi = i18n.language === 'vi';

  const [tab, setTab] = useState('redeem');
  const [summary, setSummary] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [banner, setBanner] = useState({ image: null, link: null });
  const [selected, setSelected] = useState(null);

  const loadSummary = () => {
    if (!isLoggedIn) return;
    GetApi('rewards/summary', {}).then(
      res => setSummary(res?.data || null),
      err => Toast.show({ type: 'error', text1: err?.message }),
    );
  };

  const loadCatalog = () => {
    GetApi('rewards/catalog', {})
      .then(res => setCatalog(Array.isArray(res?.data) ? res.data : []))
      .catch(err => Toast.show({ type: 'error', text1: err?.message }))
      .finally(() => setCatalogLoaded(true));
  };

  useEffect(() => {
    // Banner is optional (admin-set); keep the default store photo on any failure
    GetApi('rewards/banner', {})
      .then(res => setBanner({ image: res?.data?.image || null, link: res?.data?.link || null }))
      .catch(() => {});
  }, []);

  // Points and stock change after every order, so refresh whenever the tab is shown
  useFocusEffect(
    useCallback(() => {
      loadCatalog();
      loadSummary();
    }, [isLoggedIn]),
  );

  const pointsInCart = useMemo(() => cartRewardPoints(cartdetail), [cartdetail]);
  const spendable = Math.max((summary?.available || 0) - pointsInCart, 0);

  const rewardState = reward => {
    const inCart = cartdetail.some(c => c.productid === rewardCartId(reward._id));
    const used = summary?.usageByPoint?.[reward._id] || 0;
    if (inCart) return { disabled: true, label: t('In your cart') };
    if (!reward.inStock) return { disabled: true, label: t('Out of stock') };
    if (reward.remainingTotal === 0) return { disabled: true, label: t('Fully redeemed') };
    if (reward.perUserLimit && used >= reward.perUserLimit) {
      return { disabled: true, label: t('Limit reached') };
    }
    if (isLoggedIn && summary && reward.points > spendable) {
      return { disabled: true, label: `${t('Need')} ${fmt(reward.points - spendable)} ${t('more pts')}` };
    }
    return { disabled: false, label: t('Redeem award') };
  };

  const groups = useMemo(() => {
    const map = new Map();
    catalog.forEach(reward => {
      const lower = Math.floor(reward.points / 100) * 100;
      if (!map.has(lower)) map.set(lower, []);
      map.get(lower).push(reward);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [catalog]);

  const rewardName = reward =>
    isVi ? reward?.product?.vietnamiesName || reward?.product?.name : reward?.product?.name;

  const onRedeemClick = reward => {
    if (!isLoggedIn) {
      Toast.show({ type: 'error', text1: t('Please sign in to redeem rewards.') });
      navigate('Auth');
      return;
    }
    setSelected(reward);
  };

  const addRewardToCart = async () => {
    if (!selected) return;
    if (rewardState(selected).disabled) {
      setSelected(null);
      return;
    }

    // Same stock check as normal items, counting units of this product already in the cart
    try {
      setLoading(true);
      const stock = await getAvailableStock(selected.product._id);
      if (cartQtyForProduct(cartdetail, selected.product._id) + 1 > stock) {
        Toast.show({
          type: 'error',
          text1:
            stock > 0
              ? t('Item is not available in this quantity in stock. Please choose a different item.')
              : t('This item is currently out of stock. Please choose a different item.'),
        });
        setSelected(null);
        return;
      }
      const limitError = rewardLimitError({ ...selected, qtyInCart: 0 }, summary, cartdetail, t);
      if (limitError) {
        Toast.show({ type: 'error', text1: limitError });
        setSelected(null);
        return;
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message });
      return;
    } finally {
      setLoading(false);
    }

    const next = [...cartdetail, buildRewardCartItem(selected)];
    setcartdetail(next);
    await AsyncStorage.setItem('cartdata', JSON.stringify(next));
    setSelected(null);
    Toast.show({ type: 'success', text1: t('Reward added to cart') });
  };

  return (
    <View style={styles.container}>
      <DriverHeader item={t('Rewards')} showCart={true} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(x => (
            <TouchableOpacity key={x.key} style={styles.tabBtn} onPress={() => setTab(x.key)}>
              <Text style={[styles.tabTxt, tab === x.key && styles.tabTxtActive]}>{t(x.label)}</Text>
              <View style={[styles.tabLine, tab === x.key && { backgroundColor: C.green }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Points header */}
        <View style={styles.header}>
          <Trophy color={C.gold} size={44} strokeWidth={1.6} />
          <Text style={styles.storeName}>Bách Hoá Houston</Text>
          <Text style={styles.tier}>
            {summary?.tier ? t(`${summary.tier.name.toUpperCase()} MEMBER`) : t('REWARDS MEMBER')}
          </Text>
          {isLoggedIn ? (
            <>
              <Text style={styles.points}>{summary ? fmt(summary.available) : '—'}</Text>
              <Text style={styles.pointsLabel}>{t('Available Points')}</Text>
              {(summary?.pending > 0 || pointsInCart > 0) && (
                <Text style={styles.note}>
                  {pointsInCart > 0 && `${fmt(pointsInCart)} ${t('pts in your cart')}`}
                  {pointsInCart > 0 && summary?.pending > 0 && ' · '}
                  {summary?.pending > 0 && `${fmt(summary.pending)} ${t('pts on hold for an unpaid checkout')}`}
                </Text>
              )}
              {summary?.awaitingPoints > 0 && (
                <Text style={[styles.note, { color: C.earn }]}>
                  +{fmt(summary.awaitingPoints)} {t('pts coming when your orders are completed or delivered')}
                </Text>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={[styles.note, { fontSize: 14, maxWidth: 300 }]}>
                {t('Earn 10 points for every $1 you spend. Sign in to see your points.')}
              </Text>
              <TouchableOpacity style={styles.signInBtn} onPress={() => navigate('Auth')}>
                <Text style={styles.signInTxt}>{t('Sign in')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {tab === 'redeem' && (
          <RedeemTab
            t={t}
            groups={groups}
            banner={banner}
            catalogLoaded={catalogLoaded}
            rewardName={rewardName}
            rewardState={rewardState}
            onRedeemClick={onRedeemClick}
          />
        )}
        {tab === 'status' && <StatusTab t={t} isVi={isVi} isLoggedIn={isLoggedIn} summary={summary} />}
        {tab === 'upload' && (
          <UploadTab t={t} isLoggedIn={isLoggedIn} setLoading={setLoading} onUploaded={loadSummary} />
        )}
      </ScrollView>

      {/* Redeem bottom sheet */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {selected && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Image
                    source={{ uri: rewardProductImage(selected.product) }}
                    style={{ width: 72, height: 72 }}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetName}>{rewardName(selected)}</Text>
                    <Text style={styles.cardPoints}>
                      {fmt(selected.points)} {t('points')}
                    </Text>
                    {!!selected.perUserLimit && (
                      <Text style={styles.smallGrey}>
                        {t('Limit')} {selected.perUserLimit} {t('per customer')}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.smallGrey, { marginTop: 14 }]}>
                  {t('Rewards are free with any purchase. Points are used when you place your order.')}
                </Text>
                <TouchableOpacity style={styles.addBtn} onPress={addRewardToCart}>
                  <Text style={styles.addTxt}>{t('Add to cart')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.cancelTxt}>{t('Cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const RedeemTab = ({ t, groups, banner, catalogLoaded, rewardName, rewardState, onRedeemClick }) => {
  const shopNow = () => {
    const link = banner?.link;
    if (link && /^https?:\/\//.test(link)) Linking.openURL(link);
    else navigate('App', { screen: 'Home' });
  };

  return (
    <View style={{ paddingHorizontal: 14 }}>
      {/* Store banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerTxt}>{t('Visit')}</Text>
          <Text style={styles.bannerTxt}>Bách Hoá</Text>
          <Text style={[styles.bannerTxt, { color: C.orange }]}>Houston</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={shopNow}>
            <Text style={styles.shopTxt}>{t('Shop now')} →</Text>
          </TouchableOpacity>
        </View>
        <ImageBackground
          // Admin-uploaded banner (Admin → Points → Banner), else the bundled store photo
          source={banner?.image ? { uri: banner.image } : require('../../Assets/Images/store.jpg')}
          style={{ flex: 3 }}
          resizeMode="cover"
        />
      </View>

      {catalogLoaded && groups.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 50 }}>
          <Text style={[styles.cardName, { color: C.grey }]}>{t('No rewards available right now.')}</Text>
          <Text style={styles.smallGrey}>{t('Keep shopping to earn points — new rewards are coming soon.')}</Text>
        </View>
      )}

      {groups.map(([lower, rewards]) => (
        <View key={lower} style={{ marginTop: 20 }}>
          <Text style={styles.groupTitle}>
            {fmt(lower)} - {fmt(lower + 99)} {t('Points')}
          </Text>
          <View style={styles.grid}>
            {rewards.map(reward => {
              const state = rewardState(reward);
              return (
                <View key={reward._id} style={styles.card}>
                  <Image
                    source={{ uri: rewardProductImage(reward.product) }}
                    style={{ width: '100%', height: 90 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.cardName} numberOfLines={2}>
                    {rewardName(reward)}
                  </Text>
                  <Text style={styles.cardPoints}>
                    {fmt(reward.points)} {t('points')}
                  </Text>
                  <TouchableOpacity
                    disabled={state.disabled}
                    onPress={() => onRedeemClick(reward)}
                    style={[styles.redeemBtn, state.disabled && { backgroundColor: '#E5E7EB' }]}>
                    <Text
                      numberOfLines={1}
                      style={[styles.redeemTxt, state.disabled && { color: C.grey, fontSize: 12 }]}>
                      {state.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const StatusTab = ({ t, isVi, isLoggedIn, summary }) => {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    GetApi('rewards/history', {})
      .then(res => setHistory(Array.isArray(res?.data) ? res.data : []))
      .catch(err => Toast.show({ type: 'error', text1: err?.message }))
      .finally(() => setLoaded(true));
  }, [isLoggedIn]);

  if (!isLoggedIn) return <SignInPrompt t={t} />;

  const stats = [
    { label: t('Total earned'), value: summary?.earned },
    { label: t('Redeemed'), value: summary?.redeemed },
    { label: t('On hold'), value: summary?.pending },
    {
      label: t('Total spent'),
      value: summary
        ? `$${Number(summary.lifetimeSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : undefined,
    },
  ];

  const entryTitle = h => {
    if (h.type === 'earn') return `${t('Order')} ${h.orderId}`;
    if (h.type === 'redeem') {
      const name = isVi ? h.product?.vietnamiesName || h.product?.name : h.product?.name;
      return `${t('Redeemed')} ${name || t('reward')}${h.qty > 1 ? ` ×${h.qty}` : ''}`;
    }
    return t('Receipt upload');
  };

  const entrySubtitle = h => {
    const date = moment(h.date).format('MMM D, YYYY');
    if (h.type === 'earn') {
      return `${date} · $${Number(h.amount).toFixed(2)} ${t('spent')}${h.tier ? ` · ${t(h.tier)} ×${h.pointsPerDollar}` : ''}`;
    }
    if (h.type === 'redeem') {
      return `${date} · ${t('Order')} ${h.orderId}${h.pending ? ` · ${t('awaiting payment')}` : ''}`;
    }
    const statusText = { pending: t('Under review'), approved: t('Approved'), rejected: t('Rejected') }[h.status];
    return `${date} · ${statusText}${h.adminNote ? ` · ${h.adminNote}` : ''}`;
  };

  const tier = summary?.tier;
  const nextMin = tier?.nextTier?.minPoints;
  const currentMin = summary?.tiers?.find(x => x.key === tier?.key)?.minPoints || 0;
  const progress = nextMin
    ? Math.max(Math.min(((tier.qualifyingPoints - currentMin) / (nextMin - currentMin)) * 100, 100), 0)
    : 100;
  const formatTierDate = ymd => (ymd ? moment(ymd, 'YYYY-MM-DD').format('MMM D, YYYY') : '');

  return (
    <View style={{ paddingHorizontal: 14, gap: 16, marginTop: 8 }}>
      {tier && (
        <View style={styles.panel}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <View>
              <Text style={styles.smallGrey}>{t('Your tier')}</Text>
              <Text style={styles.tierName}>{t(tier.name)}</Text>
              {!!tier.validThrough && (
                <Text style={styles.smallGrey}>
                  {t('Valid through')} {formatTierDate(tier.validThrough)}
                </Text>
              )}
            </View>
            <View style={styles.rateChip}>
              <Text style={styles.rateChipTxt}>
                $1 = {tier.pointsPerDollar} {t('points')}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.smallGrey}>
                {tier.year} {t('tier points')}: <Text style={{ color: '#111', fontFamily: FONTS.SemiBold }}>{fmt(tier.qualifyingPoints)}</Text>
              </Text>
              {tier.nextTier && (
                <Text style={styles.smallGrey}>
                  {fmt(nextMin)} → {t(tier.nextTier.name)}
                </Text>
              )}
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={[styles.body, { marginTop: 8 }]}>
              {tier.nextTier
                ? `${fmt(tier.pointsToNextTier)} ${t('more tier points to reach')} ${t(tier.nextTier.name)} ($1 = ${tier.nextTier.pointsPerDollar} ${t('points')})`
                : t("You've reached our highest tier!")}
            </Text>
            {tier.source === 'carried' && tier.pointsToKeepTier > 0 && (
              <Text style={[styles.body, { color: C.green, marginTop: 4 }]}>
                {`${t('You earned')} ${t(tier.name)} ${t('in')} ${tier.carriedFromYear}. ${t('Earn')} ${fmt(tier.pointsToKeepTier)} ${t('more tier points in')} ${tier.year} ${t('to keep it through')} ${tier.year + 1}.`}
              </Text>
            )}
            <Text style={[styles.smallGrey, { fontSize: 11, marginTop: 4 }]}>
              {t('A tier you reach is kept through the end of the next calendar year. Tier points restart every January 1.')}
            </Text>
          </View>

          <View style={[styles.grid, { marginTop: 14 }]}>
            {(summary.tiers || []).map((x, idx, all) => (
              <View
                key={x.key}
                style={[styles.tierBox, x.key === tier.key && { borderColor: C.green, backgroundColor: '#EEF6F0' }]}>
                <Text style={[styles.cardName, { marginTop: 0 }]}>{t(x.name)}</Text>
                <Text style={styles.smallGrey}>
                  {all[idx + 1] ? `${fmt(x.minPoints)} – ${fmt(all[idx + 1].minPoints - 1)}` : `${fmt(x.minPoints)}+`}
                </Text>
                <Text style={[styles.body, { fontFamily: FONTS.SemiBold }]}>$1 = {x.pointsPerDollar}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.grid}>
        {stats.map(s => (
          <View key={s.label} style={[styles.panel, styles.statBox]}>
            <Text style={styles.statValue}>
              {s.value === undefined || s.value === null ? '—' : typeof s.value === 'number' ? fmt(s.value) : s.value}
            </Text>
            <Text style={styles.smallGrey}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('How it works')}</Text>
        <Text style={styles.body}>
          {t('Earn points on completed or delivered orders and approved in-store receipts: Loyal $1 = 10, Silver $1 = 11, Gold $1 = 12, Diamond $1 = 13 points.')}
        </Text>
        <Text style={[styles.body, { marginTop: 4 }]}>
          {t('Reward points never expire. Tier points are the points you earn each calendar year — they restart on January 1, and a tier you reach is kept through the end of the next year.')}
        </Text>
        <Text style={[styles.body, { marginTop: 4 }]}>{t("Refunded amounts and cancelled orders don't earn points.")}</Text>
      </View>

      <View style={[styles.panel, { paddingHorizontal: 0 }]}>
        <Text style={[styles.panelTitle, { paddingHorizontal: 14 }]}>{t('Points history')}</Text>
        {loaded && history.length === 0 && (
          <Text style={[styles.smallGrey, { textAlign: 'center', paddingVertical: 30 }]}>{t('No points activity yet.')}</Text>
        )}
        {history.map((h, idx) => (
          <View key={idx} style={[styles.row, idx > 0 && styles.rowDivider]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{entryTitle(h)}</Text>
              <Text style={styles.smallGrey} numberOfLines={1}>{entrySubtitle(h)}</Text>
            </View>
            <Text
              style={[
                styles.rowPoints,
                { color: h.points > 0 ? C.earn : h.points < 0 ? C.red : C.lightGrey },
              ]}>
              {h.points > 0 ? '+' : ''}
              {fmt(h.points)} {t('pts')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const emptyForm = { image: '', amount: '', purchaseDate: '', note: '' };

const UploadTab = ({ t, isLoggedIn, setLoading, onUploaded }) => {
  const [form, setForm] = useState(emptyForm);
  const [receipts, setReceipts] = useState([]);
  const [dateOpen, setDateOpen] = useState(false);
  const cameraRef = useRef(null);

  const loadReceipts = () => {
    GetApi('rewards/my-receipts', {}).then(
      res => setReceipts(Array.isArray(res?.data) ? res.data : []),
      () => {},
    );
  };

  useEffect(() => {
    if (isLoggedIn) loadReceipts();
  }, [isLoggedIn]);

  if (!isLoggedIn) return <SignInPrompt t={t} />;

  const getImageValue = img => {
    const asset = img?.assets?.[0];
    if (!asset) return;
    setLoading(true);
    ApiFormData(asset)
      .then(
        res => {
          if (res?.status && res?.data?.file) setForm(f => ({ ...f, image: res.data.file }));
          else Toast.show({ type: 'error', text1: t('Upload failed') });
        },
        err => Toast.show({ type: 'error', text1: err?.message || t('Upload failed') }),
      )
      .finally(() => setLoading(false));
  };

  const submit = () => {
    if (!form.image) {
      Toast.show({ type: 'error', text1: t('Please upload a receipt image.') });
      return;
    }
    setLoading(true);
    Post('rewards/receipt', form, {}).then(
      res => {
        setLoading(false);
        if (res?.status === false) {
          Toast.show({ type: 'error', text1: res?.message || t('Upload failed') });
          return;
        }
        Toast.show({ type: 'success', text1: res?.data?.message || t('Receipt uploaded') });
        setForm(emptyForm);
        loadReceipts();
        onUploaded?.();
      },
      err => {
        setLoading(false);
        Toast.show({ type: 'error', text1: err?.message });
      },
    );
  };

  const statusStyle = {
    pending: { bg: '#FEFCE8', fg: '#A16207', border: '#FEF08A' },
    approved: { bg: '#F0FDF4', fg: '#15803D', border: '#BBF7D0' },
    rejected: { bg: '#FEF2F2', fg: '#DC2626', border: '#FECACA' },
  };
  const statusText = { pending: t('Under review'), approved: t('Approved'), rejected: t('Rejected') };

  return (
    <View style={{ paddingHorizontal: 14, gap: 16, marginTop: 8 }}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('Upload an in-store receipt')}</Text>
        <Text style={styles.body}>
          {t("Shopped in store? Upload your receipt and we'll add points at your tier rate once it's reviewed.")}
        </Text>

        {form.image ? (
          <View style={{ marginTop: 14 }}>
            <Image source={{ uri: form.image }} style={styles.receiptPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.removeImg} onPress={() => setForm({ ...form, image: '' })}>
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.dropzone} onPress={() => cameraRef.current?.show()}>
            <ImagePlus color={C.green} size={36} />
            <Text style={[styles.body, { fontFamily: FONTS.Medium }]}>{t('Tap to choose a receipt photo')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>{t('Receipt total ($)')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={C.lightGrey}
          value={form.amount}
          onChangeText={v => /^\d{0,5}(\.\d{0,2})?$/.test(v) && setForm({ ...form, amount: v })}
        />

        <Text style={styles.label}>{t('Purchase date')}</Text>
        <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={() => setDateOpen(true)}>
          <Text style={{ color: form.purchaseDate ? '#111' : C.lightGrey, fontFamily: FONTS.Regular }}>
            {form.purchaseDate ? moment(form.purchaseDate, 'YYYY-MM-DD').format('MMM D, YYYY') : t('Select date')}
          </Text>
          <Calendar size={18} color={C.grey} />
        </TouchableOpacity>

        <Text style={styles.label}>{t('Note (optional)')}</Text>
        <TextInput
          style={styles.input}
          value={form.note}
          onChangeText={v => setForm({ ...form, note: v })}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Upload size={18} color="#fff" />
          <Text style={styles.addTxt}>{t('Submit receipt')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.panel, { paddingHorizontal: 0 }]}>
        <Text style={[styles.panelTitle, { paddingHorizontal: 14 }]}>{t('My receipts')}</Text>
        {receipts.length === 0 && (
          <Text style={[styles.smallGrey, { textAlign: 'center', paddingVertical: 24 }]}>{t('No receipts uploaded yet.')}</Text>
        )}
        {receipts.map((r, idx) => (
          <View key={r._id} style={[styles.row, idx > 0 && styles.rowDivider]}>
            <TouchableOpacity onPress={() => Linking.openURL(r.image)}>
              <Image source={{ uri: r.image }} style={styles.receiptThumb} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {moment(r.createdAt).format('MMM D, YYYY')}
                {r.amount !== undefined && r.amount !== null && ` · $${Number(r.amount).toFixed(2)}`}
              </Text>
              {!!r.adminNote && <Text style={styles.smallGrey} numberOfLines={1}>{r.adminNote}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: statusStyle[r.status]?.bg, borderColor: statusStyle[r.status]?.border },
                ]}>
                <Text style={[styles.badgeTxt, { color: statusStyle[r.status]?.fg }]}>{statusText[r.status]}</Text>
              </View>
              {r.status === 'approved' && (
                <Text style={[styles.badgeTxt, { color: C.earn }]}>
                  +{r.approvedPoints} {t('pts')}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={dateOpen}
        onDismiss={() => setDateOpen(false)}
        date={form.purchaseDate ? moment(form.purchaseDate, 'YYYY-MM-DD').toDate() : new Date()}
        validRange={{ endDate: new Date() }}
        onConfirm={({ date }) => {
          setDateOpen(false);
          if (date) setForm(f => ({ ...f, purchaseDate: moment(date).format('YYYY-MM-DD') }));
        }}
        presentationStyle="pageSheet"
      />
      <CameraGalleryPeacker
        refs={cameraRef}
        getImageValue={getImageValue}
        base64={false}
        width={1600}
        height={1600}
        quality={0.7}
        cancel={() => cameraRef.current?.hide()}
      />
    </View>
  );
};

const SignInPrompt = ({ t }) => (
  <View style={[styles.panel, { marginHorizontal: 14, marginTop: 16, alignItems: 'center', padding: 24 }]}>
    <Text style={[styles.body, { textAlign: 'center' }]}>
      {t('Sign in to see your points activity and upload receipts.')}
    </Text>
    <TouchableOpacity style={styles.signInBtn} onPress={() => navigate('Auth')}>
      <Text style={styles.signInTxt}>{t('Sign in')}</Text>
    </TouchableOpacity>
  </View>
);

export default Rewards;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tabs: { flexDirection: 'row', paddingTop: 14 },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabTxt: { fontFamily: FONTS.Medium, fontSize: 15, color: C.grey },
  tabTxtActive: { fontFamily: FONTS.SemiBold, color: C.green },
  tabLine: { marginTop: 6, height: 3, width: 80, borderRadius: 2, backgroundColor: 'transparent' },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 16, paddingHorizontal: 16 },
  storeName: { fontFamily: FONTS.Medium, fontSize: 15, color: C.green, marginTop: 6 },
  tier: { fontFamily: FONTS.SemiBold, fontSize: 13, color: C.gold, letterSpacing: 3, marginTop: 2 },
  points: { fontFamily: FONTS.Bold, fontSize: 56, color: C.green, lineHeight: 68, marginTop: 4 },
  pointsLabel: { fontFamily: FONTS.Medium, fontSize: 15, color: '#374151' },
  note: { fontFamily: FONTS.Regular, fontSize: 12, color: C.grey, marginTop: 4, textAlign: 'center' },
  signInBtn: { backgroundColor: C.button, borderRadius: 30, paddingHorizontal: 32, paddingVertical: 10, marginTop: 12 },
  signInTxt: { color: '#fff', fontFamily: FONTS.SemiBold, fontSize: 15 },
  banner: {
    flexDirection: 'row',
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bannerLeft: { flex: 2, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#F2F9F1' },
  bannerTxt: { fontFamily: FONTS.Bold, fontSize: 20, lineHeight: 25, color: C.green },
  shopBtn: { alignSelf: 'flex-start', backgroundColor: C.red, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  shopTxt: { color: '#fff', fontFamily: FONTS.SemiBold, fontSize: 13 },
  groupTitle: { fontFamily: FONTS.Bold, fontSize: 19, color: C.green, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    alignItems: 'center',
  },
  cardName: { fontFamily: FONTS.SemiBold, fontSize: 14, color: C.green, textAlign: 'center', marginTop: 6, minHeight: 20 },
  cardPoints: { fontFamily: FONTS.Regular, fontSize: 13, color: C.grey },
  redeemBtn: { marginTop: 8, width: '100%', backgroundColor: C.button, borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  redeemTxt: { color: '#fff', fontFamily: FONTS.SemiBold, fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34 },
  sheetHandle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: '#D1D5DB', marginBottom: 14 },
  sheetName: { fontFamily: FONTS.SemiBold, fontSize: 18, color: C.green },
  smallGrey: { fontFamily: FONTS.Regular, fontSize: 12, color: C.grey },
  addBtn: { marginTop: 16, backgroundColor: C.red, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  addTxt: { color: '#fff', fontFamily: FONTS.SemiBold, fontSize: 17 },
  cancelBtn: { marginTop: 10, backgroundColor: C.chip, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  cancelTxt: { color: C.green, fontFamily: FONTS.SemiBold, fontSize: 17 },
  panel: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  panelTitle: { fontFamily: FONTS.SemiBold, fontSize: 15, color: C.green, marginBottom: 6 },
  body: { fontFamily: FONTS.Regular, fontSize: 13, color: '#4B5563' },
  tierName: { fontFamily: FONTS.Bold, fontSize: 24, color: C.green },
  rateChip: { backgroundColor: C.green, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  rateChipTxt: { color: '#fff', fontFamily: FONTS.SemiBold, fontSize: 13 },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: C.chip, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: C.green },
  tierBox: { width: '48.5%', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10, alignItems: 'center' },
  statBox: { width: '48.5%', alignItems: 'center' },
  statValue: { fontFamily: FONTS.Bold, fontSize: 22, color: C.green },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rowTitle: { fontFamily: FONTS.Medium, fontSize: 14, color: '#1F2937' },
  rowPoints: { fontFamily: FONTS.Bold, fontSize: 14 },
  dropzone: {
    marginTop: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  receiptPreview: { width: '100%', height: 240, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#F9FAFB' },
  removeImg: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14, padding: 4 },
  label: { fontFamily: FONTS.Medium, fontSize: 13, color: '#374151', marginTop: 14, marginBottom: 4 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111',
    fontFamily: FONTS.Regular,
  },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: {
    marginTop: 18,
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  receiptThumb: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontFamily: FONTS.SemiBold, fontSize: 11 },
});
