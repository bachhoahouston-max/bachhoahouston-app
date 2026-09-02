/* Shared order helpers for the Employee order screens.
 * Ports the maths / formatting used by grocerypickup-admin/pages/orders.js,
 * OrderDetailDrawer.js and ChecklistModal.js so the app matches the admin web. */
import moment from 'moment-timezone';

export const HOUSTON_TZ = 'America/Chicago';
export const BRAND = '#206B3A';

// Stripe tax code that means sales tax was collected at checkout; only these
// products carry a refundable tax portion on a shortage.
export const TAXABLE_TAX_CODE = 'txcd_99999999';
export const TAX_RATE = 0.0825;

export const QUANTITY_MISMATCH_REASONS = [
  'Out of Stock',
  'Supplier Delay',
  'Quality Issue',
  'Damaged in Transit',
  'Customer Cancellation',
  'Other (Please specify)',
];

export const CHECKLIST_ITEMS = {
  pickup: [
    'Invoice total = Stripe payment received',
    'Delivery/Pickup date verified',
    'All items checked and not expired',
    'Correct quantity packed and video recorded',
    'Any out-of-stock item/refund approved and supervisor notified',
    'Invoice signed off with employee initials and thank-you note',
  ],
  localDelivery: [
    'Invoice total = Stripe payment received',
    'Delivery date verified',
    'All items checked and not expired',
    'Correct quantity packed and video recorded',
    'Any out-of-stock item/refund approved and supervisor notified',
    'Invoice signed off with employee initials and thank-you note',
  ],
  shipment: [
    'Invoice total = Stripe payment received (if not, notify supervisor)',
    'All items checked and not expired',
    'Correct quantity packed and video recorded',
    'Any out-of-stock item/refund approved and supervisor notified',
    'Invoice signed off with employee initials and thank-you note',
    'Shipping label created',
  ],
};

// deliveryOpt from admin orders.js — used by the "switch delivery option" flow.
export const DELIVERY_OPTIONS = [
  {
    value: 'orderPickup',
    label: 'In Store Pickup',
    isDriveUp: false,
    isLocalDelivery: false,
    isShipmentDelivery: false,
    isOrderPickup: true,
  },
  {
    value: 'driveUp',
    label: 'Curbside Pickup',
    isDriveUp: true,
    isLocalDelivery: false,
    isShipmentDelivery: false,
    isOrderPickup: false,
  },
  {
    value: 'localDelivery',
    label: 'Local Delivery',
    isDriveUp: false,
    isLocalDelivery: true,
    isShipmentDelivery: false,
    isOrderPickup: false,
  },
  {
    value: 'ShipmentDelivery',
    label: 'Shipment Delivery',
    isDriveUp: false,
    isLocalDelivery: false,
    isShipmentDelivery: true,
    isOrderPickup: false,
  },
];

export const currentDeliveryValue = order =>
  order?.isDriveUp
    ? 'driveUp'
    : order?.isLocalDelivery
    ? 'localDelivery'
    : order?.isShipmentDelivery
    ? 'ShipmentDelivery'
    : 'orderPickup';

export const deliveryLabel = order => {
  if (order?.isOrderPickup) return 'In Store Pickup';
  if (order?.isLocalDelivery) return 'Local Delivery';
  if (order?.isDriveUp) return 'Curbside Pickup';
  if (order?.isShipmentDelivery) return 'Shipment';
  return 'Not specified';
};

export const STATUS_COLORS = {
  Pending: {bg: '#FEF9C3', text: '#A16207', dot: '#FACC15', label: 'Pending'},
  Completed: {bg: '#DCFCE7', text: '#15803D', dot: '#22C55E', label: 'Completed'},
  Return: {bg: '#DBEAFE', text: '#1D4ED8', dot: '#60A5FA', label: 'Return'},
  Cancel: {bg: '#FEE2E2', text: '#B91C1C', dot: '#F87171', label: 'Cancelled'},
  'Return Requested': {
    bg: '#F3E8FF',
    text: '#7E22CE',
    dot: '#C084FC',
    label: 'Return Req.',
  },
  Preparing: {bg: '#FFEDD5', text: '#C2410C', dot: '#FB923C', label: 'Preparing'},
  'Order Ready': {
    bg: '#CCFBF1',
    text: '#0F766E',
    dot: '#2DD4BF',
    label: 'Order Ready',
  },
  'Out for Delivery': {
    bg: '#E0E7FF',
    text: '#4338CA',
    dot: '#818CF8',
    label: 'Out for Delivery',
  },
  Driverassigned: {
    bg: '#CFFAFE',
    text: '#0E7490',
    dot: '#22D3EE',
    label: 'Driver Assigned',
  },
  Shipped: {bg: '#EDE9FE', text: '#6D28D9', dot: '#A78BFA', label: 'Shipped'},
};

export const statusStyle = value =>
  STATUS_COLORS[value] || {
    bg: '#F3F4F6',
    text: '#4B5563',
    dot: '#9CA3AF',
    label: value || '—',
  };

export const fmtDate = iso =>
  iso ? moment.utc(iso).tz(HOUSTON_TZ).format('D MMMM YYYY') : '';

export const fmtDateTime = iso =>
  iso ? moment.utc(iso).tz(HOUSTON_TZ).format('MMMM D, YYYY hh:mm:ss A') : '';

export const fmtShort = iso =>
  iso ? moment.utc(iso).tz(HOUSTON_TZ).format('MMM D, YYYY hh:mm A') : '';

export const computeOrderTotal = order => {
  if (!order) return 0;
  const subtotal = (order?.productDetail || []).reduce(
    (sum, item) => sum + Number(item?.price || 0) * Number(item?.qty || 0),
    0,
  );
  let total =
    subtotal +
    Number(order?.Deliverytip || 0) +
    Number(order?.extraFees || 0) +
    Number(order?.serviceFee || 0) +
    Number(order?.totalTax || 0) +
    Number(order?.deliveryfee || 0);
  total = total - Number(order?.discount || 0);
  return Number(total.toFixed(2));
};

export const computeOrderQty = order =>
  (order?.productDetail || []).reduce(
    (sum, item) => sum + Number(item?.qty || 0),
    0,
  );

// Mirrors OrderDetailDrawer.setInitialInvoiceData — the productItem / totalAmount
// shape the invoice consumes.
export const buildInvoiceData = order => {
  let subtotal = 0;
  let qty = 0;
  const productItem = (order?.productDetail || []).map(item => {
    const total = Number((Number(item?.price) * Number(item?.qty)).toFixed(2));
    subtotal = Number((subtotal + total).toFixed(2));
    qty += Number(item?.qty || 0);
    return {
      name: item?.product?.name,
      combo_id: item?.combo_id,
      product: item?.product,
      qty: item?.qty || 1,
      unit: item?.product?.price_slot?.[0]?.unit,
      price: item?.price || 0,
      tax: item?.tax || 0,
      total: total?.toFixed(2) || 0,
      fullfillQty: item?.fullfillQty,
      shortage: item?.shortage,
      taxAmount: item?.taxAmount,
      refundAmount: item?.refundAmount,
      reason: item?.reason,
      refund_status: item?.refund_status,
      freeProductFulfillment: item?.freeProductFulfillment,
      image: item?.image,
    };
  });

  let mainTotal =
    Number(subtotal) +
    Number(order?.Deliverytip || 0) +
    Number(order?.extraFees || 0) +
    Number(order?.serviceFee || 0) +
    Number(order?.totalTax || 0) +
    Number(order?.deliveryfee || 0);
  const totalAmount = Number(
    (mainTotal - Number(order?.discount || 0)).toFixed(2),
  );
  return {productItem, totalAmount, productsCount: qty};
};

export const groupByCategory = items => {
  const grouped = (items || []).reduce((acc, item) => {
    const cat = item?.product?.categoryName || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  return Object.keys(grouped)
    .sort()
    .map(cat => ({cat, items: grouped[cat]}));
};

export const rowShortageStatus = item => {
  const shortage = Number(item?.shortage || 0);
  if (shortage <= 0) return {label: 'No Shortage', color: BRAND};
  if (item?.refund_status === 'Processed')
    return {label: 'Refunded', color: '#F97316'};
  return {label: 'Shortage', color: '#DC2626'};
};

// PickupOption values understood by NewgetOrderBySeller.
export const PICKUP_FILTER_OPTIONS = [
  {label: 'All', value: 'All'},
  {label: 'In Store Pickup', value: 'InStorePickup'},
  {label: 'Curbside Pickup', value: 'CurbsidePickup'},
  {label: 'Local Delivery', value: 'NextdayDelivery'},
  {label: 'Shipment', value: 'Shipment'},
  {label: 'Cancelled order', value: 'Cancel'},
];
