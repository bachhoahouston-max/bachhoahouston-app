/* eslint-disable react-native/no-inline-styles */
/* Full order-detail screen for staff — RN port of the order-detail drawer in
 * grocerypickup-admin/pages/orders.js (and OrderDetailDrawer.js).
 *
 * Covers: category-grouped item breakdown with packed/shortage/refund/tax +
 * combo free rows, order barcode, delivery-info block, status banners, verify
 * with secret code, cancel with reason, switch delivery option, add note +
 * note history, proof-of-delivery, completed-checklist summary, UPS tracking,
 * confirm delivered / edit tracking, and the invoice PDF. */
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {Toast} from 'toastify-react-native';
import {useTranslation} from 'react-i18next';
import moment from 'moment';
import Constants, {Currency, FONTS} from '../../Assets/Helpers/constant';
import {LoadContext, UserContext} from '../../../App';
import {Post, GetApi} from '../../Assets/Helpers/Service';
import {goBack} from '../../../navigationRef';
import Barcode from '../../Assets/Component/Barcode';
import OrderInvoice from './components/OrderInvoice';
import ShipAddressModal from './components/ShipAddressModal';
import {
  BRAND,
  DELIVERY_OPTIONS,
  currentDeliveryValue,
  deliveryLabel,
  fmtDate,
  fmtDateTime,
  buildInvoiceData,
  computeOrderQty,
  groupByCategory,
  rowShortageStatus,
  statusStyle,
} from '../../Assets/Helpers/orderUtils';

const Section = ({title, children}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const KV = ({label, value}) =>
  value === undefined || value === null || value === '' ? null : (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{String(value)}</Text>
    </View>
  );

const Banner = ({color, bg, text}) => (
  <View style={[styles.banner, {backgroundColor: bg, borderLeftColor: color}]}>
    <Text style={[styles.bannerTxt, {color}]}>{text}</Text>
  </View>
);

const EmployeeOrderDetail = props => {
  const {t} = useTranslation();
  const [, setLoading] = useContext(LoadContext);
  const [user] = useContext(UserContext);
  const [order, setOrder] = useState(props.route.params?.order || {});

  const [note, setNote] = useState('');
  const [noteHistory, setNoteHistory] = useState(order?.noteHistory || []);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [secretOpen, setSecretOpen] = useState(false);
  const [secret, setSecret] = useState('');
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackNo, setTrackNo] = useState(order?.trackingNo || '');
  const [trackCompany, setTrackCompany] = useState(order?.trackingLink || '');
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [savingShip, setSavingShip] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState(null);
  const [tracking, setTracking] = useState(null);

  const invoice = useMemo(() => buildInvoiceData(order), [order]);
  const totalItems = useMemo(() => computeOrderQty(order), [order]);
  const st = statusStyle(order?.status);

  const deliveryOptions = DELIVERY_OPTIONS.filter(
    o => o.value !== currentDeliveryValue(order),
  );

  useEffect(() => {
    if (order?.isShipmentDelivery && order?.trackingNo) {
      getTracking(order.trackingNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    if (!order?.orderId) return;
    setLoading(true);
    Post(`NewgetOrderBySeller?page=1&limit=1`, {orderId: order.orderId})
      .then(res => {
        setLoading(false);
        const fresh = res?.data?.[0];
        if (fresh) {
          setOrder(fresh);
          setNoteHistory(fresh.noteHistory || []);
        }
      })
      .catch(() => setLoading(false));
  };

  const getTracking = num => {
    setLoading(true);
    GetApi(`getTrackingDetails/${num}`, {})
      .then(res => {
        setLoading(false);
        setTracking(res?.data || null);
      })
      .catch(() => setLoading(false));
  };

  const call = (url, body, okMsg, after) => {
    setLoading(true);
    Post(url, body)
      .then(res => {
        setLoading(false);
        if (res?.status === false && !res?.order && !res?.data) {
          Toast.error(res?.message || t('Something went wrong'));
          return;
        }
        Toast.success(okMsg);
        after && after();
        refresh();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const addNote = () => {
    if (!note.trim()) return Toast.error(t('Please enter a note'));
    setLoading(true);
    Post('AddNote', {id: order._id, note})
      .then(res => {
        setLoading(false);
        Toast.success(t('Note added successfully'));
        setNote('');
        setNoteHistory(res?.data?.noteHistory || res?.noteHistory || []);
        refresh();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const cancelOrder = () => {
    if (!reason.trim())
      return Toast.error(t('Please write a reason to cancel the order'));
    call('cancalOrderfromAdmin', {id: order._id, reason}, t('Order cancelled successfully'), () => {
      setCancelOpen(false);
      setReason('');
    });
  };

  const verifySecret = () => {
    setLoading(true);
    Post('verifyOrderStatusWithCode', {
      SecretCode: String(secret).trim(),
      id: order._id,
      status: 'Completed',
    })
      .then(res => {
        setLoading(false);
        if (res?.error || res?.status === false) {
          Toast.error(res?.error || res?.message || t('Verification failed'));
          return;
        }
        Toast.success(t('Verified successfully'));
        setSecret('');
        setSecretOpen(false);
        refresh();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Verification failed'));
      });
  };

  const sendTracking = () => {
    call(
      'updateTrackingInfo',
      {id: order._id, trackingNo: trackNo, trackingLink: trackCompany},
      t('Tracking info updated successfully'),
      () => setTrackOpen(false),
    );
  };

  const confirmDelivered = () =>
    call('changeorderstatus', {id: order._id, status: 'Completed'}, t('Order marked as completed'));

  const returnConfirm = () =>
    call('ReturnConform', {id: order._id}, t('Return confirmed successfully'));

  const doSwitch = (opt, addressData) => {
    const body = {id: order._id, ...opt, label: opt.label};
    if (addressData) body.Local_address = addressData;
    setSavingShip(!!addressData);
    setLoading(true);
    Post('switchToShipment', body)
      .then(res => {
        setLoading(false);
        setSavingShip(false);
        setShipModalOpen(false);
        setPendingSwitch(null);
        setSelectedOpt(null);
        if (res?.status === false && !res?.order) {
          Toast.error(res?.message || t('Failed to switch delivery option'));
          return;
        }
        Toast.success(`${t('Order switched to')} ${opt.label}`);
        refresh();
      })
      .catch(err => {
        setLoading(false);
        setSavingShip(false);
        Toast.error(err?.message || t('Failed to switch delivery option'));
      });
  };

  const onSwitchPress = () => {
    const opt = deliveryOptions.find(o => o.value === selectedOpt);
    if (!opt) return Toast.error(t('Please select a delivery option'));
    if (opt.isLocalDelivery || opt.isShipmentDelivery) {
      setPendingSwitch(opt);
      setShipModalOpen(true);
    } else {
      doSwitch(opt);
    }
  };

  const cats = groupByCategory(order?.productDetail || []);
  const isCancel = order?.status === 'Cancel';
  const isCompleted = order?.status === 'Completed';
  const canAct = !isCancel && !isCompleted;
  const checklist = order?.checklist;
  const pkg = tracking?.package?.[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ {t('Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Order Details')}</Text>
        <OrderInvoice
          order={order}
          productItem={invoice.productItem}
          totalAmount={invoice.totalAmount}
          productsCount={invoice.productsCount}
          compact
        />
      </View>

      <ScrollView contentContainerStyle={{padding: 14, paddingBottom: 120}}>
        {/* Status */}
        <View style={[styles.statusPill, {backgroundColor: st.bg}]}>
          <View style={[styles.dot, {backgroundColor: st.dot}]} />
          <Text style={[styles.statusPillTxt, {color: st.text}]}>{st.label}</Text>
        </View>

        {isCancel && (
          <Banner
            color="#B91C1C"
            bg="#FEE2E2"
            text={t('This order has been cancelled')}
          />
        )}
        {isCompleted && (
          <Banner
            color="#15803D"
            bg="#DCFCE7"
            text={t('Order has been delivered successfully')}
          />
        )}
        {order?.status === 'Return' && (
          <Banner
            color="#15803D"
            bg="#DCFCE7"
            text={t('Order has been returned successfully')}
          />
        )}

        {/* Customer */}
        <Section title={t('Customer')}>
          <KV label={t('Name')} value={`${order?.user?.username || ''} ${order?.user?.lastname || ''}`.trim()} />
          <KV label={t('Email')} value={order?.user?.email} />
          <KV label={t('Mobile')} value={order?.user?.number} />
          <KV label={t('Order #')} value={order?.orderId} />
          <KV label={t('Platform')} value={(order?.order_platform || '').toUpperCase()} />
          <KV label={t('Order Date')} value={fmtDate(order?.createdAt)} />
        </Section>

        {/* Items */}
        <Section title={t('Order Items')}>
          {cats.map(({cat, items}) => (
            <View key={cat} style={{marginBottom: 8}}>
              <Text style={styles.catHeading}>{cat}</Text>
              {items.map((item, i) => {
                const shortage = Number(item?.shortage || 0);
                const packed =
                  item?.fullfillQty !== undefined && item?.fullfillQty !== null
                    ? item.fullfillQty
                    : item?.qty;
                const rs = rowShortageStatus(item);
                return (
                  <View key={`${cat}-${i}`}>
                    <View style={styles.itemRow}>
                      <Image
                        source={
                          item?.image?.[0]
                            ? {uri: item.image[0]}
                            : require('../../Assets/Images/veg.png')
                        }
                        style={styles.itemImg}
                        resizeMode="contain"
                      />
                      <View style={{flex: 1}}>
                        <Text style={styles.itemName}>{item?.product?.name}</Text>
                        <View style={styles.itemMetaRow}>
                          <Text style={styles.itemMeta}>
                            {t('Qty')}: {item?.qty}
                          </Text>
                          <Text style={styles.itemMeta}>
                            {t('Packed')}: {packed}
                          </Text>
                          <Text style={styles.itemMeta}>
                            {Currency}
                            {(Number(item?.price) * Number(item?.qty)).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.itemMetaRow}>
                          <Text
                            style={[
                              styles.itemMeta,
                              {color: shortage > 0 ? Constants.red : BRAND},
                            ]}>
                            {t('Shortage')}: {shortage}
                          </Text>
                          {Number(item?.taxAmount || 0) > 0 && (
                            <Text style={styles.itemMeta}>
                              {t('Tax')}: {Currency}
                              {Number(item.taxAmount).toFixed(2)}
                            </Text>
                          )}
                          {Number(item?.refundAmount || 0) > 0 && (
                            <Text style={[styles.itemMeta, {color: Constants.red}]}>
                              {t('Refund')}: {Currency}
                              {Number(item.refundAmount).toFixed(2)}
                            </Text>
                          )}
                          <Text style={[styles.itemMeta, {color: rs.color}]}>
                            {rs.label}
                          </Text>
                        </View>
                        {!!item?.reason && (
                          <Text style={styles.itemReason}>
                            {t('Reason')}: {item.reason}
                          </Text>
                        )}
                      </View>
                    </View>

                    {item?.combo_id?.free_product?.map((fp, idx) => {
                      const ff = item?.freeProductFulfillment?.find(
                        f => f?.product == fp?.product?._id,
                      );
                      const fShort = Number(ff?.shortage || 0);
                      return (
                        <View
                          key={`free-${cat}-${i}-${idx}`}
                          style={[styles.itemRow, {backgroundColor: '#F0FDF4'}]}>
                          <Text style={styles.freeBadge}>FREE</Text>
                          <View style={{flex: 1}}>
                            <Text style={styles.itemName}>
                              {fp?.product?.name || t('Free Product')}
                            </Text>
                            <Text
                              style={[
                                styles.itemMeta,
                                {color: fShort > 0 ? Constants.red : BRAND},
                              ]}>
                              {t('Shortage')}: {fShort}
                              {ff?.reason ? ` — ${ff.reason}` : ''}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ))}
        </Section>

        {/* Barcode */}
        {!!order?.orderId && (
          <View style={styles.barcodeWrap}>
            <Barcode value={order.orderId} />
          </View>
        )}

        {/* Delivery Information */}
        <Section title={t('Delivery Information')}>
          <KV label={t('Delivery Type')} value={deliveryLabel(order)} />
          {order?.isOrderPickup && (
            <KV
              label={t('Pickup Date')}
              value={fmtDate(order?.dateOfDelivery) || t('No Date')}
            />
          )}
          {(order?.isLocalDelivery || order?.isShipmentDelivery) && (
            <>
              <KV label={t('Apartment No')} value={order?.Local_address?.ApartmentNo} />
              <KV
                label={t('Business Address')}
                value={order?.Local_address?.BusinessAddress}
              />
              <KV
                label={t('Security Gate Code')}
                value={order?.Local_address?.SecurityGateCode}
              />
            </>
          )}
          {order?.isLocalDelivery && (
            <>
              <KV label={t('Delivery Date')} value={fmtDate(order?.dateOfDelivery)} />
              <KV label={t('Zipcode')} value={order?.Local_address?.zipcode} />
              <KV label={t('Delivery Address')} value={order?.Local_address?.address} />
            </>
          )}
          {order?.isDriveUp && (
            <>
              <KV label={t('Pickup Date')} value={fmtDate(order?.dateOfDelivery)} />
              <KV label={t('Parking Spot')} value={order?.parkingNo} />
              <KV label={t('Car Brand')} value={order?.carBrand} />
              <KV label={t('Car Color')} value={order?.carColor} />
            </>
          )}
          {order?.isShipmentDelivery && (
            <>
              <KV label={t('Delivery Address')} value={order?.Local_address?.address} />
              <KV label={t('Shipping Company')} value={order?.trackingLink} />
              <KV label={t('Tracking Number')} value={order?.trackingNo} />
            </>
          )}
        </Section>

        {/* Shipment: edit tracking / confirm delivered */}
        {order?.isShipmentDelivery && order?.status === 'Shipped' && (
          <View style={styles.rowBtns}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setTrackNo(order?.trackingNo || '');
                setTrackCompany(order?.trackingLink || '');
                setTrackOpen(true);
              }}>
              <Text style={styles.secondaryTxt}>{t('Edit Tracking Info')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={confirmDelivered}>
              <Text style={styles.primaryTxt}>{t('Confirm Order Delivered')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {order?.status === 'Return Requested' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={returnConfirm}>
            <Text style={styles.primaryTxt}>{t('Confirm Return')}</Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        {canAct && (
          <Section title={t('Actions')}>
            {!!order?.SecretCode && (order?.isDriveUp || order?.isOrderPickup) && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setSecretOpen(true)}>
                <Text style={styles.primaryTxt}>{t('Verify Order')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, {marginTop: 8}]}
              onPress={() => setCancelOpen(true)}>
              <Text style={styles.primaryTxt}>{t('Cancel Order')}</Text>
            </TouchableOpacity>

            <Text style={[styles.kvLabel, {marginTop: 12}]}>
              {t('Switch Delivery Option')}
            </Text>
            <View style={{flexDirection: 'row', gap: 8, marginTop: 4}}>
              <Dropdown
                style={styles.optionDropdown}
                data={deliveryOptions.map(o => ({label: o.label, value: o.value}))}
                value={selectedOpt}
                onChange={it => setSelectedOpt(it.value)}
                placeholder={t('Select Delivery Option')}
                placeholderStyle={{color: Constants.customgrey, fontSize: 13}}
                selectedTextStyle={{color: Constants.black, fontSize: 13}}
                labelField="label"
                valueField="value"
                maxHeight={220}
              />
              <TouchableOpacity style={styles.switchBtn} onPress={onSwitchPress}>
                <Text style={styles.primaryTxt}>{t('Switch')}</Text>
              </TouchableOpacity>
            </View>
          </Section>
        )}

        {/* Notes */}
        <Section title={t('Add a Note')}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={t('Enter your note here...')}
            placeholderTextColor={Constants.customgrey}
            multiline
          />
          <TouchableOpacity
            style={[styles.primaryBtn, {alignSelf: 'flex-end', marginTop: 8}]}
            onPress={addNote}>
            <Text style={styles.primaryTxt}>{t('Add Note')}</Text>
          </TouchableOpacity>

          {noteHistory.length > 0 && (
            <View style={{marginTop: 12}}>
              <Text style={styles.kvLabel}>{t('Note History')}</Text>
              {[...noteHistory].reverse().map((e, i) => (
                <View key={i} style={styles.noteEntry}>
                  <Text style={styles.noteEntryTxt}>{e.note}</Text>
                  <View style={styles.noteEntryMeta}>
                    <Text style={styles.noteBy}>{e.createdBy}</Text>
                    <Text style={styles.noteDate}>
                      {moment(e.createdAt).format('MMM D, YYYY hh:mm A')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Proof of delivery */}
        {isCompleted &&
          order?.isLocalDelivery &&
          order?.proofOfDelivery?.length > 0 && (
            <Section title={t('Proof of Delivery')}>
              <View style={styles.photoGrid}>
                {order.proofOfDelivery.map((url, i) => (
                  <Image key={i} source={{uri: url}} style={styles.proofImg} />
                ))}
              </View>
            </Section>
          )}

        {/* Completed checklist summary */}
        {checklist?.completedAt && (
          <Section title={t('Checklist Completed & Signed Off')}>
            {checklist.items?.map((c, i) => (
              <Text key={i} style={styles.checkLine}>
                {c.checked ? '✓' : '✗'} {c.label}
              </Text>
            ))}
            <View style={styles.checkMetaRow}>
              <KV label={t('Employee')} value={checklist.employeeName} />
              <KV
                label={t('Date')}
                value={fmtDateTime(checklist.completedAt)}
              />
            </View>

            <Text style={[styles.kvLabel, {marginTop: 8}]}>
              {t('Payment Verification')}
            </Text>
            <KV
              label={t('Invoice Total')}
              value={`${Currency}${Number(checklist.invoiceTotal || 0).toFixed(2)}`}
            />
            <KV
              label={t('Stripe Payment Received')}
              value={`${Currency}${Number(
                checklist.stripePaymentReceived || 0,
              ).toFixed(2)}`}
            />
            <KV
              label={t('Shortage')}
              value={`${Currency}${Number(
                checklist.paymentDifference || 0,
              ).toFixed(2)}`}
            />

            {Array.isArray(checklist.quantityVerification) &&
              checklist.quantityVerification.length > 0 && (
                <>
                  <Text style={[styles.kvLabel, {marginTop: 8}]}>
                    {t('Quantity Verification')}
                  </Text>
                  {checklist.quantityVerification.map((r, i) => (
                    <View key={r.productId || i} style={styles.qvRow}>
                      <Text style={styles.qvName}>{r.name}</Text>
                      <Text style={styles.qvMeta}>
                        {t('Packed')} {Number(r.packedQty || r.qty || 0)} · {t('Recv')}{' '}
                        {Number(r.receivedQty ?? r.fullfillQty ?? 0)} · {t('Short')}{' '}
                        <Text style={{color: Number(r.shortage) > 0 ? Constants.red : BRAND}}>
                          {Number(r.shortage || 0)}
                        </Text>
                      </Text>
                      {Number(r.shortage) > 0 && !!r.reason && (
                        <Text style={styles.qvReason}>{r.reason}</Text>
                      )}
                    </View>
                  ))}
                </>
              )}

            {checklist.photos?.filter(Boolean).length > 0 && (
              <>
                <Text style={[styles.kvLabel, {marginTop: 8}]}>{t('Photos')}</Text>
                <View style={styles.photoGrid}>
                  {checklist.photos.filter(Boolean).map((url, i) => (
                    <Image key={i} source={{uri: url}} style={styles.proofImg} />
                  ))}
                </View>
              </>
            )}
          </Section>
        )}

        {/* UPS tracking */}
        {order?.isShipmentDelivery && (
          <Section title={t('Tracking Information From UPS')}>
            {!tracking?.inquiryNumber ? (
              <Text style={styles.muted}>{t('No tracking data available')}</Text>
            ) : (
              <>
                <KV label={t('Tracking Number')} value={tracking.inquiryNumber} />
                <KV
                  label={t('Current Status')}
                  value={pkg?.currentStatus?.description || 'N/A'}
                />
                <KV label={t('Service')} value={pkg?.service?.description} />
                <KV
                  label={t('Weight')}
                  value={
                    pkg?.weight
                      ? `${pkg.weight.weight} ${pkg.weight.unitOfMeasurement}`
                      : undefined
                  }
                />
                <KV
                  label={t('Latest Update')}
                  value={pkg?.activity?.[0]?.status?.description || t('No updates yet')}
                />
              </>
            )}
          </Section>
        )}
      </ScrollView>

      {/* Totals footer */}
      <View style={styles.footer}>
        <View style={styles.footerCell}>
          <Text style={styles.footerTxt}>
            {t('Total')}: {Currency}
            {invoice.totalAmount?.toFixed(2)}
          </Text>
        </View>
        <View style={styles.footerCell}>
          <Text style={styles.footerTxt}>
            {t('Items')}: {totalItems}
          </Text>
        </View>
      </View>

      {/* Cancel modal */}
      <Modal visible={cancelOpen} transparent animationType="fade" onRequestClose={() => setCancelOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('Reason for Order Cancellation')}</Text>
            <Text style={styles.muted}>
              {t('Order ID')}: {order?.orderId}
            </Text>
            <TextInput
              style={[styles.noteInput, {minHeight: 100, marginTop: 10}]}
              value={reason}
              onChangeText={setReason}
              placeholder={t('Type your reason here...')}
              placeholderTextColor={Constants.customgrey}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCancelOpen(false)}>
                <Text style={styles.modalCancelTxt}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={cancelOrder}>
                <Text style={styles.primaryTxt}>{t('Order Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secret code modal */}
      <Modal visible={secretOpen} transparent animationType="fade" onRequestClose={() => setSecretOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('Secret Code to Verify Order')}</Text>
            <TextInput
              style={[styles.noteInput, {minHeight: 44, marginTop: 10}]}
              value={secret}
              onChangeText={setSecret}
              placeholder={t('Enter Secret Code')}
              placeholderTextColor={Constants.customgrey}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSecretOpen(false)}>
                <Text style={styles.modalCancelTxt}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={verifySecret}>
                <Text style={styles.primaryTxt}>{t('Verify')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracking modal */}
      <Modal visible={trackOpen} transparent animationType="fade" onRequestClose={() => setTrackOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('Tracking Info')}</Text>
            <Text style={styles.kvLabel}>{t('Tracking No')}</Text>
            <TextInput
              style={[styles.noteInput, {minHeight: 44}]}
              value={trackNo}
              onChangeText={setTrackNo}
              placeholder={t('Enter tracking number')}
              placeholderTextColor={Constants.customgrey}
            />
            <Text style={[styles.kvLabel, {marginTop: 8}]}>{t('Company Name')}</Text>
            <TextInput
              style={[styles.noteInput, {minHeight: 44}]}
              value={trackCompany}
              onChangeText={setTrackCompany}
              placeholder={t('Company Name')}
              placeholderTextColor={Constants.customgrey}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTrackOpen(false)}>
                <Text style={styles.modalCancelTxt}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={sendTracking}>
                <Text style={styles.primaryTxt}>{t('Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ShipAddressModal
        open={shipModalOpen}
        deliveryLabel={pendingSwitch?.label}
        initialValues={order?.user}
        submitting={savingShip}
        onCancel={() => {
          setShipModalOpen(false);
          setPendingSwitch(null);
          setSelectedOpt(null);
        }}
        onSubmit={addr => doSwitch(pendingSwitch, addr)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Constants.lightgrey},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Constants.greennew,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backBtn: {paddingRight: 8},
  backTxt: {color: '#fff', fontFamily: FONTS.Medium, fontSize: 15},
  headerTitle: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 17, flex: 1, marginLeft: 6},
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {fontFamily: FONTS.Bold, fontSize: 14, color: BRAND, marginBottom: 8},
  kv: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12},
  kvLabel: {fontFamily: FONTS.Medium, fontSize: 13, color: '#6B7280'},
  kvValue: {fontFamily: FONTS.Regular, fontSize: 13, color: Constants.black, flexShrink: 1, textAlign: 'right'},
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  dot: {width: 7, height: 7, borderRadius: 4, marginRight: 6},
  statusPillTxt: {fontFamily: FONTS.Bold, fontSize: 11},
  banner: {borderLeftWidth: 4, padding: 12, borderRadius: 6, marginBottom: 10},
  bannerTxt: {fontFamily: FONTS.Medium, fontSize: 13},
  catHeading: {
    fontFamily: FONTS.Bold,
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    alignItems: 'flex-start',
  },
  itemImg: {width: 40, height: 40, borderRadius: 4, backgroundColor: '#FAFAFA'},
  itemName: {fontFamily: FONTS.Medium, fontSize: 13, color: Constants.black},
  itemMetaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 3},
  itemMeta: {fontFamily: FONTS.Regular, fontSize: 11, color: '#4B5563'},
  itemReason: {fontFamily: FONTS.Regular, fontSize: 11, color: '#6B7280', marginTop: 2},
  freeBadge: {
    backgroundColor: '#22C55E',
    color: '#fff',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  barcodeWrap: {alignItems: 'center', marginBottom: 12},
  rowBtns: {flexDirection: 'row', gap: 8, marginBottom: 12},
  primaryBtn: {
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 13},
  secondaryBtn: {
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    flex: 1,
  },
  secondaryTxt: {color: BRAND, fontFamily: FONTS.Medium, fontSize: 13},
  optionDropdown: {
    flex: 1,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  switchBtn: {
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    padding: 10,
    color: Constants.black,
    fontFamily: FONTS.Regular,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteEntry: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  noteEntryTxt: {fontFamily: FONTS.Regular, fontSize: 13, color: Constants.black},
  noteEntryMeta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6},
  noteBy: {fontFamily: FONTS.Medium, fontSize: 11, color: BRAND},
  noteDate: {fontFamily: FONTS.Regular, fontSize: 11, color: '#9CA3AF'},
  photoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  proofImg: {width: 90, height: 90, borderRadius: 6},
  checkLine: {fontFamily: FONTS.Regular, fontSize: 12, color: '#374151', paddingVertical: 2},
  checkMetaRow: {marginTop: 6},
  qvRow: {borderTopWidth: 1, borderTopColor: '#F1F1F1', paddingVertical: 6},
  qvName: {fontFamily: FONTS.Medium, fontSize: 12, color: Constants.black},
  qvMeta: {fontFamily: FONTS.Regular, fontSize: 11, color: '#4B5563', marginTop: 2},
  qvReason: {fontFamily: FONTS.Regular, fontSize: 11, color: '#6B7280', marginTop: 2},
  muted: {fontFamily: FONTS.Regular, fontSize: 12, color: Constants.customgrey},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerCell: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 14},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {backgroundColor: '#fff', borderRadius: 14, padding: 18},
  modalTitle: {fontFamily: FONTS.Bold, fontSize: 16, color: Constants.black, marginBottom: 6},
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14},
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelTxt: {fontFamily: FONTS.Medium, color: '#374151'},
});

export default EmployeeOrderDetail;
