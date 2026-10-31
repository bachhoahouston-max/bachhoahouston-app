
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { Upload, Calendar, ChevronRight, Camera, CheckCircle2, Pencil, Store, ReceiptText } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { CartContext, LoadContext, UserContext } from '../../../App';
import { ApiFormData, GetApi, Post } from '../../Assets/Helpers/Service';
import { FONTS } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';
import DriverHeader from '../../Assets/Component/DriverHeader';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import TierBadge, { tierColor } from '../../Assets/Component/TierBadge';
import TierCrown from '../../Assets/Component/TierCrown';
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
const rewardImageSource = product => {
  const image = rewardProductImage(product);
  return image ? { uri: image } : require('../../Assets/Images/store.jpg');
};

// Four-point sparkle used to decorate the points header.
const Sparkle = ({ size = 16, style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ position: 'absolute' }, style]}>
    <Path d="M12 0 Q13.2 10.8 24 12 Q13.2 13.2 12 24 Q10.8 13.2 0 12 Q10.8 10.8 12 0Z" fill="#F5B82E" />
  </Svg>
);

const Leaf = ({ size = 72, style }) => (
  <Svg
    width={size}
    height={size * 1.6}
    viewBox="0 0 100 160"
    pointerEvents="none"
    style={[{ position: 'absolute' }, style]}>
    <Path d="M50 0 C95 40 95 120 50 160 C5 120 5 40 50 0Z" fill="#2E7D32" />
    <Path d="M50 10 V150" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
  </Svg>
);

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
      .catch(() => { });
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
        <LinearGradient colors={['#E6F3E8', '#F4F8FC']} style={styles.header}>
          <Leaf size={72} style={{ left: -22, top: 22, opacity: 0.08, transform: [{ rotate: '-30deg' }] }} />
          <Leaf size={52} style={{ left: -8, bottom: 0, opacity: 0.06, transform: [{ rotate: '20deg' }] }} />
          <Leaf size={72} style={{ right: -22, top: 6, opacity: 0.08, transform: [{ rotate: '35deg' }] }} />
          <Leaf size={58} style={{ right: -8, bottom: 8, opacity: 0.06, transform: [{ rotate: '-15deg' }] }} />
          <TierCrown tier={summary?.tier} size={72} />
          <View style={styles.tierWrap}>
            <Sparkle size={18} style={{ right: -8, top: -8 }} />
            <Sparkle size={12} style={{ left: -4, top: 20 }} />
            <Text style={styles.tier}>
              {summary?.tier ? t(`${summary.tier.name.toUpperCase()} MEMBER`) : t('REWARDS MEMBER')}
            </Text>
          </View>
          {isLoggedIn ? (
            <>
              <Text style={styles.points}>{summary ? fmt(summary.available) : '—'}</Text>
              <Text style={styles.pointsLabel}>{t('Available Points')}</Text>
              {(summary?.pending > 0 || pointsInCart > 0) && (
                <View style={styles.pillRow}>
                  {pointsInCart > 0 && (
                    <View style={styles.pill}>
                      <Text style={styles.pillTxt}>
                        {fmt(pointsInCart)} {t('pts in your cart')}
                      </Text>
                    </View>
                  )}
                  {summary?.pending > 0 && (
                    <View style={styles.pill}>
                      <Text style={styles.pillTxt}>
                        {fmt(summary.pending)} {t('pts on hold for an unpaid checkout')}
                      </Text>
                    </View>
                  )}
                </View>
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
        </LinearGradient>

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
          <Pressable style={styles.sheet} onPress={() => { }}>
            <View style={styles.sheetHandle} />
            {selected && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Image
                    source={rewardImageSource(selected.product)}
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
  const [bannerRatio, setBannerRatio] = useState(3);

  const shopNow = () => {
    const link = banner?.link;
    if (link && /^https?:\/\//.test(link)) Linking.openURL(link);
    else navigate('App', { screen: 'Home' });
  };

  return (
    <View style={{ paddingHorizontal: 14 }}>
      {/* Store banner — the whole banner is the admin-set image and links to the admin-set page */}
      <TouchableOpacity activeOpacity={0.85} style={styles.banner} onPress={shopNow}>
        <Image
          // Admin-uploaded banner (Admin → Points → Banner), else the bundled store photo
          source={banner?.image ? { uri: banner.image } : require('../../Assets/Images/store.jpg')}
          style={{ width: '100%', aspectRatio: banner?.image ? bannerRatio : 3 }}
          resizeMode="cover"
          onLoad={e => {
            // Show the admin image at its natural proportions, like the web's h-auto
            const { width, height } = e?.nativeEvent?.source || {};
            if (banner?.image && width && height) setBannerRatio(width / height);
          }}
        />
      </TouchableOpacity>

      {catalogLoaded && groups.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 50 }}>
          <Text style={[styles.cardName, { color: C.grey }]}>{t('No rewards available right now.')}</Text>
          <Text style={styles.smallGrey}>{t('Keep shopping to earn points — new rewards are coming soon.')}</Text>
        </View>
      )}

      {groups.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <View style={styles.grid2}>
            {groups.flatMap(([, rewards]) => rewards).map(reward => {
              const state = rewardState(reward);
              return (
                <View key={reward._id} style={styles.card}>
                  <Image
                    source={rewardImageSource(reward.product)}
                    style={{ width: '100%', height: 72 }}
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
                      adjustsFontSizeToFit
                      style={[styles.redeemTxt, state.disabled && { color: C.grey, fontSize: 12 }]}>
                      {state.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
  const tierStyle = tierColor(tier) || { base: '#2E7D32', dark: '#1B5E20' };
  const nextTiers = (summary?.tiers || []).filter(x => x.minPoints > currentMin);

  return (
    <View style={{ paddingHorizontal: 14, gap: 16, marginTop: 8 }}>
      {tier && (
        <View style={[styles.panel, styles.shadow]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.smallGrey, { fontSize: 13 }]}>{t('Your membership')}</Text>
              <Text style={styles.tierName}>{t(tier.name)}</Text>
            </View>
            <View style={[styles.rateChip, { backgroundColor: `${tierStyle.base}22` }]}>
              <TierCrown tier={tier} size={16} />
              <Text style={[styles.rateChipTxt, { color: tierStyle.dark }]}>{t(tier.name)}</Text>
            </View>
          </View>

          <View style={styles.tierProgress}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <Text style={[styles.smallGrey, { color: '#4B5563', flexShrink: 1 }]}>
                {tier.year} {t('tier points')}: <Text style={{ color: '#111', fontFamily: FONTS.SemiBold }}>{fmt(tier.qualifyingPoints)}</Text>
              </Text>
              {tier.nextTier && (
                <Text style={[styles.smallGrey, { color: '#4B5563', flexShrink: 1, textAlign: 'right' }]}>
                  {fmt(nextMin)} {t('points to')} {t(tier.nextTier.name)}
                </Text>
              )}
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={[styles.body, { color: '#1F2937', fontSize: 14, marginTop: 12 }]}>
              {tier.nextTier ? (
                <>
                  <Text style={{ fontFamily: FONTS.Bold }}>{fmt(tier.pointsToNextTier)}</Text> {t('points to reach')}{' '}
                  {t(tier.nextTier.name)}
                </>
              ) : (
                t("You've reached our highest tier!")
              )}
            </Text>
            {tier.source === 'carried' && tier.pointsToKeepTier > 0 && (
              <Text style={[styles.body, { color: C.green, marginTop: 4 }]}>
                {`${t('You earned')} ${t(tier.name)} ${t('in')} ${tier.carriedFromYear}. ${t('Earn')} ${fmt(tier.pointsToKeepTier)} ${t('more tier points in')} ${tier.year} ${t('to keep it through')} ${tier.year + 1}.`}
              </Text>
            )}
          </View>
        </View>
      )}

      {nextTiers.length > 0 && (
        <View style={[styles.panel, styles.shadow]}>
          <Text style={[styles.body, { fontSize: 14, marginBottom: 10 }]}>{t('Next tier benefits')}</Text>
          <View style={{ gap: 8 }}>
            {nextTiers.map(x => (
              <View key={x.key} style={styles.nextTierRow}>
                <TierBadge tier={x} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextTierName}>{t(x.name)}</Text>
                  <Text style={[styles.smallGrey, { fontSize: 13 }]}>
                    {fmt(x.minPoints)} {t('points')} · $1 = {x.pointsPerDollar} {t('points')}
                  </Text>
                </View>
                <ChevronRight color={C.lightGrey} size={20} />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.grid}>
        {stats.map(s => (
          <View key={s.label} style={[styles.panel, styles.statBox]}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {s.value === undefined || s.value === null ? '—' : typeof s.value === 'number' ? fmt(s.value) : s.value}
            </Text>
            <Text style={styles.smallGrey}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('How it works')}</Text>
        <Text style={styles.body}>
          {t('Earn points on completed or delivered orders and approved in-store receipts. For every $1 you spend, you earn points based on your membership tier: Loyal earns 10 points, Silver earns 11 points, Gold earns 12 points, and Diamond earns 13 points.')}
        </Text>
        <Text style={[styles.body, { marginTop: 8 }]}>
          {t('Reward points never expire. Tier points reset on January 1 each year. Once you reach a tier, you keep it through the end of the following year.')}{' '}
          {t('Refunded amounts and canceled orders do not earn points.')}
        </Text>
        <Text style={[styles.body, { marginTop: 8 }]}>
          {t('Bách Hoá Houston reserves the right to modify, suspend, or cancel the Rewards Program at any time, with or without notice.')}
        </Text>
      </View>

      {/* <View style={[styles.panel, { paddingHorizontal: 0 }]}>
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
      </View> */}
    </View>
  );
};

const emptyForm = { image: '', amount: '', purchaseDate: '', storeName: '', receiptNumber: '', note: '' };
const ALL_EDITABLE = { amount: true, purchaseDate: true, storeName: true, receiptNumber: true };

// Read-only value with a pencil "Edit" that turns into an input
const ReviewField = ({ t, icon: Icon, label, value, display, editing, onEdit, children }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.input, styles.reviewBox, editing && { borderColor: C.green }]}>
      {Icon && <Icon size={18} color={C.grey} />}
      {editing ? (
        children
      ) : (
        <>
          <Text style={styles.reviewValue} numberOfLines={1}>
            {display || value || '-'}
          </Text>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Pencil size={14} color={C.button} />
            <Text style={styles.editTxt}>{t('Edit')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
);

const UploadTab = ({ t, isLoggedIn, setLoading, onUploaded }) => {
  const [form, setForm] = useState(emptyForm);
  const [receipts, setReceipts] = useState([]);
  const [scan, setScan] = useState(null); // { status: 'scanning' | 'scanned' | 'manual', ...scan response }
  const [editing, setEditing] = useState({});
  const [dateOpen, setDateOpen] = useState(false);
  const cameraRef = useRef(null);

  const loadReceipts = () => {
    GetApi('rewards/my-receipts', {}).then(
      res => setReceipts(Array.isArray(res?.data) ? res.data : []),
      () => { },
    );
  };

  useEffect(() => {
    if (isLoggedIn) loadReceipts();
  }, [isLoggedIn]);

  if (!isLoggedIn) return <SignInPrompt t={t} />;

  const reset = () => {
    setForm(emptyForm);
    setScan(null);
    setEditing({});
  };

  const runScan = image => {
    setScan({ status: 'scanning' });
    Post('rewards/receipt/scan', { image }, {}).then(
      res => {
        const data = res?.data || {};
        if (!data.scanned) {
          setScan({ status: 'manual', message: data.message || res?.message });
          setEditing(ALL_EDITABLE);
          return;
        }
        const s = data.scan;
        setScan({ status: 'scanned', ...data });
        // Anything the scan couldn't read starts as an input
        setEditing({
          amount: s.subtotal === null,
          purchaseDate: !s.purchaseDate,
          storeName: s.isStoreReceipt === false && !s.storeName,
          receiptNumber: !s.receiptNumber,
        });
        setForm(f => ({
          ...f,
          amount: s.subtotal !== null ? Number(s.subtotal).toFixed(2) : '',
          purchaseDate: s.purchaseDate || '',
          // Our own receipts are the only ones that earn points, so default to our store unless it's clearly another
          storeName: s.storeName || (s.isStoreReceipt === false ? '' : 'Bách Hoá Houston'),
          receiptNumber: s.receiptNumber || '',
        }));
      },
      err => {
        setScan({ status: 'manual', message: err?.message });
        setEditing(ALL_EDITABLE);
      },
    );
  };

  const getImageValue = img => {
    const asset = img?.assets?.[0];
    if (!asset) return;
    setLoading(true);
    ApiFormData(asset)
      .then(
        res => {
          if (res?.status && res?.data?.file) {
            setForm({ ...emptyForm, image: res.data.file });
            setEditing({});
            runScan(res.data.file);
          } else Toast.show({ type: 'error', text1: t('Upload failed') });
        },
        err => Toast.show({ type: 'error', text1: err?.message || t('Upload failed') }),
      )
      .finally(() => setLoading(false));
  };

  const rate = scan?.pointsPerDollar || 10;
  const estimatedPoints =
    form.amount !== '' && Number(form.amount) > 0 ? Math.floor((Math.round(Number(form.amount) * 100) * rate) / 100) : 0;
  const declined = scan?.scan?.paymentStatus === 'declined';
  const notOurStore = scan?.status === 'scanned' && scan.scan.isStoreReceipt === false;
  const editField = key => () => setEditing(e => ({ ...e, [key]: true }));

  const submit = () => {
    if (!form.image) {
      Toast.show({ type: 'error', text1: t('Please upload a receipt image.') });
      return;
    }
    setLoading(true);
    Post('rewards/receipt', { ...form, scanToken: scan?.scanToken }, {}).then(
      res => {
        setLoading(false);
        if (res?.status === false) {
          Toast.show({ type: 'error', text1: res?.message || t('Upload failed') });
          return;
        }
        Toast.show({ type: 'success', text1: res?.data?.message || t('Receipt uploaded') });
        reset();
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
          {t("Shopped in store? Snap your receipt — we'll read it for you and add points at your tier rate once it's reviewed.")}
        </Text>

        {!form.image ? (
          <TouchableOpacity style={styles.scanBtn} onPress={() => cameraRef.current?.show()}>
            <Camera color="#fff" size={34} />
            <Text style={styles.scanBtnTitle}>{t('Scan receipt')}</Text>
            <Text style={styles.scanBtnSub}>{t('Take a photo or choose one from your gallery')}</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.scanCard,
              scan?.status === 'scanned' && { borderColor: C.earn, backgroundColor: '#EEF9EF' },
            ]}>
            <Image source={{ uri: form.image }} style={styles.receiptThumbLg} resizeMode="cover" />
            <View style={{ flex: 1, gap: 4 }}>
              {scan?.status === 'scanning' && (
                <View style={styles.scanStatusRow}>
                  <ActivityIndicator size="small" color={C.green} />
                  <Text style={[styles.body, { fontFamily: FONTS.SemiBold, color: C.green }]}>
                    {t('Reading your receipt…')}
                  </Text>
                </View>
              )}
              {scan?.status === 'scanned' && (
                <>
                  <View style={styles.scanStatusRow}>
                    <CheckCircle2 size={22} color={C.earn} />
                    <Text style={[styles.body, { fontFamily: FONTS.Bold, color: C.earn }]}>{t('Receipt scanned')}</Text>
                  </View>
                  <Text style={[styles.smallGrey, { color: C.earn }]}>{t('Receipt details detected — please review.')}</Text>
                </>
              )}
              {scan?.status === 'manual' && (
                <Text style={styles.smallGrey}>{scan.message || t('Please enter the receipt details below.')}</Text>
              )}
              <TouchableOpacity onPress={reset}>
                <Text style={styles.linkTxt}>{t('Use a different photo')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {scan?.alreadySubmitted && (
          <Text style={styles.receiptWarning}>{t('This receipt has already been submitted for points.')}</Text>
        )}
        {declined && (
          <Text style={styles.receiptWarning}>
            {t('This receipt shows the payment was declined. Points are only given for completed purchases.')}
          </Text>
        )}
        {notOurStore && (
          <Text style={styles.receiptWarning}>
            {t("This doesn't look like a Bách Hoá Houston receipt. Only Bách Hoá Houston purchases earn points.")}
          </Text>
        )}

        {!!form.image && scan?.status !== 'scanning' && (
          <>
            <ReviewField
              t={t}
              label={t('Eligible subtotal before tax ($)')}
              value={form.amount}
              display={form.amount !== '' ? `$${form.amount}` : ''}
              editing={editing.amount}
              onEdit={editField('amount')}>
              <Text style={{ color: C.grey }}>$</Text>
              <TextInput
                style={styles.reviewInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={C.lightGrey}
                autoFocus={!!editing.amount && scan?.status === 'scanned'}
                value={form.amount}
                onChangeText={v => /^\d{0,5}(\.\d{0,2})?$/.test(v) && setForm({ ...form, amount: v })}
              />
            </ReviewField>
            <Text style={[styles.smallGrey, { marginTop: 4 }]}>{t('Points are based on eligible purchases before tax.')}</Text>

            <Text style={styles.label}>{t('Purchase date')}</Text>
            <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={() => setDateOpen(true)}>
              <Text style={{ color: form.purchaseDate ? '#111' : C.lightGrey, fontFamily: FONTS.Regular }}>
                {form.purchaseDate ? moment(form.purchaseDate, 'YYYY-MM-DD').format('MMM D, YYYY') : t('Select date')}
              </Text>
              <Calendar size={18} color={C.grey} />
            </TouchableOpacity>

            <ReviewField
              t={t}
              icon={Store}
              label={t('Store')}
              value={form.storeName}
              editing={editing.storeName}
              onEdit={editField('storeName')}>
              <TextInput
                style={styles.reviewInput}
                placeholder="Bách Hoá Houston"
                placeholderTextColor={C.lightGrey}
                value={form.storeName}
                onChangeText={v => setForm({ ...form, storeName: v })}
              />
            </ReviewField>

            <ReviewField
              t={t}
              icon={ReceiptText}
              label={t('Receipt number')}
              value={form.receiptNumber}
              editing={editing.receiptNumber}
              onEdit={editField('receiptNumber')}>
              <TextInput
                style={styles.reviewInput}
                placeholder={t('Payment ID on the receipt')}
                placeholderTextColor={C.lightGrey}
                value={form.receiptNumber}
                onChangeText={v => setForm({ ...form, receiptNumber: v })}
              />
            </ReviewField>

            <Text style={styles.label}>{t('Note (optional)')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('Add a note (optional)')}
              placeholderTextColor={C.lightGrey}
              value={form.note}
              onChangeText={v => setForm({ ...form, note: v })}
            />

            {estimatedPoints > 0 && !declined && (
              <View style={styles.estimateBox}>
                <Text style={[styles.body, { color: '#0B2F5E' }]}>
                  {t("You'll earn about")}{' '}
                  <Text style={{ fontFamily: FONTS.Bold }}>
                    {fmt(estimatedPoints)} {t('pts')}
                  </Text>{' '}
                  {t("on this receipt once it's approved.")}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, scan?.alreadySubmitted && { opacity: 0.5 }]}
              disabled={scan?.alreadySubmitted}
              onPress={submit}>
              <Upload size={18} color="#fff" />
              <Text style={styles.addTxt}>{t('Submit receipt')}</Text>
            </TouchableOpacity>
          </>
        )}
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
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 14,
    paddingVertical: 24,
    // paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  tierWrap: { alignSelf: 'center', alignItems: 'center', paddingHorizontal: 20 },
  tier: { fontFamily: FONTS.SemiBold, fontSize: 13, color: '#0B2F5E', letterSpacing: 3.5, textAlign: 'center', paddingLeft: 3.5 },
  points: { fontFamily: FONTS.Bold, fontSize: 56, color: '#0B2F5E', lineHeight: 68, marginTop: 4, textAlign: 'center', alignSelf: 'stretch', includeFontPadding: false },
  pointsLabel: { fontFamily: FONTS.Medium, fontSize: 15, color: '#0B4F8A', textAlign: 'center', alignSelf: 'stretch' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  pill: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillTxt: { fontFamily: FONTS.Regular, fontSize: 12, color: '#4B5563' },
  note: { fontFamily: FONTS.Regular, fontSize: 12, color: C.grey, marginTop: 4, textAlign: 'center' },
  signInBtn: { backgroundColor: C.button, borderRadius: 30, paddingHorizontal: 32, paddingVertical: 10, marginTop: 12 },
  signInTxt: { color: '#fff', fontFamily: FONTS.SemiBold, fontSize: 15 },
  banner: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  groupTitle: { fontFamily: FONTS.Bold, fontSize: 19, color: C.green, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 8,
    alignItems: 'center',
  },
  cardName: { fontFamily: FONTS.SemiBold, fontSize: 13, color: C.green, textAlign: 'center', marginTop: 6, minHeight: 20 },
  cardPoints: { fontFamily: FONTS.Regular, fontSize: 13, color: C.grey },
  redeemBtn: { marginTop: 8, width: '100%', backgroundColor: C.button, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
  redeemTxt: { color: '#fff', fontFamily: FONTS.Medium, fontSize: 13 },
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
  shadow: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tierName: { fontFamily: FONTS.Bold, fontSize: 28, lineHeight: 34, color: '#0B2F5E' },
  rateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  rateChipTxt: { fontFamily: FONTS.SemiBold, fontSize: 13 },
  tierProgress: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 14, paddingTop: 14 },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: C.chip, overflow: 'hidden' },
  progressFill: { height: '100%', minWidth: '8%', borderRadius: 5, backgroundColor: '#2E7D32' },
  nextTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nextTierName: { fontFamily: FONTS.Bold, fontSize: 17, color: '#0B2F5E' },
  statBox: { width: '32%', alignItems: 'center' },
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
  scanBtn: {
    marginTop: 14,
    backgroundColor: C.green,
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  scanBtnTitle: { fontFamily: FONTS.Bold, fontSize: 16, color: '#fff' },
  scanBtnSub: { fontFamily: FONTS.Regular, fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  scanCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  receiptThumbLg: { width: 90, height: 120, borderRadius: 10, backgroundColor: '#E5E7EB' },
  scanStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkTxt: { fontFamily: FONTS.Regular, fontSize: 13, color: C.grey, textDecorationLine: 'underline', marginTop: 4 },
  reviewBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewValue: { flex: 1, fontFamily: FONTS.Regular, fontSize: 14, color: '#111' },
  reviewInput: { flex: 1, padding: 0, fontSize: 14, color: '#111', fontFamily: FONTS.Regular },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editTxt: { fontFamily: FONTS.Medium, fontSize: 13, color: C.button },
  estimateBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.4)',
  },
  receiptPreview: { width: '100%', height: 240, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#F9FAFB' },
  removeImg: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14, padding: 4 },
  receiptWarning: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    fontFamily: FONTS.Regular,
  },
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
