/* eslint-disable react-native/no-inline-styles */
/* RN port of grocerypickup-admin/components/ShipAddressModal.js — collects the
 * delivery address when an order is switched to Local / Shipment delivery. */
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
import {useTranslation} from 'react-i18next';
import Constants, {FONTS} from '../../../Assets/Helpers/constant';
import {BRAND} from '../../../Assets/Helpers/orderUtils';

const blank = {
  username: '',
  lastname: '',
  number: '',
  address: '',
  zipcode: '',
  ApartmentNo: '',
  SecurityGateCode: '',
  isBusiness: false,
  BusinessAddress: '',
};

const Field = ({label, required, ...props}) => (
  <View style={{marginBottom: 12}}>
    <Text style={styles.label}>
      {label} {required ? <Text style={{color: Constants.red}}>*</Text> : null}
    </Text>
    <TextInput
      style={styles.input}
      placeholderTextColor={Constants.customgrey}
      {...props}
    />
  </View>
);

const ShipAddressModal = ({
  open,
  deliveryLabel,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}) => {
  const {t} = useTranslation();
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open) {
      setForm({
        ...blank,
        username: initialValues?.username || '',
        lastname: initialValues?.lastname || '',
        number: initialValues?.number || '',
      });
    }
  }, [open, initialValues]);

  const set = (k, v) => setForm(prev => ({...prev, [k]: v}));

  const canSubmit =
    form.username.trim() &&
    form.lastname.trim() &&
    form.address.trim() &&
    form.zipcode.trim() &&
    form.number.trim();

  const submit = () => {
    if (!canSubmit || submitting) return;
    onSubmit({
      username: form.username.trim(),
      lastname: form.lastname.trim(),
      number: form.number.trim(),
      address: form.address.trim(),
      zipcode: form.zipcode.trim(),
      ApartmentNo: form.ApartmentNo.trim(),
      isBusiness: form.isBusiness,
      BusinessAddress: form.isBusiness ? form.BusinessAddress.trim() : '',
      SecurityGateCode: form.SecurityGateCode.trim(),
    });
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {t('Enter')} {deliveryLabel || t('Delivery')} {t('Address')}
          </Text>
          <Text style={styles.sub}>
            {t('This address is used for this delivery only and does not change the customer’s saved address.')}
          </Text>

          <ScrollView style={{maxHeight: 380}} keyboardShouldPersistTaps="handled">
            <Field
              label={t('First Name')}
              required
              value={form.username}
              onChangeText={v => set('username', v)}
            />
            <Field
              label={t('Last Name')}
              required
              value={form.lastname}
              onChangeText={v => set('lastname', v)}
            />
            <Field
              label={t('Address')}
              required
              value={form.address}
              onChangeText={v => set('address', v)}
              placeholder={t('Street address, unit, city, state')}
              multiline
            />
            <Field
              label={t('Apartment No. (Optional)')}
              value={form.ApartmentNo}
              onChangeText={v => set('ApartmentNo', v)}
            />
            <Field
              label={t('Security Gate No. (Optional)')}
              value={form.SecurityGateCode}
              onChangeText={v => set('SecurityGateCode', v)}
            />
            <Field
              label={t('Zip / Postal Code')}
              required
              value={form.zipcode}
              onChangeText={v => set('zipcode', v)}
              keyboardType="number-pad"
            />
            <Field
              label={t('Mobile Number')}
              required
              value={form.number}
              onChangeText={v => set('number', v)}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => set('isBusiness', !form.isBusiness)}>
              <View style={[styles.checkbox, form.isBusiness && styles.checkboxOn]}>
                {form.isBusiness && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkTxt}>{t('This is a business address')}</Text>
            </TouchableOpacity>
            {form.isBusiness && (
              <Field
                label={t('Company Name')}
                value={form.BusinessAddress}
                onChangeText={v => set('BusinessAddress', v)}
              />
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelTxt}>{t('Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!canSubmit || submitting) && {opacity: 0.5}]}
              disabled={!canSubmit || submitting}
              onPress={submit}>
              <Text style={styles.saveTxt}>
                {submitting ? t('Saving...') : t('Save & Continue')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {backgroundColor: Constants.white, borderRadius: 14, padding: 18},
  title: {fontFamily: FONTS.Bold, fontSize: 17, color: Constants.black},
  sub: {
    fontFamily: FONTS.Regular,
    fontSize: 12,
    color: Constants.customgrey,
    marginTop: 4,
    marginBottom: 12,
  },
  label: {fontFamily: FONTS.Medium, fontSize: 13, color: Constants.black, marginBottom: 4},
  input: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Constants.black,
    fontFamily: FONTS.Regular,
    fontSize: 14,
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 6},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Constants.customgrey2,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: BRAND, borderColor: BRAND},
  checkMark: {color: Constants.white, fontSize: 13},
  checkTxt: {fontFamily: FONTS.Regular, fontSize: 13, color: Constants.black},
  actions: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 10},
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
  },
  cancelTxt: {fontFamily: FONTS.Medium, color: Constants.black},
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BRAND,
  },
  saveTxt: {fontFamily: FONTS.Bold, color: Constants.white},
});

export default ShipAddressModal;
