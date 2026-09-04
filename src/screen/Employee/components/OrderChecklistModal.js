/* eslint-disable react-native/no-inline-styles */
/* RN port of grocerypickup-admin/components/ChecklistModal.js
 * Pickup / Local delivery / Shipment packing checklist:
 *  - checklist items
 *  - payment verification (Stripe amount vs invoice total, gated)
 *  - per-product quantity verification (packed qty, shortage, reason, est. refund,
 *    barcode verify — camera scan via BarcodeScannerModal, or manual type/paste)
 *  - required photos (+ optional packing video)
 *  - submit -> saveOrderChecklist
 */
import React, {useContext, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {Image as ImageCompressor} from 'react-native-compressor';
import {Dropdown} from 'react-native-element-dropdown';
import {Toast} from 'toastify-react-native';
import {useTranslation} from 'react-i18next';
import Constants, {FONTS} from '../../../Assets/Helpers/constant';
import {LoadContext} from '../../../../App';
import {Post, ApiFormData} from '../../../Assets/Helpers/Service';
import OrderInvoice from './OrderInvoice';
import BarcodeScannerModal from './BarcodeScannerModal';
import {
  BRAND,
  CHECKLIST_ITEMS,
  QUANTITY_MISMATCH_REASONS,
  TAXABLE_TAX_CODE,
  TAX_RATE,
  computeOrderTotal,
} from '../../../Assets/Helpers/orderUtils';

const buildRows = order =>
  (order?.productDetail || []).flatMap((item, index) => {
    const orderedQty = Number(item?.qty || 0);
    const parent = {
      key: item?._id || item?.product?._id || `row-${index}`,
      productId: item?.product?._id || item?._id || '',
      name: item?.product?.name || 'Product',
      image:
        (Array.isArray(item?.image) ? item.image[0] : item?.image) ||
        item?.product?.varients?.[0]?.image?.[0] ||
        '',
      sku: item?.product?.vendorSKU || item?.sku || item?.product?.sku || '',
      unit: item?.product?.price_slot?.[0]?.unit || '',
      price: Number(item?.price || 0),
      taxCode: item?.product?.tax_code || '',
      barcode: item?.product?.BarCode ? String(item.product.BarCode) : '',
      orderedQty,
      packedQty: orderedQty,
      // Starts at 0 — the packed/received count is filled in as staff scan
      // units (or edited by hand). Mirrors grocerypickup-admin ChecklistModal.
      receivedQty: '0',
      reason: '',
      note: '',
      scannedQty: 0,
      scanInput: '',
      lastScanMismatch: false,
    };
    const freeRows = (item?.combo_id?.free_product || []).map((fp, i) => ({
      key: `${parent.key}-free-${fp?.product?._id || i}`,
      productId: fp?.product?._id || `${parent.key}-free-${i}`,
      parentProductId: parent.productId,
      isFree: true,
      name: fp?.product?.name || 'Free Product',
      image: fp?.product?.varients?.[0]?.image?.[0] || '',
      sku: fp?.product?.vendorSKU || fp?.product?.sku || '',
      unit: fp?.slot?.unit || '',
      price: 0,
      taxCode: '',
      barcode: fp?.product?.BarCode ? String(fp.product.BarCode) : '',
      orderedQty,
      packedQty: orderedQty,
      receivedQty: '0',
      reason: '',
      note: '',
      scannedQty: 0,
      scanInput: '',
      lastScanMismatch: false,
    }));
    return [parent, ...freeRows];
  });

const requestCamera = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const g = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    return g === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    return false;
  }
};

const OrderChecklistModal = ({type, order, onClose, onComplete}) => {
  const {t} = useTranslation();
  const [, setLoading] = useContext(LoadContext);
  const isShipment = !!order?.isShipmentDelivery;

  const invoiceTotal = useMemo(() => computeOrderTotal(order), [order]);

  const [items, setItems] = useState(
    CHECKLIST_ITEMS[type].map(label => ({label, checked: false})),
  );
  const [stripePayment, setStripePayment] = useState('');
  const [rows, setRows] = useState(() => buildRows(order));
  const photoLabels = [
    t('1. Photo of complete invoice'),
    type === 'shipment'
      ? t('2. Photo of shipping label and packaging')
      : t('2. Photo of packaged order'),
    ...(isShipment ? [t('3. Photo of shipment delivery proof')] : []),
  ];
  const [photos, setPhotos] = useState(photoLabels.map(() => []));
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  // Index of the row whose barcode is being scanned with the camera, or null.
  const [scanRowIndex, setScanRowIndex] = useState(null);

  const toggleItem = i =>
    setItems(prev =>
      prev.map((it, idx) => (idx === i ? {...it, checked: !it.checked} : it)),
    );

  const updateRow = (i, patch) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? {...r, ...patch} : r)));

  const onReceivedChange = (i, raw, packedQty) => {
    if (raw === '') return updateRow(i, {receivedQty: ''});
    let n = Number(raw);
    if (isNaN(n)) return;
    if (n < 0) n = 0;
    if (n > packedQty) n = packedQty;
    const patch = {receivedQty: String(n)};
    if (n >= packedQty) {
      patch.reason = '';
      patch.note = '';
    }
    updateRow(i, patch);
  };

  const logScan = (row, scanned, matched) => {
    Post('recordScanHistory', {
      orderId: order?._id,
      productId: row.productId,
      productName: row.name,
      sku: row.sku,
      expectedBarcode: row.barcode,
      scannedCode: scanned,
      matched,
      checklistType: type,
    }).catch(() => {});
  };

  // Match a barcode value against row i. `rawValue` is passed by the camera
  // scanner; when omitted the manually typed row.scanInput is used instead.
  // A match bumps scannedQty (capped at ordered) and mirrors it into
  // receivedQty; a mismatch flags the row without losing verified units.
  const applyScan = (i, rawValue) => {
    setRows(prev =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        const scanned = String(
          rawValue != null ? rawValue : row.scanInput || '',
        ).trim();
        if (!scanned) return row;
        const matched = !!row.barcode && scanned === row.barcode.trim();
        logScan(row, scanned, matched);
        if (!matched) return {...row, lastScanMismatch: true, scanInput: ''};
        const next = Math.min(row.orderedQty, (row.scannedQty || 0) + 1);
        const patch = {
          scannedQty: next,
          lastScanMismatch: false,
          scanInput: '',
          receivedQty: String(next),
        };
        if (next >= row.packedQty) {
          patch.reason = '';
          patch.note = '';
        }
        return {...row, ...patch};
      }),
    );
  };

  const verifyScan = i => applyScan(i);

  const onBarcodeDetected = value => {
    const i = scanRowIndex;
    setScanRowIndex(null);
    if (i != null) applyScan(i, value);
  };

  const pickPhoto = (index, fromCamera) => {
    const opts = {mediaType: 'photo', quality: 0.8, maxWidth: 2000, maxHeight: 2000};
    const cb = async res => {
      if (res.didCancel || !res.assets?.length) return;
      const asset = res.assets[0];
      try {
        setLoading(true);
        const compressed = await ImageCompressor.compress(asset.uri, {
          compressionMethod: 'auto',
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.6,
        });
        const up = await ApiFormData({
          uri: compressed,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || 'photo.jpg',
        });
        if (up?.status && up?.data?.file) {
          setPhotos(prev => {
            const n = [...prev];
            n[index] = [...(n[index] || []), up.data.file];
            return n;
          });
          setError('');
        } else {
          Toast.error(t('Failed to upload image'));
        }
      } catch (e) {
        Toast.error(e?.message || t('Error uploading image'));
      } finally {
        setLoading(false);
      }
    };
    if (fromCamera) {
      requestCamera().then(ok =>
        ok
          ? launchCamera(opts, cb)
          : Toast.error(t('Camera permission is required')),
      );
    } else {
      launchImageLibrary(opts, cb);
    }
  };

  const removePhoto = (index, pIdx) =>
    setPhotos(prev => {
      const n = [...prev];
      n[index] = (n[index] || []).filter((_, i) => i !== pIdx);
      return n;
    });

  const pickVideo = () => {
    requestCamera().then(ok => {
      if (!ok) return Toast.error(t('Camera permission is required'));
      launchCamera({mediaType: 'video', videoQuality: 'medium'}, async res => {
        if (res.didCancel || !res.assets?.length) return;
        const asset = res.assets[0];
        try {
          setLoading(true);
          const up = await ApiFormData({
            uri: asset.uri,
            type: asset.type || 'video/mp4',
            fileName: asset.fileName || 'video.mp4',
          });
          if (up?.status && up?.data?.file) {
            setVideos(prev => [...prev, up.data.file]);
          } else {
            Toast.error(t('Failed to upload video'));
          }
        } catch (e) {
          Toast.error(e?.message || t('Error uploading video'));
        } finally {
          setLoading(false);
        }
      });
    });
  };

  // ---- derived validation (mirrors admin) ----
  const rowReceived = r =>
    r.receivedQty === '' || isNaN(Number(r.receivedQty))
      ? null
      : Number(r.receivedQty);
  const rowShortage = r => {
    const recv = rowReceived(r);
    if (recv === null) return 0;
    return Math.max(0, Number(r.packedQty || 0) - recv);
  };
  const rowRefundBase = r => rowShortage(r) * Number(r.price || 0);
  const rowRefundTax = r =>
    r.taxCode === TAXABLE_TAX_CODE ? rowRefundBase(r) * TAX_RATE : 0;
  const rowRefund = r => rowRefundBase(r) + rowRefundTax(r);
  const resolveReason = (reason, note) =>
    reason === 'Other (Please specify)'
      ? (note || '').trim() || reason
      : reason;

  const paidRows = rows.filter(r => !r.isFree);
  const totalPacked = paidRows.reduce((s, r) => s + Number(r.packedQty || 0), 0);
  const totalReceived = paidRows.reduce((s, r) => s + (rowReceived(r) ?? 0), 0);
  const totalShortage = paidRows.reduce((s, r) => s + rowShortage(r), 0);
  const totalRefund = paidRows.reduce((s, r) => s + rowRefund(r), 0);

  const paymentEntered =
    stripePayment !== '' && !isNaN(Number(stripePayment));
  const paymentDiff = paymentEntered
    ? Number(stripePayment) - invoiceTotal
    : 0;
  const paymentMatches = paymentEntered && Math.abs(paymentDiff) < 0.005;
  const qtyEntered =
    rows.length > 0 &&
    rows.every(r => r.receivedQty !== '' && !isNaN(Number(r.receivedQty)));
  const allChecked = items.length > 0 && items.every(it => it.checked);
  const allPhotos =
    photoLabels.length > 0 && photoLabels.every((_, i) => (photos[i] || []).length > 0);
  const shortageRows = rows.filter(r => rowShortage(r) > 0);
  const shortageReasonsOk = shortageRows.every(
    r =>
      !!r.reason &&
      (r.reason !== 'Other (Please specify)' || (r.note || '').trim() !== ''),
  );
  const ready =
    allChecked &&
    paymentEntered &&
    paymentMatches &&
    qtyEntered &&
    allPhotos &&
    shortageReasonsOk;

  const liveInvoice = useMemo(() => {
    const byKey = new Map(rows.map(r => [r.key, r]));
    let subtotal = 0;
    let qty = 0;
    const productItem = (order?.productDetail || []).map((item, index) => {
      const rowKey = item?._id || item?.product?._id || `row-${index}`;
      const row = byKey.get(rowKey);
      const received = row ? rowReceived(row) : null;
      const fullfillQty = received ?? item?.qty;
      const shortage = row ? rowShortage(row) : Number(item?.shortage || 0);
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
        total: total?.toFixed(2) || 0,
        fullfillQty,
        shortage,
        image: item?.image,
        taxAmount: row ? Number(rowRefundTax(row).toFixed(2)) : Number(item?.taxAmount || 0),
        refundAmount: row ? Number(rowRefund(row).toFixed(2)) : Number(item?.refundAmount || 0),
        reason:
          shortage > 0
            ? (row ? resolveReason(row.reason, row.note) : item?.reason) || ''
            : '',
        refund_status: item?.refund_status,
      };
    });
    let mainTotal =
      Number(subtotal) +
      Number(order?.Deliverytip || 0) +
      Number(order?.extraFees || 0) +
      Number(order?.serviceFee || 0) +
      Number(order?.totalTax || 0) +
      Number(order?.deliveryfee || 0);
    return {
      productItem,
      totalAmount: Number((mainTotal - Number(order?.discount || 0)).toFixed(2)),
      productsCount: qty,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, order]);

  const submit = () => {
    if (!allChecked) return setError(t('All checklist items must be checked.'));
    if (!paymentEntered) return setError(t('Enter the Stripe payment amount received.'));
    if (!paymentMatches)
      return setError(
        t('Stripe payment does not match the invoice total. The order cannot be submitted until it matches.'),
      );
    if (!qtyEntered) return setError(t('Enter the received quantity for every product.'));
    if (!allPhotos) return setError(t('All required photos must be uploaded.'));
    if (!shortageReasonsOk)
      return setError(t('Select a reason for every product with a shortage.'));
    setError('');

    const quantityVerification = rows.map(r => {
      const received = rowReceived(r) ?? 0;
      const shortage = rowShortage(r);
      return {
        productId: r.productId,
        isFree: !!r.isFree,
        parentProductId: r.parentProductId,
        name: r.name,
        sku: r.sku,
        unit: r.unit,
        image: r.image,
        price: Number(r.price || 0),
        qty: Number(r.orderedQty || 0),
        fullfillQty: received,
        shortage,
        taxCode: r.taxCode || '',
        taxAmount: Number(rowRefundTax(r).toFixed(2)),
        refundAmount: Number(rowRefund(r).toFixed(2)),
        barcode: r.barcode || '',
        scannedQty: r.scannedQty || 0,
        barcodeVerified: !!r.barcode && (r.scannedQty || 0) >= r.orderedQty,
        reason: shortage > 0 ? resolveReason(r.reason, r.note) : '',
        note: shortage > 0 ? (r.note || '').trim() : '',
      };
    });

    const shortageSummary = quantityVerification
      .filter(r => r.shortage > 0 && r.reason)
      .map(r =>
        r.note && r.note !== r.reason
          ? `${r.name}: ${r.reason} (${r.note})`
          : `${r.name}: ${r.reason}`,
      )
      .join('; ');

    const data = {
      id: order?._id,
      checklistType: type,
      items,
      invoiceTotal,
      stripePaymentReceived: Number(stripePayment),
      paymentDifference: paymentDiff,
      paymentMatches,
      quantityVerification,
      estimatedRefund: Number(totalRefund.toFixed(2)),
      invoiceQty: totalPacked,
      quantityReceived: totalReceived,
      quantityDifference: totalReceived - totalPacked,
      quantityMatches: qtyEntered && totalShortage === 0,
      quantityMismatchReason: shortageSummary,
      quantityMismatchNote: '',
      photos: photos.flat().filter(Boolean),
      videos: videos.filter(Boolean),
      isShipmentDelivery: isShipment,
    };

    setLoading(true);
    Post('saveOrderChecklist', data)
      .then(res => {
        setLoading(false);
        if (res?.status === false) {
          Toast.error(res?.message || t('Failed to save checklist'));
          return;
        }
        onClose();
        onComplete && onComplete();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Failed to save checklist'));
      });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTxt}>
              {type === 'shipment'
                ? t('Shipment Option')
                : type === 'localDelivery'
                ? t('Local Delivery Option')
                : t('Pickup Option')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 14, paddingBottom: 30}}
            keyboardShouldPersistTaps="handled">
            {/* Payment verification */}
            <Text style={styles.sectionTitle}>{t('PAYMENT VERIFICATION')}</Text>
            <View style={styles.panel}>
              <Row label={t('Invoice Total')} value={`$ ${invoiceTotal.toFixed(2)}`} bold />
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t('Stripe Payment Received')}</Text>
                <View style={styles.moneyInputWrap}>
                  <Text style={{color: Constants.customgrey}}>$</Text>
                  <TextInput
                    style={styles.moneyInput}
                    value={stripePayment}
                    onChangeText={setStripePayment}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Constants.customgrey}
                  />
                </View>
              </View>
              <Row
                label={t('Shortage')}
                value={`$ ${paymentDiff.toFixed(2)}`}
                valueColor={
                  !paymentEntered
                    ? Constants.customgrey
                    : paymentMatches
                    ? BRAND
                    : Constants.red
                }
                bold
              />
              {paymentEntered && (
                <Text
                  style={{
                    marginTop: 8,
                    fontFamily: FONTS.Medium,
                    fontSize: 12,
                    color: paymentMatches ? BRAND : Constants.red,
                  }}>
                  {paymentMatches
                    ? t('Payment matches the invoice total.')
                    : t('Payment mismatch — cannot submit until it matches.')}
                </Text>
              )}
            </View>

            {/* Checklist items */}
            <Text style={styles.sectionTitle}>
              {type === 'shipment' ? t('SHIPMENT CHECKLIST') : t('ORDER CHECKLIST')}
            </Text>
            <View style={styles.panel}>
              {items.map((it, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.checkItem}
                  onPress={() => toggleItem(i)}>
                  <View style={[styles.checkbox, it.checked && styles.checkboxOn]}>
                    {it.checked && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={styles.checkItemTxt}>{it.label}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.muted}>
                {items.filter(i => i.checked).length} / {items.length} {t('checked')}
              </Text>
            </View>

            {/* Quantity verification */}
            <Text style={styles.sectionTitle}>{t('QUANTITY VERIFICATION')}</Text>
            {rows.map((row, i) => {
              const shortage = rowShortage(row);
              const hasShortage = shortage > 0;
              return (
                <View
                  key={row.key}
                  style={[styles.qtyRow, row.isFree && {backgroundColor: '#F0FDF4'}]}>
                  <View style={styles.qtyHead}>
                    {row.image ? (
                      <Image source={{uri: row.image}} style={styles.qtyImg} />
                    ) : (
                      <View style={[styles.qtyImg, {backgroundColor: '#F3F4F6'}]} />
                    )}
                    <View style={{flex: 1}}>
                      {row.isFree && <Text style={styles.freeBadge}>FREE</Text>}
                      <Text style={styles.qtyName}>{row.name}</Text>
                      {!!row.sku && <Text style={styles.muted}>SKU: {row.sku}</Text>}
                    </View>
                  </View>

                  <View style={styles.qtyGrid}>
                    <View style={styles.qtyCell}>
                      <Text style={styles.qtyCellLabel}>{t('Ordered')}</Text>
                      <Text style={styles.qtyCellVal}>{row.orderedQty}</Text>
                    </View>
                    <View style={styles.qtyCell}>
                      <Text style={styles.qtyCellLabel}>{t('Packed / Received')}</Text>
                      <TextInput
                        style={[
                          styles.qtyInput,
                          hasShortage && {borderColor: Constants.red},
                        ]}
                        value={row.receivedQty}
                        onChangeText={v => onReceivedChange(i, v, row.packedQty)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.qtyCell}>
                      <Text style={styles.qtyCellLabel}>{t('Shortage')}</Text>
                      <Text
                        style={[
                          styles.qtyCellVal,
                          {color: hasShortage ? Constants.red : BRAND},
                        ]}>
                        {shortage}
                      </Text>
                    </View>
                    <View style={styles.qtyCell}>
                      <Text style={styles.qtyCellLabel}>{t('Est. Refund')}</Text>
                      <Text
                        style={[
                          styles.qtyCellVal,
                          {color: hasShortage ? Constants.red : Constants.customgrey},
                        ]}>
                        {hasShortage ? `$ ${rowRefund(row).toFixed(2)}` : '-'}
                      </Text>
                    </View>
                  </View>

                  {!!row.barcode && (
                    <View style={{marginTop: 8}}>
                      <View style={styles.scanWrap}>
                        <TouchableOpacity
                          style={[
                            styles.scanCameraBtn,
                            row.scannedQty >= row.orderedQty &&
                              styles.scanCameraBtnDone,
                          ]}
                          disabled={row.scannedQty >= row.orderedQty}
                          onPress={() => setScanRowIndex(i)}>
                          <Text style={styles.scanCameraBtnTxt}>
                            {row.scannedQty >= row.orderedQty
                              ? `✓ ${t('Verified')}`
                              : `📷 ${t('Scan')}`}
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.muted,
                            row.lastScanMismatch && {color: Constants.red},
                          ]}>
                          {row.lastScanMismatch
                            ? t('Wrong item')
                            : `${row.scannedQty}/${row.orderedQty} ${t('scanned')}`}
                        </Text>
                      </View>
                      <View style={[styles.scanWrap, {marginTop: 6}]}>
                        <TextInput
                          style={styles.scanInput}
                          value={row.scanInput}
                          onChangeText={v => updateRow(i, {scanInput: v})}
                          placeholder={t('or enter barcode manually')}
                          placeholderTextColor={Constants.customgrey}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.scanBtn}
                          onPress={() => verifyScan(i)}>
                          <Text style={styles.scanBtnTxt}>{t('Verify')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {hasShortage && (
                    <View style={{marginTop: 8}}>
                      <Dropdown
                        style={styles.reasonDropdown}
                        data={QUANTITY_MISMATCH_REASONS.map(r => ({
                          label: r,
                          value: r,
                        }))}
                        value={row.reason}
                        onChange={it => updateRow(i, {reason: it.value})}
                        placeholder={t('Reason for shortage')}
                        placeholderStyle={{color: Constants.customgrey, fontSize: 13}}
                        selectedTextStyle={{color: Constants.black, fontSize: 13}}
                        labelField="label"
                        valueField="value"
                        maxHeight={220}
                      />
                      {row.reason === 'Other (Please specify)' && (
                        <TextInput
                          style={styles.reasonNote}
                          value={row.note}
                          onChangeText={v => updateRow(i, {note: v})}
                          placeholder={t('Specify reason...')}
                          placeholderTextColor={Constants.customgrey}
                          multiline
                        />
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={styles.qtyTotals}>
              <Text style={styles.qtyTotalTxt}>
                {t('Received')}: {totalReceived}/{totalPacked}
              </Text>
              <Text style={[styles.qtyTotalTxt, {color: Constants.red}]}>
                {t('Shortage')}: {totalShortage}
              </Text>
              <Text style={[styles.qtyTotalTxt, {color: Constants.red}]}>
                {t('Est. Refund')}: $ {totalRefund.toFixed(2)}
              </Text>
            </View>

            {/* Photos */}
            <Text style={styles.sectionTitle}>{t('REQUIRED PHOTOS')}</Text>
            {photoLabels.map((label, index) => (
              <View key={index} style={styles.photoBox}>
                <Text style={styles.photoLabel}>{label}</Text>
                <View style={{flexDirection: 'row', gap: 8, marginTop: 6}}>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => pickPhoto(index, true)}>
                    <Text style={styles.photoBtnTxt}>📷 {t('Camera')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => pickPhoto(index, false)}>
                    <Text style={styles.photoBtnTxt}>🖼 {t('Gallery')}</Text>
                  </TouchableOpacity>
                </View>
                {(photos[index] || []).length > 0 && (
                  <View style={styles.thumbRow}>
                    {photos[index].map((url, pIdx) => (
                      <View key={pIdx} style={styles.thumbWrap}>
                        <Image source={{uri: url}} style={styles.thumb} />
                        <TouchableOpacity
                          style={styles.thumbRemove}
                          onPress={() => removePhoto(index, pIdx)}>
                          <Text style={{color: '#fff', fontSize: 12}}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Video (optional) */}
            <Text style={styles.sectionTitle}>{t('PACKING VIDEO (optional)')}</Text>
            <View style={styles.photoBox}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickVideo}>
                <Text style={styles.photoBtnTxt}>🎥 {t('Record / Add video')}</Text>
              </TouchableOpacity>
              {videos.length > 0 && (
                <Text style={styles.muted}>
                  {videos.length} {t('video(s) added')}
                </Text>
              )}
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <OrderInvoice
              order={order}
              productItem={liveInvoice.productItem}
              totalAmount={liveInvoice.totalAmount}
              productsCount={liveInvoice.productsCount}
              compact
            />
            <TouchableOpacity
              style={[styles.submitBtn, !ready && {backgroundColor: '#D1D5DB'}]}
              disabled={!ready}
              onPress={submit}>
              <Text style={styles.submitTxt}>
                {t('SUBMIT')} {type === 'shipment' ? t('SHIPMENT') : t('ORDER')}
              </Text>
            </TouchableOpacity>
          </View>

          <BarcodeScannerModal
            visible={scanRowIndex != null}
            onClose={() => setScanRowIndex(null)}
            onDetected={onBarcodeDetected}
            title={
              scanRowIndex != null
                ? `${t('Scan')}: ${rows[scanRowIndex]?.name || ''}`
                : t('Scan Barcode')
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const Row = ({label, value, valueColor, bold}) => (
  <View style={styles.kvRow}>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text
      style={[
        styles.kvValue,
        bold && {fontFamily: FONTS.Bold},
        valueColor && {color: valueColor},
      ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)'},
  card: {
    flex: 1,
    marginTop: 40,
    backgroundColor: '#F4F5F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 16},
  close: {color: '#fff', fontSize: 20},
  sectionTitle: {
    fontFamily: FONTS.Bold,
    fontSize: 13,
    color: BRAND,
    marginTop: 16,
    marginBottom: 6,
  },
  panel: {backgroundColor: '#fff', borderRadius: 12, padding: 12},
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  kvLabel: {fontFamily: FONTS.Medium, fontSize: 13, color: '#4B5563', flex: 1},
  kvValue: {fontFamily: FONTS.Medium, fontSize: 14, color: Constants.black},
  moneyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 6,
    paddingHorizontal: 8,
    width: 130,
  },
  moneyInput: {flex: 1, textAlign: 'right', color: Constants.black, paddingVertical: 6},
  checkItem: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BRAND,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: BRAND},
  checkMark: {color: '#fff', fontSize: 13},
  checkItemTxt: {flex: 1, fontFamily: FONTS.Regular, fontSize: 13, color: '#374151'},
  muted: {fontFamily: FONTS.Regular, fontSize: 11, color: Constants.customgrey, marginTop: 4},
  qtyRow: {backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10},
  qtyHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  qtyImg: {width: 40, height: 40, borderRadius: 6},
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22C55E',
    color: '#fff',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
    overflow: 'hidden',
  },
  qtyName: {fontFamily: FONTS.Medium, fontSize: 13, color: Constants.black},
  qtyGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 10},
  qtyCell: {width: '25%', alignItems: 'center', paddingVertical: 4},
  qtyCellLabel: {fontFamily: FONTS.Regular, fontSize: 10, color: Constants.customgrey},
  qtyCellVal: {fontFamily: FONTS.Bold, fontSize: 14, color: Constants.black, marginTop: 2},
  qtyInput: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 6,
    width: 54,
    textAlign: 'center',
    paddingVertical: 4,
    marginTop: 2,
    color: Constants.black,
  },
  scanWrap: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8},
  scanInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: Constants.black,
    fontSize: 12,
  },
  scanBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  scanBtnTxt: {color: '#fff', fontFamily: FONTS.Medium, fontSize: 12},
  scanCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  scanCameraBtnDone: {backgroundColor: '#DCFCE7', borderColor: BRAND},
  scanCameraBtnTxt: {color: BRAND, fontFamily: FONTS.Medium, fontSize: 12},
  reasonDropdown: {
    borderWidth: 1,
    borderColor: Constants.red,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
  },
  reasonNote: {
    borderWidth: 1,
    borderColor: Constants.red,
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    color: Constants.black,
    fontSize: 12,
    minHeight: 40,
  },
  qtyTotals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  qtyTotalTxt: {fontFamily: FONTS.Bold, fontSize: 12, color: Constants.black},
  photoBox: {backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8},
  photoLabel: {fontFamily: FONTS.Regular, fontSize: 12, color: '#374151'},
  photoBtn: {
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoBtnTxt: {color: BRAND, fontFamily: FONTS.Medium, fontSize: 12},
  thumbRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  thumbWrap: {position: 'relative'},
  thumb: {width: 60, height: 60, borderRadius: 6},
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Constants.red,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  errorTxt: {color: '#B91C1C', fontFamily: FONTS.Regular, fontSize: 12},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 13},
});

export default OrderChecklistModal;
