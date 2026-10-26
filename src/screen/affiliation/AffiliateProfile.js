import React, {useContext, useState} from 'react';
import {Alert, Image, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  ExternalLink,
  Hash,
  LogOut,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  Package,
  Pencil,
  Percent,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react-native';
import {UserContext} from '../../../App';
import {reset} from '../../../navigationRef';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import {TAB_BAR_SPACE} from './components/AffiliateTabBar';
import {Card, SectionHeader, StatusPill} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {APPLICATION_STATUS, copyText, displayLink, getPlatform, openUrl, shareReferral, shortDate} from './utils';

const InfoRow = ({icon: Icon, label, value, onPress, last}) => (
  <TouchableOpacity
    style={[styles.infoRow, !last && styles.divider]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}>
    <View style={styles.infoIcon}>
      <Icon size={16} color={COLORS.primary} />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value || '—'}</Text>
  </TouchableOpacity>
);

const MenuRow = ({icon: Icon, label, onPress, danger, last}) => (
  <TouchableOpacity style={[styles.menuRow, !last && styles.divider]} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.infoIcon, danger && {backgroundColor: COLORS.dangerSoft}]}>
      <Icon size={16} color={danger ? COLORS.danger : COLORS.primary} />
    </View>
    <Text style={[styles.menuLabel, danger && {color: COLORS.danger}]}>{label}</Text>
    {!danger && <ChevronRight size={18} color={COLORS.muted} />}
  </TouchableOpacity>
);

const AffiliateProfile = ({navigation}) => {
  const {t} = useTranslation();
  const [user, setuser] = useContext(UserContext);
  const {dashboard, refresh} = useAffiliate();
  const [refreshing, setRefreshing] = useState(false);

  const application = dashboard?.application || {};
  const profile = {...(user || {}), ...(application.user || {})};
  const status = APPLICATION_STATUS[application.status] || APPLICATION_STATUS.Approved;
  const code = application.referralCode || '';
  const link = application.referralLink || '';
  const suspended = application.status === 'Suspended';
  const encoded = encodeURIComponent(t('Shop at Bach Hoa Houston with my referral code {{code}}: {{link}}', {code, link}));

  // "Share to" targets for the referral code and link.
  const channels = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      render: <Ionicons name="logo-whatsapp" size={22} color="#25D366" />,
      open: () => Linking.openURL(`whatsapp://send?text=${encoded}`).catch(() => openUrl(`https://wa.me/?text=${encoded}`)),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      render: <Ionicons name="logo-facebook" size={22} color="#1877F2" />,
      open: () => openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`),
    },
    {
      key: 'x',
      label: 'X',
      render: <Ionicons name="logo-twitter" size={22} color="#111111" />,
      open: () => openUrl(`https://twitter.com/intent/tweet?text=${encoded}`),
    },
    {
      key: 'sms',
      label: t('Message'),
      render: <MessageSquareText size={22} color={COLORS.primary} />,
      open: () => Linking.openURL(`sms:${Platform.OS === 'ios' ? '&' : '?'}body=${encoded}`).catch(() => {}),
    },
    {
      key: 'email',
      label: t('Email'),
      render: <Mail size={22} color={COLORS.info} />,
      open: () =>
        Linking.openURL(`mailto:?subject=${encodeURIComponent(t('Shop with my referral link'))}&body=${encoded}`).catch(() => {}),
    },
    {
      key: 'more',
      label: t('More'),
      render: <MoreHorizontal size={22} color={COLORS.textSecondary} />,
      open: () => shareReferral(t, application),
    },
  ];

  const initials = String(profile.name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const logout = () => {
    Alert.alert(t('Log Out'), t('Are you sure you want to log out?'), [
      {text: t('Cancel'), style: 'cancel'},
      {
        text: t('Log Out'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userDetail');
          setuser({});
          reset('Auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <AffiliateHeader compact title={t('My profile')} subtitle={t('Your account and payout details')} />

        <View style={styles.body}>
          <Card style={styles.profileCard}>
            {profile.avatar ? (
              <Image source={{uri: profile.avatar}} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>{profile.name || t('Affiliate')}</Text>
              {!!profile.email && <Text style={styles.contact} numberOfLines={1}>{profile.email}</Text>}
              <View style={styles.pillRow}>
                <StatusPill
                  label={t(status.label)}
                  color={status.color}
                  bg={status.bg === COLORS.white ? COLORS.primarySoft : status.bg}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('Profile')}
              accessibilityLabel={t('Edit Profile')}>
              <Pencil size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </Card>

          <SectionHeader title={t('Affiliate details')} style={styles.sectionGap} />
          <Card style={styles.listCard}>
            <InfoRow
              icon={Hash}
              label={t('Referral code')}
              value={application.referralCode}
              onPress={() => copyText(application.referralCode, t('Referral code copied'))}
            />
            <InfoRow icon={Percent} label={t('Commission Rate')} value={`${Number(application.commissionRate || 0)}%`} />
            <InfoRow
              icon={CalendarCheck}
              label={t('Member since')}
              value={shortDate(application.approvedAt || application.createdAt)}
              last
            />
          </Card>

          <SectionHeader title={t('Share to')} style={styles.sectionGap} />
          <Card style={styles.channelsCard}>
            {channels.map(channel => (
              <TouchableOpacity
                key={channel.key}
                style={styles.channel}
                onPress={channel.open}
                disabled={suspended || !code}
                activeOpacity={0.75}>
                <View style={styles.channelIcon}>{channel.render}</View>
                <Text style={styles.channelLabel} numberOfLines={1}>{channel.label}</Text>
              </TouchableOpacity>
            ))}
          </Card>

          {!!application.socialLinks?.length && (
            <>
              <SectionHeader title={t('Your channels')} style={styles.sectionGap} />
              <Card style={styles.listCard}>
                {application.socialLinks.map((item, index) => {
                  const platform = getPlatform(item.platform);
                  return (
                    <TouchableOpacity
                      key={`${item.platform}-${index}`}
                      style={[styles.socialRow, index < application.socialLinks.length - 1 && styles.divider]}
                      onPress={() => openUrl(item.url)}>
                      <View style={styles.socialIcon}>
                        <Ionicons name={platform.icon} size={18} color={platform.color} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.socialName}>{platform.label}</Text>
                        <Text style={styles.socialUrl} numberOfLines={1}>{displayLink(item.url)}</Text>
                      </View>
                      <ExternalLink size={16} color={COLORS.muted} />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </>
          )}

          <SectionHeader title={t('Payout method')} style={styles.sectionGap} />
          <Card style={styles.listCard}>
            <View style={styles.zelleBadge}>
              <Text style={styles.zelleText}>Zelle</Text>
            </View>
            <InfoRow icon={Mail} label={t('Zelle email')} value={application.zelleEmail} />
            <InfoRow icon={Phone} label={t('Zelle phone')} value={application.zellePhone} last />
          </Card>
          <Text style={styles.footnote}>{t('To change your payout details, please contact the store.')}</Text>

          <SectionHeader title={t('Account')} style={styles.sectionGap} />
          <Card style={styles.listCard}>
            <MenuRow icon={ShoppingBag} label={t('Shop the store')} onPress={() => navigation.navigate('App')} />
            <MenuRow icon={Package} label={t('My orders')} onPress={() => navigation.navigate('Myorder')} />
            <MenuRow icon={Bell} label={t('Notifications')} onPress={() => navigation.navigate('Notification')} />
            <MenuRow icon={UserRound} label={t('Edit Profile')} onPress={() => navigation.navigate('Profile')} />
            <MenuRow icon={LogOut} label={t('Log Out')} onPress={logout} danger last />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: TAB_BAR_SPACE},
  body: {paddingHorizontal: 14, paddingTop: 18},
  flex: {flex: 1},
  profileCard: {flexDirection: 'row', alignItems: 'center', gap: 14},
  avatar: {width: 60, height: 60, borderRadius: 30},
  avatarFallback: {backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center'},
  initials: {fontFamily: FONTS.Bold, fontSize: 20, color: COLORS.white},
  name: {fontFamily: FONTS.SemiBold, fontSize: 17, color: COLORS.text},
  contact: {fontFamily: FONTS.Regular, fontSize: 12.5, color: COLORS.muted},
  pillRow: {marginTop: 6},
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionGap: {marginTop: 22},
  listCard: {paddingVertical: 4},
  infoRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12},
  menuRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12},
  divider: {borderBottomWidth: 1, borderBottomColor: COLORS.divider},
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {fontFamily: FONTS.Regular, fontSize: 13.5, color: COLORS.textSecondary},
  infoValue: {flex: 1, textAlign: 'right', fontFamily: FONTS.SemiBold, fontSize: 13.5, color: COLORS.text},
  menuLabel: {flex: 1, fontFamily: FONTS.Medium, fontSize: 14, color: COLORS.text},
  zelleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6D1ED4',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
    marginBottom: 2,
  },
  zelleText: {fontFamily: FONTS.Bold, fontSize: 12, color: COLORS.white},
  channelsCard: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, paddingVertical: 10},
  channel: {width: '33.33%', alignItems: 'center', paddingVertical: 10},
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {fontFamily: FONTS.Medium, fontSize: 12, color: COLORS.textSecondary, marginTop: 6},
  socialRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12},
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialName: {fontFamily: FONTS.SemiBold, fontSize: 13.5, color: COLORS.text},
  socialUrl: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted},
  footnote: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 8, marginHorizontal: 4},
});

export default AffiliateProfile;
