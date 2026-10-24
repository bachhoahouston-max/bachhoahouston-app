import React, {useContext, useState} from 'react';
import {Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  Hash,
  LogOut,
  Mail,
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
import {APPLICATION_STATUS, copyText, shortDate} from './utils';

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
  footnote: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted, marginTop: 8, marginHorizontal: 4},
});

export default AffiliateProfile;
