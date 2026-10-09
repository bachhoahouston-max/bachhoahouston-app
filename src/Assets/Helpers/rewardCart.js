import { GetApi } from './Service';


export const isRewardItem = item => item?.productSource === 'REWARD';

export const rewardCartId = pointId => `reward_${pointId}`;

// Real product id of a cart line
export const cartLineProductId = line =>
  isRewardItem(line) ? line?.product_id : line?.productid || line?.id;

// Units of a product across every cart line (bought + redeemed as a reward)
export const cartQtyForProduct = (cart, productId) =>
  (cart || [])
    .filter(line => String(cartLineProductId(line)) === String(productId))
    .reduce((sum, line) => sum + Number(line?.qty || 0), 0);

// Points held by reward lines in the cart
export const cartRewardPoints = cart =>
  (cart || [])
    .filter(isRewardItem)
    .reduce(
      (sum, line) => sum + Number(line?.points || 0) * Number(line?.qty || 1),
      0,
    );

export const rewardProductImage = product =>
  product?.varients?.[0]?.image?.[0] || '';

// Live stock for a product (same endpoint the normal add-to-cart buttons use)
export const getAvailableStock = async productId => {
  const res = await GetApi(`checkQuantity/${productId}`, {});
  return res?.status ? Number(res?.data?.qty) || 0 : 0;
};

export const getRewardSummary = async () => {
  const res = await GetApi('rewards/summary', {});
  return res?.data || null;
};

export const rewardLimitError = (reward, summary, cart, t, extraQty = 1) => {
  const pointId = String(reward.point_id || reward._id);
  const qtyAfter = Number(reward.qtyInCart || 0) + extraQty;
  const used = Number(summary?.usageByPoint?.[pointId] || 0);

  if (reward.perUserLimit && used + qtyAfter > reward.perUserLimit) {
    return `${t('Limit reached')}: ${reward.perUserLimit} ${t('per customer')}`;
  }
  if (
    reward.remainingTotal !== null &&
    reward.remainingTotal !== undefined &&
    qtyAfter > reward.remainingTotal
  ) {
    return t('Fully redeemed');
  }
  const pointsNeeded =
    cartRewardPoints(cart) + Number(reward.points || 0) * extraQty;
  if (summary && pointsNeeded > Number(summary.available || 0)) {
    return `${t('Not enough points')} (${Number(
      summary.available || 0,
    ).toLocaleString()} ${t('pts')})`;
  }
  return null;
};

export const buildRewardCartItem = reward => {
  const product = reward.product;
  const slot = product?.price_slot?.[0] || {};
  const image = rewardProductImage(product);
  const cartId = rewardCartId(reward._id);
  return {
    id: cartId,
    productid: cartId,
    product_id: product._id,
    point_id: reward._id,
    points: reward.points,
    // Limits travel with the cart line so the cart's +/− can check them
    perUserLimit: reward.perUserLimit || null,
    remainingTotal: reward.remainingTotal ?? null,
    productSource: 'REWARD',
    name: product.name,
    productname: product.name,
    vietnamiesName: product.vietnamiesName,
    slug: product.slug,
    selectedColor: product?.varients?.[0] || {},
    selectedImage: image,
    image,
    BarCode: product.BarCode || '',
    tax_code: product.tax_code,
    qty: 1,
    price: 0,
    offer: 0,
    total: 0,
    priceSlotIndex: 0,
    price_slot: {
      value: slot.value,
      unit: slot.unit,
      other_price: slot.our_price,
      our_price: 0,
    },
    isShipmentAvailable: product.isShipmentAvailable,
    isNextDayDeliveryAvailable: product.isNextDayDeliveryAvailable,
    isCurbSidePickupAvailable: product.isCurbSidePickupAvailable,
    isInStoreAvailable: product.isInStoreAvailable,
    isReturnAvailable: product.isReturnAvailable,
  };
};
