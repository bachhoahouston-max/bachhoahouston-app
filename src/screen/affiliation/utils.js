import {Linking, Share} from 'react-native';
// Deep import: the top-level react-native Clipboard getter logs a deprecation
// warning, and no clipboard package is installed.
// eslint-disable-next-line @react-native/no-deep-imports
import Clipboard from 'react-native/Libraries/Components/Clipboard/Clipboard';
import Toast from 'react-native-toast-message';
import moment from 'moment-timezone';
import {COLORS} from './theme';

export const TZ = 'America/Chicago';

// Icons are Ionicons names.
export const SOCIAL_PLATFORMS = [
  {label: 'Instagram', value: 'instagram', icon: 'logo-instagram', color: '#E1306C', placeholder: 'e.g. https://instagram.com/yourname'},
  {label: 'TikTok', value: 'tiktok', icon: 'logo-tiktok', color: '#000000', placeholder: 'e.g. https://tiktok.com/@yourname'},
  {label: 'Facebook', value: 'facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'e.g. https://facebook.com/yourpage'},
  {label: 'YouTube', value: 'youtube', icon: 'logo-youtube', color: '#FF0000', placeholder: 'e.g. https://youtube.com/@yourchannel'},
  {label: 'X / Twitter', value: 'twitter', icon: 'logo-twitter', color: '#1DA1F2', placeholder: 'e.g. https://x.com/yourname'},
  {label: 'Pinterest', value: 'pinterest', icon: 'logo-pinterest', color: '#E60023', placeholder: 'e.g. https://pinterest.com/yourname'},
  {label: 'Website', value: 'website', icon: 'globe-outline', color: COLORS.primary, placeholder: 'e.g. https://yourwebsite.com'},
];

export const getPlatform = value =>
  SOCIAL_PLATFORMS.find(p => p.value === value) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];

export const money = value => `$${Number(value || 0).toFixed(2)}`;

export const shortDate = value => (value ? moment(value).tz(TZ).format('MMM D, YYYY') : '');

// "https://www.bachhoahouston.com/ref/maya15" → "bachhoahouston.com/ref/maya15"
export const displayLink = link => String(link || '').replace(/^https?:\/\//, '').replace(/^www\./, '');

// Commission status → label + pill colors. "Pending" means earned but not paid
// yet; "Approved" means it is inside an old payout request.
export const COMMISSION_STATUS = {
  Pending: {label: 'Unpaid', color: COLORS.primary, bg: COLORS.primarySoft},
  Approved: {label: 'In payout request', color: COLORS.info, bg: COLORS.infoSoft},
  Paid: {label: 'Paid', color: COLORS.primaryDark, bg: COLORS.primaryMuted},
  Reversed: {label: 'Reversed', color: COLORS.danger, bg: COLORS.dangerSoft},
};

export const PAYOUT_STATUS = {
  'Pending Approval': {label: 'Pending Approval', color: COLORS.warning, bg: COLORS.warningSoft},
  Approved: {label: 'Approved', color: COLORS.info, bg: COLORS.infoSoft},
  Paid: {label: 'Paid', color: COLORS.primaryDark, bg: COLORS.primaryMuted},
  Rejected: {label: 'Rejected', color: COLORS.danger, bg: COLORS.dangerSoft},
};

// How the store paid a payout (set by the admin) → translation key.
export const PAYMENT_METHOD_LABELS = {
  Zelle: 'Zelle',
  'Bank transfer': 'Bank transfer',
  Cash: 'Cash',
  Check: 'Paper check',
  Other: 'Other method',
};

export const APPLICATION_STATUS = {
  Pending: {label: 'Under review', color: COLORS.warning, bg: COLORS.warningSoft},
  Approved: {label: 'Approved', color: COLORS.primary, bg: COLORS.white},
  Rejected: {label: 'Not approved', color: COLORS.danger, bg: COLORS.dangerSoft},
  Suspended: {label: 'Suspended', color: COLORS.danger, bg: COLORS.dangerSoft},
};

const ORDER_PILL = {
  delivered: {color: COLORS.primary, bg: COLORS.primarySoft},
  completed: {color: COLORS.primary, bg: COLORS.primarySoft},
  cancel: {color: COLORS.danger, bg: COLORS.dangerSoft},
  return: {color: COLORS.danger, bg: COLORS.dangerSoft},
};

// Order status pill colors; anything not finished is shown as pending (amber).
export const orderPill = status => {
  const key = Object.keys(ORDER_PILL).find(k => String(status || '').toLowerCase().includes(k));
  return key ? ORDER_PILL[key] : {color: COLORS.warning, bg: COLORS.warningSoft};
};

// Merges earned commissions and orders still awaiting completion into a
// single, newest-first list for the "attributed orders" views.
export const buildAttributedOrders = dashboard => {
  const commissions = (dashboard?.commissions || []).map(item => ({
    key: item._id,
    orderNumber: item.orderNumber || item.order?.orderId,
    date: item.order?.createdAt || item.createdAt,
    eligibleAmount: item.eligibleOrderAmount,
    commission: item.commissionAmount,
    rate: item.commissionRate,
    orderStatus: item.order?.status || 'Delivered',
    commissionStatus: item.status,
    linkProduct: item.order?.affiliationLink?.product?.name,
    pending: false,
  }));
  const pending = (dashboard?.pendingOrders || []).map(order => ({
    key: order._id,
    orderNumber: order.orderId,
    date: order.createdAt,
    eligibleAmount: null,
    commission: null,
    orderStatus: order.status || 'Pending',
    commissionStatus: null,
    linkProduct: order.affiliationLink?.product?.name,
    pending: true,
  }));
  return [...commissions, ...pending].sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const copyText = (text, message) => {
  if (!text) {
    return;
  }
  try {
    Clipboard.setString(String(text));
    Toast.show({type: 'success', text1: message});
  } catch (error) {
    Share.share({message: String(text)});
  }
};

export const shareReferral = (t, application, message) => {
  const {referralCode, referralLink} = application || {};
  if (!referralCode) {
    return;
  }
  Share.share({
    title: t('Shop with my referral link'),
    message:
      message ||
      t('Shop at Bach Hoa Houston with my referral code {{code}}: {{link}}', {
        code: referralCode,
        link: referralLink || '',
      }),
  }).catch(() => {});
};

// `link` is a product link from affiliation/links ({url, product: {name}}).
export const shareProductLink = (t, link) => {
  if (!link?.url) {
    return;
  }
  const name = link.product?.name || '';
  Share.share({
    title: name,
    message: t('Check out {{name}} at Bach Hoa Houston: {{link}}', {name, link: link.url}),
  }).catch(() => {});
};

export const openUrl = url => {
  if (!url) {
    return;
  }
  const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  Linking.openURL(safe).catch(() => {});
};
