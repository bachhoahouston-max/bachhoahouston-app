/* eslint-disable react-native/no-inline-styles */
/* Invoice PDF for an order — mirrors grocerypickup-admin/components/Invoice.js
 * but rendered as an HTML string -> PDF via react-native-html-to-pdf, then
 * opened with react-native-blob-util. */
import React, {useContext, useState} from 'react';
import {
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNBlobUtil from 'react-native-blob-util';
import {Toast} from 'toastify-react-native';
import {useTranslation} from 'react-i18next';
import Constants, {FONTS} from '../../../Assets/Helpers/constant';
import {LoadContext} from '../../../../App';
import {
  BRAND,
  deliveryLabel,
  fmtDate,
  groupByCategory,
} from '../../../Assets/Helpers/orderUtils';

const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const money = n => `$${Number(n || 0).toFixed(2)}`;

const buildHtml = ({order, productItem = [], totalAmount, productsCount}) => {
  const invoiceId = order?.orderId || order?._id;
  const isVerified = Boolean(order?.checklist?.completedAt);
  const customerName =
    `${order?.Local_address?.name || ''} ${
      order?.Local_address?.lastname || ''
    }`.trim() ||
    `${order?.user?.username || ''} ${order?.user?.lastname || ''}`.trim() ||
    'N/A';

  const items = productItem || [];
  const subtotal = items
    .reduce(
      (sum, i) =>
        sum +
        (Number(i?.total) > 0
          ? Number(i?.total)
          : Number(i.price) * Number(i.qty)),
      0,
    )
    .toFixed(2);

  const refundedItems = items.filter(i => Number(i?.refundAmount) > 0);
  const refundedQty = refundedItems.reduce(
    (s, i) => s + Number(i?.shortage || 0),
    0,
  );
  const taxAdjustment = Number(
    refundedItems.reduce((s, i) => s + Number(i?.taxAmount || 0), 0).toFixed(2),
  );
  const totalRefundAmount = Number(
    refundedItems
      .reduce((s, i) => s + Number(i?.refundAmount || 0), 0)
      .toFixed(2),
  );
  const showRefund = isVerified && totalRefundAmount > 0;
  const totalCharged = Number(
    (Number(totalAmount) - totalRefundAmount).toFixed(2),
  );

  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
    invoiceId,
  )}&code=Code128&translate-esc=false`;

  const cats = groupByCategory(items);

  const rowsHtml = cats
    .map(({cat, items: catItems}) => {
      const body = catItems
        .map(item => {
          const shortage = Number(item?.shortage || 0);
          const packed =
            item?.fullfillQty !== undefined && item?.fullfillQty !== null
              ? item.fullfillQty
              : item?.qty;
          const lineTotal =
            Number(item?.total) > 0
              ? Number(item.total).toFixed(2)
              : (Number(item.price) * Number(item.qty)).toFixed(2);
          const statusTxt = !isVerified
            ? '—'
            : shortage > 0
            ? 'Shortage'
            : 'No Shortage';
          return `<tr>
            <td style="text-align:right">${item?.qty ?? ''}</td>
            <td style="text-align:center">${isVerified ? packed : '—'}</td>
            <td>${esc(item?.name || item?.product?.name || '—')}</td>
            <td>${esc(item?.unit || '')}</td>
            <td style="text-align:right">$${lineTotal}</td>
            <td style="text-align:right;color:${
              shortage > 0 ? '#dc2626' : '#111'
            }">${isVerified ? shortage : '—'}</td>
            <td>${esc(isVerified ? item?.reason || '-' : '-')}</td>
            <td style="text-align:center;color:${
              shortage > 0 ? '#dc2626' : BRAND
            }">${statusTxt}</td>
          </tr>`;
        })
        .join('');
      return `<tr><td colspan="8" style="background:#dcfce7;color:#166534;font-weight:bold">${esc(
        cat,
      )}</td></tr>${body}`;
    })
    .join('');

  const paymentRows = [
    showRefund
      ? {label: 'Original Subtotal', value: `$${subtotal}`}
      : {label: 'Subtotal', value: `$${subtotal}`},
    {label: 'Discount', value: money(order?.discount)},
    {label: 'Delivery tip', value: money(order?.Deliverytip)},
    {label: 'Delivery Charges', value: money(order?.deliveryfee)},
    {label: 'Service Fee', value: money(order?.serviceFee)},
    {label: 'Extended Zone Delivery Fee', value: money(order?.extraFees)},
    {label: 'Total Tax', value: money(order?.totalTax)},
  ];
  if (showRefund) {
    paymentRows.push({
      label: `Refund for Shortage (${refundedQty} item${
        refundedQty > 1 ? 's' : ''
      })`,
      value: `- ${money(totalRefundAmount - taxAdjustment)}`,
    });
    if (taxAdjustment > 0) {
      paymentRows.push({
        label: 'Tax Adjustment (Refund)',
        value: `- ${money(taxAdjustment)}`,
      });
    }
  }

  const paymentHtml = paymentRows
    .map(
      r =>
        `<div class="prow"><span>${esc(r.label)}</span><span>${esc(
          r.value,
        )}</span></div>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; color:#111; font-size:12px; padding:16px; }
    h1 { color:#046A38; margin:0; font-size:22px; letter-spacing:.5px; }
    .head { display:flex; justify-content:space-between; border-bottom:1px solid #e5e7eb; padding-bottom:8px; margin-bottom:12px; }
    .right { text-align:right; }
    .muted { color:#6b7280; }
    .box { border:1px solid #d1d5db; border-radius:6px; padding:8px 12px; margin:10px 0; }
    table { width:100%; border-collapse:collapse; margin:12px 0; font-size:11px; }
    th, td { border:1px solid #e5e7eb; padding:5px 6px; text-align:left; }
    thead tr { background:${BRAND}; color:#fff; }
    .prow { display:flex; justify-content:space-between; padding:2px 0; }
    .ptotal { display:flex; justify-content:space-between; border-top:1px solid #d1d5db; padding-top:6px; margin-top:4px; font-weight:bold; font-size:14px; }
    .summary span { display:block; }
    img.bc { width:260px; height:70px; object-fit:contain; }
    .foot { margin-top:24px; text-align:center; border-top:1px solid #e5e7eb; padding-top:10px; }
  </style></head><body>
  <div class="head">
    <div>
      <h1>BACH HOA HOUSTON</h1>
      <div class="muted">www.bachhoahouston.com</div>
    </div>
    <div class="right">
      <div><b style="color:#046A38">Order type:</b> <b style="color:#046A38">${esc(
        deliveryLabel(order),
      )}</b></div>
      <div>Order ID: <b>${esc(invoiceId)}</b></div>
      <div>Order Date: ${esc(fmtDate(order?.createdAt))}</div>
      ${
        order?.dateOfDelivery
          ? `<div>${
              order?.isLocalDelivery || order?.isShipmentDelivery
                ? 'Delivery'
                : 'Pickup'
            } Date: ${esc(fmtDate(order?.dateOfDelivery))}</div>`
          : ''
      }
    </div>
  </div>

  <div style="display:flex;justify-content:center;margin:10px 0"><img class="bc" src="${barcodeUrl}" /></div>

  <div style="display:flex;justify-content:space-between;gap:16px">
    <div>
      <b>Billed To:</b>
      <div>${esc(customerName)}</div>
      <div>${esc(order?.Local_address?.address || order?.user?.email || '')}</div>
      <div>${esc(
        order?.Local_address?.phoneNumber || order?.user?.number || '',
      )}</div>
    </div>
    <div class="box summary">
      <b style="color:#046A38">ORDER SUMMARY</b>
      <span>Items Ordered: <b>${productsCount ?? ''}</b></span>
      <span>Items Packed: <b>${isVerified ? productsCount ?? '' : '—'}</b></span>
      <span>Refunded Items: <b style="color:#dc2626">${
        isVerified ? refundedQty : '—'
      }</b></span>
    </div>
  </div>

  <table>
    <thead><tr>
      <th>ORD</th><th>Packed</th><th>Item</th><th>Unit</th><th>Subtotal</th>
      <th>Shortage</th><th>Reason</th><th>Status</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end">
    <div class="box" style="min-width:260px">
      <b style="color:${BRAND}">Payment Summary</b>
      ${paymentHtml}
      <div class="ptotal"><span>${
        showRefund ? 'Total Charged' : 'Total'
      }</span><span>${money(showRefund ? totalCharged : totalAmount)}</span></div>
    </div>
  </div>

  <div class="foot">
    <div>Thank you for shopping with BACH HOA HOUSTON</div>
    <div class="muted">For questions, contact us at contact@bachhoahouston.com</div>
  </div>
  </body></html>`;
};

const OrderInvoice = ({
  order,
  productItem,
  totalAmount,
  productsCount,
  compact,
}) => {
  const {t} = useTranslation();
  const [, setLoading] = useContext(LoadContext);
  const [busy, setBusy] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== 'android' || Platform.Version >= 30) return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  };

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setLoading(true);
    try {
      await requestPermission();
      const html = buildHtml({order, productItem, totalAmount, productsCount});
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `Invoice-${order?.orderId || order?._id || Date.now()}`,
        directory: Platform.OS === 'android' ? 'Downloads' : 'Documents',
      });
      const path = file?.filePath;
      if (!path) throw new Error('PDF was not created');
      if (Platform.OS === 'android') {
        await RNBlobUtil.android.actionViewIntent(path, 'application/pdf');
      } else {
        await RNBlobUtil.ios.openDocument(path);
      }
    } catch (err) {
      console.log('invoice error', err);
      Toast.error(err?.message || t('Could not generate invoice'));
    } finally {
      setBusy(false);
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={compact ? styles.compact : styles.btn}
      onPress={generate}
      disabled={busy}>
      <Text style={compact ? styles.compactTxt : styles.btnTxt}>
        {busy ? t('Preparing…') : t('Invoice')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTxt: {color: Constants.white, fontFamily: FONTS.Bold, fontSize: 14},
  compact: {
    borderWidth: 1,
    borderColor: BRAND,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  compactTxt: {color: BRAND, fontFamily: FONTS.Medium, fontSize: 13},
});

export default OrderInvoice;
