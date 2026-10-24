import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Dropdown} from 'react-native-element-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {BadgePercent, Banknote, Plus, Send, Share2, X} from 'lucide-react-native';
import {Post} from '../../Assets/Helpers/Service';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import {Button, Card} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {SOCIAL_PLATFORMS, getPlatform} from './utils';

const PlatformIcon = ({value, size = 18}) => {
  const platform = getPlatform(value);
  return <Ionicons name={platform.icon} size={size} color={platform.color} />;
};

const StepTitle = ({number, title, hint}) => (
  <View style={styles.stepHeader}>
    <View style={styles.stepBadge}>
      <Text style={styles.stepBadgeText}>{number}</Text>
    </View>
    <View style={styles.flex}>
      <Text style={styles.stepTitle}>{title}</Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  </View>
);

/**
 * Affiliate application. Used for first-time applicants and for re-applying
 * after a rejection (the previous answers are pre-filled from `application`).
 */
const AffiliateApply = ({navigation, route}) => {
  const {t} = useTranslation();
  const {dashboard, refresh} = useAffiliate();
  const previous = route?.params?.reapply ? dashboard?.application : null;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: previous?.bio || '',
    audience: previous?.audience || '',
    zelleEmail: previous?.zelleEmail || '',
    zellePhone: previous?.zellePhone || '',
  });
  const [socialLinks, setSocialLinks] = useState(
    previous?.socialLinks?.length
      ? previous.socialLinks.map(link => ({platform: link.platform || 'website', url: link.url || ''}))
      : [
          {platform: 'instagram', url: ''},
          {platform: 'tiktok', url: ''},
        ],
  );

  const updateLink = (index, changes) =>
    setSocialLinks(links => links.map((link, i) => (i === index ? {...link, ...changes} : link)));

  const addLink = () => {
    const used = socialLinks.map(link => link.platform);
    const next = SOCIAL_PLATFORMS.find(p => !used.includes(p.value)) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
    setSocialLinks(links => [...links, {platform: next.value, url: ''}]);
  };

  const removeLink = index => setSocialLinks(links => links.filter((_, i) => i !== index));

  const submit = async () => {
    const filledLinks = socialLinks
      .map(link => ({platform: link.platform, url: link.url.trim()}))
      .filter(link => link.url);
    if (!filledLinks.length) {
      Alert.alert(t('Social link needed'), t('Add at least one social media or website link.'));
      return;
    }
    if (!form.zelleEmail.trim() && !form.zellePhone.trim()) {
      Alert.alert(t('Payment details needed'), t('Add a Zelle email or phone number for future payouts.'));
      return;
    }
    setSaving(true);
    try {
      const res = await Post('affiliation/applications', {...form, socialLinks: filledLinks}, {});
      if (!res?.status) {
        Alert.alert(t('Unable to apply'), res?.message || t('Please try again.'));
        return;
      }
      Alert.alert(t('Application submitted'), t('Your application is now waiting for manager approval.'));
      await refresh();
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('AffiliateStatus');
      }
    } catch (error) {
      Alert.alert(t('Unable to apply'), error?.message || t('Please check your connection.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AffiliateHeader
          title={previous ? t('Apply again') : t('Become an affiliate')}
          subtitle={t('Recommend products you love and earn commission on completed orders.')}
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          right={
            <TouchableOpacity style={styles.shopLink} onPress={() => navigation.navigate('App')}>
              <Text style={styles.shopLinkText}>{t('Shop')}</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.body}>
          <View style={styles.perks}>
            {[
              {icon: Share2, label: t('Share your code')},
              {icon: BadgePercent, label: t('Earn commission')},
              {icon: Banknote, label: t('Get paid by Zelle')},
            ].map(({icon: Icon, label}) => (
              <View key={label} style={styles.perk}>
                <View style={styles.perkIcon}>
                  <Icon size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.perkText}>{label}</Text>
              </View>
            ))}
          </View>

          {!!previous?.rejectionReason && (
            <View style={styles.reason}>
              <Text style={styles.reasonText}>
                {t('Reason')}: {previous.rejectionReason}
              </Text>
            </View>
          )}

          <Card style={styles.section}>
            <StepTitle number={1} title={t('About you')} />
            <Text style={styles.label}>{t('Tell us about your audience')}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              value={form.audience}
              onChangeText={audience => setForm(f => ({...f, audience}))}
              placeholder={t('Where do you share recommendations?')}
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.label}>{t('Why would you like to join?')}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              value={form.bio}
              onChangeText={bio => setForm(f => ({...f, bio}))}
              placeholder={t('A short introduction')}
              placeholderTextColor={COLORS.muted}
            />
          </Card>

          <Card style={styles.section}>
            <StepTitle
              number={2}
              title={t('Social media / website links')}
              hint={t('Add at least one link. You can add more.')}
            />
            {socialLinks.map((link, index) => (
              <View style={styles.socialRow} key={index}>
                <Dropdown
                  style={styles.platformDropdown}
                  containerStyle={styles.platformMenu}
                  data={SOCIAL_PLATFORMS}
                  value={link.platform}
                  labelField="label"
                  valueField="value"
                  maxHeight={280}
                  onChange={item => updateLink(index, {platform: item.value})}
                  selectedTextStyle={styles.platformText}
                  selectedTextProps={{numberOfLines: 1}}
                  renderLeftIcon={() => (
                    <View style={styles.platformIcon}>
                      <PlatformIcon value={link.platform} />
                    </View>
                  )}
                  renderItem={item => (
                    <View style={styles.platformItem}>
                      <PlatformIcon value={item.value} />
                      <Text style={styles.platformItemText}>{item.label}</Text>
                    </View>
                  )}
                />
                <TextInput
                  style={styles.socialInput}
                  value={link.url}
                  onChangeText={url => updateLink(index, {url})}
                  placeholder={getPlatform(link.platform).placeholder}
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {socialLinks.length > 1 && (
                  <TouchableOpacity onPress={() => removeLink(index)} hitSlop={8} accessibilityLabel={t('Remove')}>
                    <X size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addLink} onPress={addLink}>
              <View style={styles.addLinkIcon}>
                <Plus size={14} color={COLORS.white} />
              </View>
              <Text style={styles.addLinkText}>{t('Add another link')}</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.section}>
            <StepTitle number={3} title={t('Zelle email or phone')} hint={t('Add a Zelle email or phone number for future payouts.')} />
            <TextInput
              style={styles.input}
              value={form.zelleEmail}
              onChangeText={zelleEmail => setForm(f => ({...f, zelleEmail}))}
              placeholder={t('Zelle email')}
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={form.zellePhone}
              onChangeText={zellePhone => setForm(f => ({...f, zellePhone}))}
              placeholder={t('Zelle phone (optional)')}
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />
          </Card>

          <View style={styles.submitRow}>
            <Button label={t('Submit application')} icon={Send} onPress={submit} loading={saving} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: 40},
  body: {paddingHorizontal: 14, paddingTop: 18},
  flex: {flex: 1},
  shopLink: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  shopLinkText: {fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.primary},
  perks: {flexDirection: 'row', gap: 8},
  perk: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
  },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  perkText: {fontFamily: FONTS.Medium, fontSize: 11.5, color: COLORS.text, textAlign: 'center'},
  reason: {backgroundColor: COLORS.dangerSoft, borderRadius: RADIUS.md, padding: 12, marginTop: 14},
  reasonText: {fontFamily: FONTS.Medium, fontSize: 12.5, color: COLORS.danger},
  section: {marginTop: 14},
  stepHeader: {flexDirection: 'row', gap: 10, marginBottom: 6},
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {fontFamily: FONTS.Bold, fontSize: 12, color: COLORS.white},
  stepTitle: {fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.text},
  hint: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 1},
  label: {fontFamily: FONTS.Medium, color: COLORS.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 10},
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
    marginTop: 8,
  },
  multiline: {minHeight: 84, textAlignVertical: 'top', marginTop: 0},
  socialRow: {flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8},
  platformDropdown: {
    width: 128,
    height: 46,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    paddingHorizontal: 12,
  },
  platformMenu: {borderRadius: 12, overflow: 'hidden'},
  platformIcon: {marginRight: 6},
  platformText: {fontFamily: FONTS.Medium, color: COLORS.text, fontSize: 13},
  platformItem: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10},
  platformItemText: {fontFamily: FONTS.Regular, color: COLORS.text, fontSize: 14},
  socialInput: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontFamily: FONTS.Regular,
    fontSize: 13,
  },
  addLink: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, marginTop: 6},
  addLinkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addLinkText: {fontFamily: FONTS.SemiBold, color: COLORS.primary, fontSize: 14},
  submitRow: {flexDirection: 'row', marginTop: 20},
});

export default AffiliateApply;
