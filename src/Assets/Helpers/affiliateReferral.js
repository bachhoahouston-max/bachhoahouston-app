import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'affiliateProductReferrals';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const getProductReferrals = async () => {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(KEY)) || '{}');
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(saved || {})
        .filter(([, value]) => value?.code && now - value.at < TTL_MS)
        .map(([slug, value]) => [slug, value.code]),
    );
  } catch (e) {
    return {};
  }
};

export const getProductReferralCode = async slug =>
  slug ? (await getProductReferrals())[slug] || '' : '';

export const saveProductReferral = async (slug, code) => {
  if (!slug || !code) return;
  let saved = {};
  try {
    saved = JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') || {};
  } catch (e) {}
  const now = Date.now();
  const next = Object.fromEntries(
    Object.entries(saved).filter(([, value]) => now - value?.at < TTL_MS),
  );
  next[slug] = { code, at: now };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
};

// The product slug in a shared product link, if the URL is one.
export const getProductSlugFromUrl = url => {
  const match = String(url || '').match(/product-details\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
};
