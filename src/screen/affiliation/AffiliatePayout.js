import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Lock, Mail, Phone, Save } from 'lucide-react-native';
import Constants from '../../Assets/Helpers/constant';
import { Put } from '../../Assets/Helpers/Service';
import { useAffiliate } from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import { Button, Card } from './components/ui';
import { COLORS, FONTS, RADIUS } from './theme';

const FIELDS = [
  { key: 'zelleEmail', icon: Mail, label: 'Zelle email', placeholder: 'Enter your Zelle email', keyboardType: 'email-address' },
  { key: 'zellePhone', icon: Phone, label: 'Zelle phone', placeholder: 'Enter your Zelle phone number', keyboardType: 'phone-pad' },
];

const AffiliatePayout = ({ navigation }) => {
  const { t } = useTranslation();
  const { dashboard, refresh } = useAffiliate();
  const application = dashboard?.application || {};
  const [form, setForm] = useState({ zelleEmail: '', zellePhone: '' });
  const [saving, setSaving] = useState(false);

  const missing = FIELDS.filter(field => !application[field.key]);

  const save = () => {
    const data = {};
    missing.forEach(field => {
      const value = form[field.key].trim();
      if (value) data[field.key] = value;
    });
    if (!Object.keys(data).length) {
      Alert.alert(t('Payment details needed'), t('Enter a Zelle email or phone number.'));
      return;
    }
    if (data.zelleEmail && !Constants.emailValidationRegx.test(data.zelleEmail)) {
      Alert.alert(t('Payment details needed'), t('Enter a valid Zelle email.'));
      return;
    }
    if (data.zellePhone && data.zellePhone.replace(/\D/g, '').length < 10) {
      Alert.alert(t('Payment details needed'), t('Enter a valid Zelle phone number.'));
      return;
    }
    Alert.alert(t('Save payout details?'), t('Once saved, you can not edit these details. Please make sure they are correct.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Save'), onPress: () => submit(data) },
    ]);
  };

  const submit = async data => {
    setSaving(true);
    try {
      const res = await Put('affiliation/applications/me/payout-details', data);
      if (res?.status) {
        await refresh();
        setForm({ zelleEmail: '', zellePhone: '' });
        Toast.show({ type: 'success', text1: t('Payout details saved') });
      } else {
        Alert.alert(t('Unable to save'), res?.message || res?.data?.message || t('Please try again.'));
      }
    } catch (e) {
      Alert.alert(t('Unable to save'), t('Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AffiliateHeader inline title={t('Payout method')} onBack={() => navigation.goBack()} />

        <View style={styles.body}>
          <Card style={styles.listCard}>
            <View style={styles.zelleBadge}>
              <Text style={styles.zelleText}>Zelle</Text>
            </View>
            {FIELDS.map((field, index) => {
              const Icon = field.icon;
              const value = application[field.key];
              const last = index === FIELDS.length - 1;
              return (
                <View key={field.key} style={[styles.fieldBlock, !last && styles.divider]}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Icon size={16} color={COLORS.primary} />
                    </View>
                    <Text style={styles.infoLabel}>{t(field.label)}</Text>
                    {value ? (
                      <>
                        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
                        <Lock size={14} color={COLORS.muted} />
                      </>
                    ) : (
                      <Text style={styles.missing}>{t('Not added')}</Text>
                    )}
                  </View>
                  {!value && (
                    <TextInput
                      style={styles.input}
                      value={form[field.key]}
                      onChangeText={text => setForm(f => ({ ...f, [field.key]: text }))}
                      placeholder={t(field.placeholder)}
                      placeholderTextColor={COLORS.muted}
                      keyboardType={field.keyboardType}
                      autoCapitalize="none"
                      editable={!saving}
                    />
                  )}
                </View>
              );
            })}
          </Card>

          {missing.length > 0 && (
            <View style={styles.saveRow}>
              <Button label={t('Save')} icon={Save} onPress={save} loading={saving} />
            </View>
          )}

          <Text style={styles.footnote}>
            {missing.length > 0
              ? t('Details can not be edited after saving. To change them later, please contact the store.')
              : t('To change your payout details, please contact the store.')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 40 },
  body: { paddingHorizontal: 14, paddingTop: 18 },
  listCard: { paddingVertical: 4 },
  fieldBlock: { paddingVertical: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontFamily: FONTS.Regular, fontSize: 13.5, color: COLORS.textSecondary },
  infoValue: { flex: 1, textAlign: 'right', fontFamily: FONTS.SemiBold, fontSize: 13.5, color: COLORS.text },
  missing: { flex: 1, textAlign: 'right', fontFamily: FONTS.Medium, fontSize: 13, color: COLORS.muted },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: FONTS.Regular,
    fontSize: 14,
    marginTop: 12,
  },
  zelleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6D1ED4',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
    marginBottom: 2,
  },
  zelleText: { fontFamily: FONTS.Bold, fontSize: 12, color: COLORS.white },
  saveRow: { flexDirection: 'row', marginTop: 16 },
  footnote: { fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 10, marginHorizontal: 4 },
});

export default AffiliatePayout;
