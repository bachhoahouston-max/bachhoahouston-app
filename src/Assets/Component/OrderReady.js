/* eslint-disable react-native/no-inline-styles */
/* Per-order inline action / status control for the staff order list.
 * RN port of the OrderReady cell in grocerypickup-admin/pages/orders.js —
 * covers every pickup / drive-up / local-delivery / shipment badge + action,
 * and routes "Order Ready", "Add Tracking Info" and "Assign Order" through the
 * packing checklist first (OrderChecklistModal). */
import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import {GetApi, Post} from '../Helpers/Service';
import Constants, {FONTS} from '../Helpers/constant';
import {useTranslation} from 'react-i18next';
import {Toast} from 'toastify-react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {LoadContext} from '../../../App';
import {BRAND, fmtShort} from '../Helpers/orderUtils';
import OrderChecklistModal from '../../screen/Employee/components/OrderChecklistModal';

const Badge = ({label, bg, color}) => (
  <View style={[styles.badge, {backgroundColor: bg}]}>
    <Text style={[styles.badgeTxt, {color}]}>{label}</Text>
  </View>
);

const ActionBadge = ({label, onPress}) => (
  <TouchableOpacity style={styles.actionBadge} onPress={onPress}>
    <Text style={styles.actionBadgeTxt}>{label}</Text>
  </TouchableOpacity>
);

const OrderReady = ({row, getProducts}) => {
  const {t} = useTranslation();
  const order = row;
  const [, setLoading] = useContext(LoadContext);

  const [confirmPrep, setConfirmPrep] = useState(false);
  const [trackModal, setTrackModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [checklist, setChecklist] = useState({open: false, type: null});
  const [driverList, setDriverList] = useState([]);
  const [form, setForm] = useState({trackingNo: '', companyName: '', driverId: ''});

  const shouldShowPickup = order.isDriveUp === true || order.isOrderPickup === true;
  const isCompleted = order.status === 'Completed';
  const isCancel = order.status === 'Cancel';
  const inProcess = order.status === 'Preparing';

  useEffect(() => {
    if (assignModal) {
      GetApi('getVerifiedDriverList', {})
        .then(res => setDriverList(res?.data || []))
        .catch(() => {});
    }
  }, [assignModal]);

  const openChecklist = type => setChecklist({open: true, type});
  const closeChecklist = () => setChecklist({open: false, type: null});

  const markPreparing = () => {
    setConfirmPrep(false);
    setLoading(true);
    Post('markOrderAsPreparing', {orderId: order._id})
      .then(res => {
        setLoading(false);
        Toast.success(res?.message || t('Order is preparing'));
        getProducts && getProducts();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const orderReady = () => {
    setLoading(true);
    Post('orderreadyNotification', {id: order._id})
      .then(res => {
        setLoading(false);
        Toast.success(res?.message || t('Notification sent successfully'));
        getProducts && getProducts();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const returnOrder = () => {
    setLoading(true);
    Post('ReturnConform', {id: order._id})
      .then(res => {
        setLoading(false);
        if (res?.status === false) {
          Toast.error(res?.message || t('Failed to confirm return'));
          return;
        }
        Toast.success(res?.message || t('Return confirmed successfully'));
        getProducts && getProducts();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const submitTracking = () => {
    setLoading(true);
    Post('updateTrackingInfo', {
      id: order._id,
      trackingNo: form.trackingNo,
      trackingLink: form.companyName,
    })
      .then(res => {
        setLoading(false);
        if (res?.status === false && !res?.order) {
          Toast.error(res?.message || t('Failed to update tracking info'));
          return;
        }
        Toast.success(t('Tracking info updated successfully'));
        setTrackModal(false);
        setForm({trackingNo: '', companyName: '', driverId: ''});
        getProducts && getProducts();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const submitAssign = () => {
    if (!form.driverId) return Toast.error(t('Please select a driver'));
    setLoading(true);
    Post('assignDriver', {orderId: order._id, driverId: form.driverId})
      .then(res => {
        setLoading(false);
        if (res?.status === false && !res?.data) {
          Toast.error(res?.message || t('Failed to assign driver'));
          return;
        }
        Toast.success(t('Order assigned to driver successfully'));
        setAssignModal(false);
        setForm({trackingNo: '', companyName: '', driverId: ''});
        getProducts && getProducts();
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const Delivered = () => (
    <View style={{alignItems: 'center'}}>
      <Badge label={t('Delivered')} bg="#DCFCE7" color="#15803D" />
      {!!order.deliveredAt && (
        <Text style={styles.stamp}>{fmtShort(order.deliveredAt)}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isCancel ? (
        <Badge label={t('Order Cancelled')} bg="#FEE2E2" color="#B91C1C" />
      ) : (
        <>
          {/* Pickup / drive-up */}
          {shouldShowPickup &&
            (isCompleted ? (
              <Delivered />
            ) : !inProcess ? (
              <ActionBadge label={t('In-Process')} onPress={() => setConfirmPrep(true)} />
            ) : order.isReady ? (
              <Badge label={t('Ready & email sent')} bg="#CCFBF1" color="#0F766E" />
            ) : (
              <ActionBadge
                label={t('Order Ready')}
                onPress={() => openChecklist('pickup')}
              />
            ))}

          {/* Shipment / local delivery */}
          {(order.isShipmentDelivery || order.isLocalDelivery) && (
            <>
              {order.status === 'Return Requested' && (
                <ActionBadge label={t('Return Confirm')} onPress={returnOrder} />
              )}
              {order.status === 'Return' && (
                <Badge label={t('Return Successful')} bg="#DBEAFE" color="#1D4ED8" />
              )}
              {order.status === 'Order Ready' && (
                <Badge label={t('Order Ready')} bg="#CCFBF1" color="#0F766E" />
              )}
              {order.status === 'Out for Delivery' && (
                <Badge label={t('Out for Delivery')} bg="#E0E7FF" color="#4338CA" />
              )}

              {order.status !== 'Return Requested' &&
                order.status !== 'Return' &&
                (order.status === 'Completed' ? (
                  <Delivered />
                ) : order.trackingNo && order.trackingLink ? (
                  <Badge label={t('Order Shipped')} bg="#EDE9FE" color="#6D28D9" />
                ) : (
                  order.isShipmentDelivery && (
                    <ActionBadge
                      label={t('Add Tracking Info')}
                      onPress={() => openChecklist('shipment')}
                    />
                  )
                ))}
            </>
          )}

          {/* Local-delivery sub-statuses */}
          {order.isLocalDelivery &&
            (order.status === 'Pending' ? (
              <ActionBadge
                label={t('Assign Order')}
                onPress={() => openChecklist('localDelivery')}
              />
            ) : order.status === 'Driverassigned' ? (
              <Badge label={t('Driver Assigned')} bg="#CFFAFE" color="#0E7490" />
            ) : order.status === 'Shipped' ? (
              <Badge label={t('Order Shipped')} bg="#EDE9FE" color="#6D28D9" />
            ) : null)}
        </>
      )}

      {/* Confirm start preparing */}
      <Modal visible={confirmPrep} transparent animationType="fade" onRequestClose={() => setConfirmPrep(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('Start Preparing Order?')}</Text>
            <Text style={styles.modalBody}>
              {t('Are you sure you want to start preparing the order?')}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setConfirmPrep(false)}>
                <Text style={styles.modalCancelTxt}>{t('No')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={markPreparing}>
                <Text style={styles.modalOkTxt}>{t('Yes, Proceed')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracking info */}
      <Modal visible={trackModal} transparent animationType="fade" onRequestClose={() => setTrackModal(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('Tracking Info')}</Text>
            <Text style={styles.label}>{t('Tracking Number')}</Text>
            <TextInput
              style={styles.input}
              value={form.trackingNo}
              onChangeText={v => setForm(p => ({...p, trackingNo: v}))}
              placeholder={t('Enter Tracking Number')}
              placeholderTextColor={Constants.customgrey}
              autoCapitalize="none"
            />
            <Text style={styles.label}>{t('Company Name')}</Text>
            <TextInput
              style={styles.input}
              value={form.companyName}
              onChangeText={v => setForm(p => ({...p, companyName: v}))}
              placeholder={t('Enter Company Name')}
              placeholderTextColor={Constants.customgrey}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setTrackModal(false)}>
                <Text style={styles.modalCancelTxt}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={submitTracking}>
                <Text style={styles.modalOkTxt}>{t('Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign driver */}
      <Modal visible={assignModal} transparent animationType="fade" onRequestClose={() => setAssignModal(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('Assign Order')}</Text>
            <Dropdown
              style={styles.dropdown}
              data={driverList.map(d => ({label: d.username, value: d._id}))}
              value={form.driverId}
              onChange={it => setForm(p => ({...p, driverId: it.value}))}
              placeholder={t('Select Driver')}
              placeholderStyle={{color: Constants.customgrey}}
              selectedTextStyle={{color: Constants.black}}
              labelField="label"
              valueField="value"
              maxHeight={220}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAssignModal(false)}>
                <Text style={styles.modalCancelTxt}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={submitAssign}>
                <Text style={styles.modalOkTxt}>{t('Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {checklist.open && (
        <OrderChecklistModal
          type={checklist.type}
          order={order}
          onClose={closeChecklist}
          onComplete={() => {
            if (checklist.type === 'pickup') {
              orderReady();
            } else if (checklist.type === 'shipment') {
              setForm({
                trackingNo: order?.trackingNo || '',
                companyName: order?.trackingLink || '',
                driverId: '',
              });
              setTrackModal(true);
            } else if (checklist.type === 'localDelivery') {
              setAssignModal(true);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 8, alignItems: 'center', justifyContent: 'center'},
  badge: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginVertical: 4},
  badgeTxt: {fontFamily: FONTS.Bold, fontSize: 11},
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginVertical: 4,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  actionBadgeTxt: {fontFamily: FONTS.Bold, fontSize: 11, color: '#C2410C'},
  stamp: {fontFamily: FONTS.Regular, fontSize: 10, color: Constants.customgrey, marginTop: 2},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {backgroundColor: '#fff', borderRadius: 12, padding: 18},
  modalTitle: {fontFamily: FONTS.Bold, fontSize: 16, color: Constants.black, textAlign: 'center'},
  modalBody: {
    fontFamily: FONTS.Regular,
    fontSize: 14,
    color: Constants.black,
    textAlign: 'center',
    marginVertical: 14,
  },
  label: {fontFamily: FONTS.Medium, fontSize: 13, color: Constants.black, marginTop: 10, marginBottom: 4},
  input: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Constants.black,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    marginTop: 10,
  },
  modalActions: {flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16},
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: Constants.saffron,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelTxt: {fontFamily: FONTS.Bold, color: Constants.saffron},
  modalOk: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalOkTxt: {fontFamily: FONTS.Bold, color: '#fff'},
});

export default OrderReady;
