/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
import {useTranslation} from 'react-i18next';
import {ArrowLeft, Ban, CheckCircle2, Clock3, Link2, Plus, Share2, WalletCards, X, XCircle} from 'lucide-react-native';
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

// Commission status → label key. "Approved" means it is inside a payout request.
const COMMISSION_STATUS = {
  Pending: 'Ready for payout',
  Approved: 'In payout request',
  Paid: 'Paid',
  Reversed: 'Reversed',
};

const getPlatform = value => SOCIAL_PLATFORMS.find(p => p.value === value) || SOCIAL_PLATFORMS[0];
const money = value => `$${Number(value || 0).toFixed(2)}`;
const shortDate = value => (value ? new Date(value).toLocaleDateString() : '');

const PlatformIcon = ({value, size = 20}) => {
  const platform = getPlatform(value);
  return <Ionicons name={platform.icon} size={size} color={platform.color} />;
};

const Affiliation = () => {
  const {t} = useTranslation();
  const [user] = useContext(UserContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reapplying, setReapplying] = useState(false);
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
      return Promise.resolve();
    }
    return GetApi('affiliation/dashboard', {})
      .then(res => setDashboard(res?.status ? res.data : null))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [user?.token]);

  useFocusEffect(useCallback(() => {
    loadDashboard();
  }, [loadDashboard]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const startReapply = () => {
    const app = dashboard?.application;
    setForm({
      bio: app?.bio || '',
      audience: app?.audience || '',
      zelleEmail: app?.zelleEmail || '',
      zellePhone: app?.zellePhone || '',
    });
    if (app?.socialLinks?.length) {
      setSocialLinks(app.socialLinks.map(link => ({platform: link.platform || 'website', url: link.url || ''})));
    }
    setReapplying(true);
  };

  const submitApplication = async () => {
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
      setReapplying(false);
      loadDashboard();
    } catch (error) {
      Alert.alert(t('Unable to apply'), error?.message || t('Please check your connection.'));
    } finally {
      setSaving(false);
    }
  };

  const shareCode = () => {
    const code = dashboard?.application?.referralCode;
    if (!code) return;
    Share.share({message: code});
  };

  const shareReferral = async () => {
    const {referralCode, referralLink} = dashboard?.application || {};
    if (!referralCode) return;
    await Share.share({
      title: t('Shop with my referral link'),
      message: t('Shop at Bach Hoa Houston with my referral code {{code}}: {{link}}', {
        code: referralCode,
        link: referralLink || '',
      }),
    });
  };

  const requestPayout = async () => {
    setSaving(true);
    try {
      const res = await Post('affiliation/payouts', {}, {});
      if (!res?.status) {
        Alert.alert(t('Payout unavailable'), res?.message || t('No unpaid commission is ready yet.'));
        return;
      }
      Alert.alert(t('Payout requested'), t('Your payout has been sent for owner approval.'));
      loadDashboard();
    } catch (error) {
      Alert.alert(t('Payout unavailable'), error?.message || t('Please check your connection.'));
    } finally {
      setSaving(false);
    }
  };

  if (!user?.token) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('Affiliate program')} />
        <View style={styles.center}>
          <Text style={styles.title}>{t('Join our affiliate program')}</Text>
          <Text style={[styles.muted, {textAlign: 'center'}]}>{t('Sign in to apply and earn commission from qualifying orders.')}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigate('Auth')}>
            <Text style={styles.primaryText}>{t('Sign in')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const application = dashboard?.application;
  const status = application?.status;
  const totals = dashboard?.totals || {};
  const showForm = !application || reapplying;

  const renderForm = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><WalletCards size={28} color={Constants.white} /></View>
        <Text style={styles.heroTitle}>{t('Share, earn, grow')}</Text>
        <Text style={styles.heroText}>{t('Recommend products you love and earn commission on completed orders.')}</Text>
      </View>
      <Text style={styles.sectionTitle}>{t('Apply to become an affiliate')}</Text>
      <Text style={styles.label}>{t('Tell us about your audience')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={form.audience}
        onChangeText={audience => setForm({...form, audience})}
        placeholder={t('Where do you share recommendations?')}
        placeholderTextColor="#9AA5A0"
      />
      <Text style={styles.label}>{t('Why would you like to join?')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={form.bio}
        onChangeText={bio => setForm({...form, bio})}
        placeholder={t('A short introduction')}
        placeholderTextColor="#9AA5A0"
      />
      <Text style={styles.label}>{t('Social media / website links')}</Text>
      <Text style={styles.hint}>{t('Add at least one link. You can add more.')}</Text>
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
        <Text style={styles.addLinkText}>{t('Add another link')}</Text>
      </TouchableOpacity>
      <Text style={styles.label}>{t('Zelle email or phone')}</Text>
      <TextInput style={styles.input} value={form.zelleEmail} onChangeText={zelleEmail => setForm({...form, zelleEmail})} placeholder={t('Zelle email')} placeholderTextColor="#9AA5A0" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} value={form.zellePhone} onChangeText={zellePhone => setForm({...form, zellePhone})} placeholder={t('Zelle phone (optional)')} placeholderTextColor="#9AA5A0" keyboardType="phone-pad" />
      <TouchableOpacity style={styles.primaryButton} onPress={submitApplication} disabled={saving}>
        {saving ? <ActivityIndicator color={Constants.white} /> : <Text style={styles.primaryText}>{t('Submit application')}</Text>}
      </TouchableOpacity>
      {reapplying && (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setReapplying(false)}>
          <Text style={styles.secondaryText}>{t('Cancel')}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderStatusCard = () => {
    const config = {
      Pending: {Icon: Clock3, color: Constants.saffron, title: t('Application under review'), text: t('We will notify you after the manager reviews your application.')},
      Rejected: {Icon: XCircle, color: Constants.red, title: t('Application not approved'), text: application.rejectionReason ? `${t('Reason')}: ${application.rejectionReason}` : ''},
      Suspended: {Icon: Ban, color: Constants.red, title: t('Account suspended'), text: application.rejectionReason ? `${t('Reason')}: ${application.rejectionReason}` : t('Your affiliate account is suspended. Please contact the store.')},
      Approved: {Icon: CheckCircle2, color: Constants.greennew, title: t('You are approved'), text: t('Your referral tools are ready.')},
    }[status] || {Icon: Clock3, color: Constants.saffron, title: status, text: ''};
    const {Icon} = config;
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}><Icon size={24} color={config.color} /></View>
        <View style={{flex: 1}}>
          <Text style={styles.cardTitle}>{config.title}</Text>
          {!!config.text && <Text style={styles.muted}>{config.text}</Text>}
        </View>
      </View>
    );
  };

  const renderEarnings = () => (
    <>
      <View style={styles.earnCard}>
        <Text style={styles.earnLabel}>{t('Ready for payout')}</Text>
        <Text style={styles.earnAmount}>{money(totals.available)}</Text>
        <Text style={styles.earnMeta}>{Number(application.commissionRate || 0)}% {t('commission rate')}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{money(totals.inPayout)}</Text>
          <Text style={styles.statLabel}>{t('In payout request')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{money(totals.paid)}</Text>
          <Text style={styles.statLabel}>{t('Total paid')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totals.attributedOrders || 0}</Text>
          <Text style={styles.statLabel}>{t('orders')}</Text>
        </View>
      </View>
    </>
  );

  const renderReferral = () => (
    <>
      <Text style={styles.sectionTitle}>{t('Your referral code')}</Text>
      <TouchableOpacity style={styles.codeCard} onPress={shareCode}>
        <Text style={styles.codeText}>{application.referralCode}</Text>
        <Share2 size={20} color={Constants.greennew} />
      </TouchableOpacity>
      <Text style={styles.hint}>{t('Customers enter this code in "Coupon or referral code" at checkout.')}</Text>
      {!!application.referralLink && (
        <>
          <Text style={styles.sectionTitle}>{t('Your referral link')}</Text>
          <View style={styles.linkCard}>
            <Link2 size={20} color={Constants.greennew} />
            <Text style={styles.linkText} numberOfLines={2}>{application.referralLink}</Text>
          </View>
        </>
      )}
      <TouchableOpacity style={styles.primaryButton} onPress={shareReferral}>
        <Text style={styles.primaryText}>{t('Share referral link')}</Text>
      </TouchableOpacity>
    </>
  );

  const renderActivity = () => {
    const commissions = dashboard?.commissions || [];
    const pendingOrders = dashboard?.pendingOrders || [];
    const payouts = dashboard?.payouts || [];
    return (
      <>
        {Number(totals.available) > 0 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={requestPayout} disabled={saving}>
            <Text style={styles.secondaryText}>{saving ? t('Requesting...') : `${t('Request payout')} · ${money(totals.available)}`}</Text>
          </TouchableOpacity>
        )}

        {pendingOrders.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('Orders awaiting completion')}</Text>
            <Text style={styles.hint}>{t('Commission is added when the order is completed or delivered.')}</Text>
            {pendingOrders.map(order => (
              <View style={styles.commissionRow} key={order._id}>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>{t('Order')} {order.orderId}</Text>
                  <Text style={styles.muted}>{shortDate(order.createdAt)} · {t(order.status)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>{t('Commission activity')}</Text>
        {commissions.length === 0 && <Text style={styles.muted}>{t('No commission yet. Share your link to get started.')}</Text>}
        {commissions.map(item => (
          <View style={styles.commissionRow} key={item._id}>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>{t('Order')} {item.orderNumber}</Text>
              <Text style={styles.muted}>
                {t('Eligible amount')} {money(item.eligibleOrderAmount)} · {item.commissionRate}%
              </Text>
              <Text style={[styles.muted, item.status === 'Reversed' && {color: Constants.red}]}>
                {t(COMMISSION_STATUS[item.status] || item.status)} · {shortDate(item.createdAt)}
              </Text>
            </View>
            <Text style={[styles.amount, item.status === 'Reversed' && {color: '#9AA5A0', textDecorationLine: 'line-through'}]}>
              {money(item.commissionAmount)}
            </Text>
          </View>
        ))}

        {payouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('Payout history')}</Text>
            {payouts.map(payout => (
              <View style={styles.commissionRow} key={payout._id}>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>{t(payout.status)}</Text>
                  <Text style={styles.muted}>
                    {shortDate(payout.paidAt || payout.createdAt)} · {payout.orderCount} {t('orders')}
                  </Text>
                  {!!payout.transactionReference && (
                    <Text style={styles.muted}>{t('Ref')}: {payout.transactionReference}</Text>
                  )}
                  {!!payout.rejectionReason && (
                    <Text style={[styles.muted, {color: Constants.red}]}>{payout.rejectionReason}</Text>
                  )}
                </View>
                <Text style={styles.amount}>{money(payout.status === 'Paid' ? payout.paymentAmount : payout.totalAmount)}</Text>
              </View>
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('Affiliate program')} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Constants.greennew} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {showForm ? (
            renderForm()
          ) : (
            <>
              {renderStatusCard()}
              {status === 'Rejected' && (
                <TouchableOpacity style={styles.primaryButton} onPress={startReapply}>
                  <Text style={styles.primaryText}>{t('Apply again')}</Text>
                </TouchableOpacity>
              )}
              {status === 'Approved' && renderEarnings()}
              {status === 'Approved' && renderReferral()}
              {['Approved', 'Suspended'].includes(status) && renderActivity()}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const Header = ({title}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigate('Account')}><ArrowLeft size={22} color={Constants.black} /></TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
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
  statsRow: {flexDirection: 'row', gap: 8, marginTop: 10},
  statBox: {flex: 1, backgroundColor: Constants.white, borderRadius: 14, padding: 12},
  statValue: {fontFamily: FONTS.SemiBold, color: Constants.black, fontSize: 15},
  statLabel: {fontFamily: FONTS.Regular, color: '#68756D', fontSize: 11, marginTop: 2},
  codeCard: {backgroundColor: Constants.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#DCE8DE', borderStyle: 'dashed', marginBottom: 8},
  codeText: {fontFamily: FONTS.Bold, color: Constants.greennew, fontSize: 22, letterSpacing: 2},
  linkCard: {backgroundColor: Constants.white, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10},
  linkText: {flex: 1, color: Constants.black, fontFamily: FONTS.Regular, fontSize: 13},
  commissionRow: {backgroundColor: Constants.white, borderRadius: 13, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  amount: {fontFamily: FONTS.SemiBold, color: Constants.greennew, fontSize: 16, marginLeft: 10},
});

export default Affiliation;
