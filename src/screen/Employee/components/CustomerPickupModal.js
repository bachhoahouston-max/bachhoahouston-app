/* eslint-disable react-native/no-inline-styles */
/* Multi-order pickup verification — shown instead of the single-order secret
 * code modal when the customer has more than one pending pickup order, so
 * staff can enter each order's code and check them all out together. */
import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {Toast} from 'toastify-react-native';
import {useTranslation} from 'react-i18next';
import Constants, {FONTS} from '../../../Assets/Helpers/constant';
import {Post} from '../../../Assets/Helpers/Service';
import {BRAND} from '../../../Assets/Helpers/orderUtils';

const orderNumber = orderId => String(orderId || '').split('-').pop();

const CustomerPickupModal = ({open, orders, customer, onCancel, onVerified}) => {
  const {t} = useTranslation();
  const [selected, setSelected] = useState({});
  const [codes, setCodes] = useState({});
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const sel = {};
    (orders || []).forEach(o => {
      sel[o._id] = true;
    });
    setSelected(sel);
    setCodes({});
    setResults(null);
    setSubmitting(false);
  }, [open, orders]);

  const list = orders || [];
  const selectedIds = list.filter(o => selected[o._id]).map(o => o._id);
  const allSelected = list.length > 0 && selectedIds.length === list.length;

  const toggleAll = () => {
    const next = !allSelected;
    const sel = {};
    list.forEach(o => {
      sel[o._id] = next;
    });
    setSelected(sel);
  };

  const toggleOne = id => setSelected(prev => ({...prev, [id]: !prev[id]}));
  const setCode = (id, val) => {
    setCodes(prev => ({...prev, [id]: val}));
    if (results) setResults(null);
  };

  const canSubmit =
    selectedIds.length > 0 &&
    selectedIds.every(id => (codes[id] || '').trim().length > 0);

  const submit = () => {
    if (!canSubmit || submitting) return;
    const payload = selectedIds.map(id => ({
      id,
      SecretCode: (codes[id] || '').trim(),
    }));
    setSubmitting(true);
    Post('verifyMultipleOrdersWithCode', {orders: payload})
      .then(res => {
        setSubmitting(false);
        const rows = res?.data?.results || [];
        setResults(rows);
        const allOk = rows.length > 0 && rows.every(r => r.success);
        if (allOk) {
          Toast.success(t('Orders verified and checked out.'));
          onVerified && onVerified();
        } else {
          Toast.error(
            t('Some orders could not be verified. Check the codes and try again.'),
          );
        }
      })
      .catch(err => {
        setSubmitting(false);
        Toast.error(err?.message || t('Something went wrong'));
      });
  };

  const resultFor = id => (results || []).find(r => r.id === id);

  return (
    <Modal visible={!!open} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTxt}>{t('Customer Pickup')}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.customerRow}>
              <View style={{flex: 1}}>
                <Text style={styles.customerName}>{customer?.name || t('Customer')}</Text>
                {!!customer?.phone && (
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                )}
              </View>
              <View style={styles.pendingPill}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingTxt}>
                  {list.length} {t('Pending Orders')}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.selectAllRow} onPress={toggleAll}>
              <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
                {allSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.selectAllTxt}>
                {t('Select All Orders')} ({list.length})
              </Text>
            </TouchableOpacity>

            <View style={styles.tableHeadRow}>
              <Text style={[styles.tableHeadTxt, styles.checkCol]}>{t('Pick Up')}</Text>
              <Text style={[styles.tableHeadTxt, styles.orderCol]}>{t('Order')}</Text>
              <Text style={[styles.tableHeadTxt, styles.codeCol]}>{t('Secret Code')}</Text>
            </View>

            {list.map(o => {
              const isSel = !!selected[o._id];
              const rowResult = resultFor(o._id);
              const rowFailed = !!rowResult && !rowResult.success;
              return (
                <View key={o._id} style={styles.row}>
                  <TouchableOpacity
                    style={styles.checkCol}
                    onPress={() => toggleOne(o._id)}>
                    <View style={[styles.checkbox, isSel && styles.checkboxChecked]}>
                      {isSel && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.orderCol}>
                    <Text style={styles.orderNum}>#{orderNumber(o.orderId)}</Text>
                    <Text style={styles.orderId}>{o.orderId}</Text>
                  </View>

                  <View style={styles.codeCol}>
                    {isSel ? (
                      <>
                        <TextInput
                          style={[styles.codeInput, rowFailed && styles.codeInputError]}
                          value={codes[o._id] || ''}
                          onChangeText={txt => setCode(o._id, txt)}
                          keyboardType="number-pad"
                          placeholder={t('Enter code')}
                          placeholderTextColor={Constants.customgrey}
                        />
                        {rowFailed && (
                          <Text style={styles.rowError}>{rowResult.message}</Text>
                        )}
                        {!!rowResult && rowResult.success && (
                          <Text style={styles.rowOk}>✓ {t('Verified')}</Text>
                        )}
                      </>
                    ) : (
                      <View style={styles.notPickingPill}>
                        <Text style={styles.notPickingTxt}>
                          {t('Not picking up today')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>ⓘ</Text>
              <Text style={styles.infoTxt}>{t('Unchecked orders will remain pending.')}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.checkoutBtn, (!canSubmit || submitting) && {opacity: 0.5}]}
              disabled={!canSubmit || submitting}
              onPress={submit}>
              <Text style={styles.checkoutTxt}>
                {submitting
                  ? t('Verifying…')
                  : `${t('Verify & Check Out')} ${selectedIds.length} ${
                      selectedIds.length === 1 ? t('Order') : t('Orders')
                    }`.toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelTxt}>{t('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 17},
  close: {color: 'rgba(255,255,255,0.85)', fontSize: 16},
  body: {padding: 16, paddingBottom: 24},
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  customerName: {fontFamily: FONTS.Bold, fontSize: 16, color: Constants.black},
  customerPhone: {fontFamily: FONTS.Regular, fontSize: 13, color: '#6B7280', marginTop: 2},
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3E2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendingDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 6},
  pendingTxt: {fontFamily: FONTS.Bold, fontSize: 11, color: '#B45309'},
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF7F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  selectAllTxt: {fontFamily: FONTS.Bold, fontSize: 14, color: BRAND, marginLeft: 10},
  tableHeadRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeadTxt: {fontFamily: FONTS.Bold, fontSize: 11, color: '#6B7280', textTransform: 'uppercase'},
  checkCol: {width: 56, justifyContent: 'center'},
  orderCol: {flex: 1, paddingRight: 8, justifyContent: 'center'},
  codeCol: {width: 130},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {backgroundColor: BRAND, borderColor: BRAND},
  checkmark: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 13, lineHeight: 14},
  orderNum: {fontFamily: FONTS.Bold, fontSize: 14, color: Constants.black},
  orderId: {fontFamily: FONTS.Regular, fontSize: 11, color: '#9CA3AF', marginTop: 2},
  codeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: FONTS.Medium,
    fontSize: 14,
    color: Constants.black,
  },
  codeInputError: {borderColor: Constants.red},
  rowError: {fontFamily: FONTS.Regular, fontSize: 10, color: Constants.red, marginTop: 3},
  rowOk: {fontFamily: FONTS.Medium, fontSize: 10, color: BRAND, marginTop: 3},
  notPickingPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  notPickingTxt: {fontFamily: FONTS.Medium, fontSize: 10, color: '#6B7280', textAlign: 'center'},
  infoRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14},
  infoIcon: {color: BRAND, fontSize: 14},
  infoTxt: {flex: 1, fontFamily: FONTS.Regular, fontSize: 12, color: BRAND},
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 14},
  cancelBtn: {alignItems: 'center', paddingVertical: 12},
  cancelTxt: {fontFamily: FONTS.Medium, fontSize: 14, color: '#6B7280'},
});

export default CustomerPickupModal;
