/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {ArrowLeft, CheckCircle2, Copy, Link2, Plus, WalletCards, X} from 'lucide-react-native';
import {Dropdown} from 'react-native-element-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {UserContext} from '../../../App';
import {navigate} from '../../../navigationRef';
import {GetApi, Post} from '../../Assets/Helpers/Service';
import Constants, {FONTS} from '../../Assets/Helpers/constant';

const SOCIAL_PLATFORMS = [
  {label: 'Instagram', value: 'instagram', icon: 'logo-instagram', color: '#E1306C', placeholder: 'e.g. https://instagram.com/yourname'},
  {label: 'TikTok', value: 'tiktok', icon: 'logo-tiktok', color: '#000000', placeholder: 'e.g. https://tiktok.com/@yourname'},
  {label: 'Facebook', value: 'facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'e.g. https://facebook.com/yourpage'},
  {label: 'YouTube', value: 'youtube', icon: 'logo-youtube', color: '#FF0000', placeholder: 'e.g. https://youtube.com/@yourchannel'},
  {label: 'X / Twitter', value: 'twitter', icon: 'logo-twitter', color: '#1DA1F2', placeholder: 'e.g. https://x.com/yourname'},
  {label: 'Pinterest', value: 'pinterest', icon: 'logo-pinterest', color: '#E60023', placeholder: 'e.g. https://pinterest.com/yourname'},
  {label: 'Website', value: 'website', icon: 'globe-outline', color: Constants.greennew, placeholder: 'e.g. https://yourwebsite.com'},
];

const getPlatform = value => SOCIAL_PLATFORMS.find(p => p.value === value) || SOCIAL_PLATFORMS[0];

const PlatformIcon = ({value, size = 20}) => {
  const platform = getPlatform(value);
  return <Ionicons name={platform.icon} size={size} color={platform.color} />;
};

const Affiliation = () => {
  const [user] = useContext(UserContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({bio: '', audience: '', zelleEmail: '', zellePhone: ''});
  const [socialLinks, setSocialLinks] = useState([
    {platform: 'instagram', url: ''},
    {platform: 'tiktok', url: ''},
  ]);

  const updateSocialLink = (index, changes) => {
    setSocialLinks(links => links.map((link, i) => (i === index ? {...link, ...changes} : link)));
  };

  const addSocialLink = () => {
    const used = socialLinks.map(link => link.platform);
    const next = SOCIAL_PLATFORMS.find(p => !used.includes(p.value)) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
    setSocialLinks(links => [...links, {platform: next.value, url: ''}]);
  };

  const removeSocialLink = index => {
    setSocialLinks(links => links.filter((_, i) => i !== index));
  };

  const loadDashboard = useCallback(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    GetApi('affiliation/dashboard', {})
      .then(res => setDashboard(res?.status ? res.data : null))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [user?.token]);

  useFocusEffect(useCallback(() => {
    loadDashboard();
  }, [loadDashboard]));

  const submitApplication = async () => {
    const filledLinks = socialLinks
      .map(link => ({platform: link.platform, url: link.url.trim()}))
      .filter(link => link.url);
    if (!filledLinks.length) {
      Alert.alert('Social link needed', 'Add at least one social media or website link.');
      return;
    }
    if (!form.zelleEmail && !form.zellePhone) {
      Alert.alert('Payment details needed', 'Add a Zelle email or phone number for future payouts.');
      return;
    }
    setSaving(true);
    try {
      const res = await Post('affiliation/applications', {...form, socialLinks: filledLinks}, {});
      if (!res?.status) {
        Alert.alert('Unable to apply', res?.message || 'Please try again.');
        return;
      }
      Alert.alert('Application submitted', 'Your application is now waiting for manager approval.');
      loadDashboard();
    } catch (error) {
      Alert.alert('Unable to apply', error?.message || 'Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const copyReferral = () => {
    const code = dashboard?.application?.referralCode;
    if (!code) return;
    Share.share({message: code});
  };

  const shareReferral = async () => {
    const link = dashboard?.application?.referralLink;
    if (!link) return;
    await Share.share({
      title: 'Shop with my referral link',
      message: `Shop at Bach Hoa Houston using my referral link: ${link}`,
    });
  };

  const requestPayout = async () => {
    setSaving(true);
    try {
      const res = await Post('affiliation/payouts', {}, {});
      if (!res?.status) {
        Alert.alert('Payout unavailable', res?.message || 'No unpaid commission is ready yet.');
        return;
      }
      Alert.alert('Payout requested', 'Your payout has been sent for owner approval.');
      loadDashboard();
    } catch (error) {
      Alert.alert('Payout unavailable', error?.message || 'Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (!user?.token) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text style={styles.title}>Join our affiliate program</Text>
          <Text style={styles.muted}>Sign in to apply and earn commission from qualifying orders.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigate('Auth')}>
            <Text style={styles.primaryText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const application = dashboard?.application;
  const status = application?.status;

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Constants.greennew} /></View>
      ) : !application ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}><WalletCards size={28} color={Constants.white} /></View>
            <Text style={styles.heroTitle}>Share, earn, grow</Text>
            <Text style={styles.heroText}>Recommend products you love and earn commission on completed orders.</Text>
          </View>
          <Text style={styles.sectionTitle}>Apply to become an affiliate</Text>
          <Text style={styles.label}>Tell us about your audience</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            multiline
            value={form.audience}
            onChangeText={audience => setForm({...form, audience})}
            placeholder="Where do you share recommendations?"
            placeholderTextColor="#9AA5A0"
          />
          <Text style={styles.label}>Why would you like to join?</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            multiline
            value={form.bio}
            onChangeText={bio => setForm({...form, bio})}
            placeholder="A short introduction"
            placeholderTextColor="#9AA5A0"
          />
          <Text style={styles.label}>Social media / website links</Text>
          <Text style={styles.hint}>Add at least one link. You can add more.</Text>
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
                onChange={item => updateSocialLink(index, {platform: item.value})}
                selectedTextStyle={styles.platformText}
                selectedTextProps={{numberOfLines: 1}}
                renderLeftIcon={() => (
                  <View style={styles.platformIcon}><PlatformIcon value={link.platform} /></View>
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
                onChangeText={url => updateSocialLink(index, {url})}
                placeholder={getPlatform(link.platform).placeholder}
                placeholderTextColor="#9AA5A0"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {socialLinks.length > 1 && (
                <TouchableOpacity style={styles.removeLink} onPress={() => removeSocialLink(index)} hitSlop={8}>
                  <X size={18} color="#68756D" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addLink} onPress={addSocialLink}>
            <View style={styles.addLinkIcon}><Plus size={16} color={Constants.white} /></View>
            <Text style={styles.addLinkText}>Add another link</Text>
          </TouchableOpacity>
          <Text style={styles.label}>Zelle email or phone</Text>
          <TextInput style={styles.input} value={form.zelleEmail} onChangeText={zelleEmail => setForm({...form, zelleEmail})} placeholder="Zelle email" placeholderTextColor="#9AA5A0" keyboardType="email-address" />
          <TextInput style={styles.input} value={form.zellePhone} onChangeText={zellePhone => setForm({...form, zellePhone})} placeholder="Zelle phone (optional)" placeholderTextColor="#9AA5A0" keyboardType="phone-pad" />
          <TouchableOpacity style={styles.primaryButton} onPress={submitApplication} disabled={saving}>
            {saving ? <ActivityIndicator color={Constants.white} /> : <Text style={styles.primaryText}>Submit application</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}><CheckCircle2 size={24} color={status === 'Approved' ? Constants.greennew : Constants.saffron} /></View>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>{status === 'Approved' ? 'You are approved' : `Application ${status}`}</Text>
              <Text style={styles.muted}>{status === 'Approved' ? 'Your referral tools are ready.' : 'We will notify you after the manager reviews your application.'}</Text>
            </View>
          </View>
          {status === 'Approved' && (
            <>
              <View style={styles.earnCard}>
                <Text style={styles.earnLabel}>Available commission</Text>
                <Text style={styles.earnAmount}>${Number(dashboard?.totals?.available || 0).toFixed(2)}</Text>
                <Text style={styles.earnMeta}>{Number(application.commissionRate || 0)}% commission rate</Text>
              </View>
              <Text style={styles.sectionTitle}>Your referral link</Text>
              <View style={styles.linkCard}>
                <Link2 size={20} color={Constants.greennew} />
                <Text style={styles.linkText} numberOfLines={2}>{application.referralLink}</Text>
                <TouchableOpacity onPress={copyReferral}><Copy size={20} color={Constants.greennew} /></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={shareReferral}>
                <Text style={styles.primaryText}>Share referral link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={requestPayout} disabled={saving}>
                <Text style={styles.secondaryText}>{saving ? 'Requesting...' : 'Request payout'}</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Commission activity</Text>
              {(dashboard?.commissions || []).slice(0, 10).map(item => (
                <View style={styles.commissionRow} key={item._id}>
                  <View>
                    <Text style={styles.cardTitle}>Order {item.orderNumber}</Text>
                    <Text style={styles.muted}>{item.status} · {item.commissionRate}%</Text>
                  </View>
                  <Text style={styles.amount}>${Number(item.commissionAmount || 0).toFixed(2)}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const Header = () => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigate('Account')}><ArrowLeft size={22} color={Constants.black} /></TouchableOpacity>
    <Text style={styles.headerTitle}>Affiliate program</Text>
    <View style={{width: 22}} />
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5FAF6'},
  header: {height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Constants.white},
  headerTitle: {fontFamily: FONTS.SemiBold, fontSize: 18, color: Constants.black},
  content: {padding: 18, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28},
  hero: {backgroundColor: Constants.greennew, borderRadius: 22, padding: 22, marginBottom: 24},
  heroIcon: {width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 18},
  heroTitle: {fontFamily: FONTS.Bold, fontSize: 26, color: Constants.white},
  heroText: {fontFamily: FONTS.Regular, color: '#E9F8EB', fontSize: 14, lineHeight: 21, marginTop: 8},
  title: {fontFamily: FONTS.Bold, fontSize: 24, color: Constants.black, textAlign: 'center'},
  sectionTitle: {fontFamily: FONTS.SemiBold, fontSize: 18, color: Constants.black, marginTop: 20, marginBottom: 12},
  label: {fontFamily: FONTS.Medium, color: '#4B5B52', fontSize: 13, marginBottom: 6, marginTop: 10},
  input: {backgroundColor: Constants.white, borderWidth: 1, borderColor: '#DCE8DE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Constants.black, fontFamily: FONTS.Regular, marginBottom: 8},
  multiline: {minHeight: 82, textAlignVertical: 'top'},
  hint: {fontFamily: FONTS.Regular, color: '#68756D', fontSize: 12, marginBottom: 10},
  socialRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8},
  platformDropdown: {width: 138, height: 48, backgroundColor: Constants.white, borderWidth: 1, borderColor: '#DCE8DE', borderRadius: 24, paddingHorizontal: 12},
  platformMenu: {borderRadius: 12, overflow: 'hidden'},
  platformIcon: {marginRight: 8},
  platformText: {fontFamily: FONTS.Medium, color: Constants.black, fontSize: 14},
  platformItem: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10},
  platformItemText: {fontFamily: FONTS.Regular, color: Constants.black, fontSize: 14},
  socialInput: {flex: 1, height: 48, backgroundColor: Constants.white, borderWidth: 1, borderColor: '#DCE8DE', borderRadius: 24, paddingHorizontal: 16, color: Constants.black, fontFamily: FONTS.Regular, fontSize: 13},
  removeLink: {padding: 2},
  addLink: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 6},
  addLinkIcon: {width: 22, height: 22, borderRadius: 11, backgroundColor: Constants.greennew, alignItems: 'center', justifyContent: 'center', marginRight: 8},
  addLinkText: {fontFamily: FONTS.SemiBold, color: Constants.greennew, fontSize: 14},
  primaryButton: {backgroundColor: Constants.greennew, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingHorizontal: 20},
  primaryText: {fontFamily: FONTS.SemiBold, color: Constants.white, fontSize: 16},
  secondaryButton: {borderWidth: 1, borderColor: Constants.greennew, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10},
  secondaryText: {fontFamily: FONTS.SemiBold, color: Constants.greennew, fontSize: 16},
  muted: {fontFamily: FONTS.Regular, color: '#68756D', fontSize: 13, lineHeight: 19, marginTop: 4},
  statusCard: {backgroundColor: Constants.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16},
  statusIcon: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9F6EB', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  cardTitle: {fontFamily: FONTS.SemiBold, color: Constants.black, fontSize: 15},
  earnCard: {backgroundColor: '#DFF2E2', borderRadius: 18, padding: 20},
  earnLabel: {fontFamily: FONTS.Medium, color: '#42634B', fontSize: 13},
  earnAmount: {fontFamily: FONTS.Bold, fontSize: 34, color: Constants.greennew, marginTop: 4},
  earnMeta: {fontFamily: FONTS.Medium, color: '#42634B', marginTop: 4},
  linkCard: {backgroundColor: Constants.white, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10},
  linkText: {flex: 1, color: Constants.black, fontFamily: FONTS.Regular, fontSize: 13},
  commissionRow: {backgroundColor: Constants.white, borderRadius: 13, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  amount: {fontFamily: FONTS.SemiBold, color: Constants.greennew, fontSize: 16},
});

export default Affiliation;
