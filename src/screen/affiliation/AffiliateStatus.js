import React, {useContext, useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CheckCircle2, Clock3, LogIn, LogOut, RefreshCw, ShoppingBag, XCircle} from 'lucide-react-native';
import {UserContext} from '../../../App';
import {reset} from '../../../navigationRef';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import {Button, Card} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {shortDate} from './utils';

/**
 * Shown instead of the affiliate tabs while there is no approved account:
 * signed out, application under review, or application rejected.
 */
const AffiliateStatus = ({navigation}) => {
  const {t} = useTranslation();
  const [user, setuser] = useContext(UserContext);
  const {dashboard, refresh} = useAffiliate();
  const [refreshing, setRefreshing] = useState(false);
  const application = dashboard?.application;
  const signedOut = !user?.token;
  const rejected = application?.status === 'Rejected';

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

  const config = signedOut
    ? {
        Icon: LogIn,
        color: COLORS.primary,
        bg: COLORS.primarySoft,
        title: t('Join our affiliate program'),
        text: t('Sign in to apply and earn commission from qualifying orders.'),
      }
    : rejected
      ? {
          Icon: XCircle,
          color: COLORS.danger,
          bg: COLORS.dangerSoft,
          title: t('Application not approved'),
          text: application?.rejectionReason
            ? `${t('Reason')}: ${application.rejectionReason}`
            : t('You can update your details and apply again.'),
        }
      : {
          Icon: Clock3,
          color: COLORS.warning,
          bg: COLORS.warningSoft,
          title: t('Application under review'),
          text: t('We will notify you after the manager reviews your application.'),
        };
  const {Icon} = config;

  const timeline = [
    {label: t('Application submitted'), date: shortDate(application?.createdAt), done: true},
    {label: t('Manager review'), done: rejected, failed: rejected},
    {label: t('Start earning'), done: false},
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          signedOut ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }>
        <AffiliateHeader
          title={t('Affiliate program')}
          subtitle={t('Share, earn, grow')}
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          right={
            signedOut ? null : (
              <TouchableOpacity style={styles.logout} onPress={logout} accessibilityLabel={t('Log Out')}>
                <LogOut size={18} color={COLORS.white} />
              </TouchableOpacity>
            )
          }
        />

        <View style={styles.body}>
          <Card style={styles.statusCard}>
            <View style={[styles.statusIcon, {backgroundColor: config.bg}]}>
              <Icon size={30} color={config.color} />
            </View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.text}>{config.text}</Text>

            {!signedOut && (
              <View style={styles.timeline}>
                {timeline.map((step, index) => (
                  <View key={step.label} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          step.done && styles.timelineDone,
                          step.failed && {backgroundColor: COLORS.danger, borderColor: COLORS.danger},
                        ]}>
                        {step.done && !step.failed && <CheckCircle2 size={14} color={COLORS.white} />}
                        {step.failed && <XCircle size={14} color={COLORS.white} />}
                      </View>
                      {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineLabel}>{step.label}</Text>
                      {!!step.date && <Text style={styles.timelineDate}>{step.date}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <View style={styles.actions}>
            {signedOut && <Button label={t('Sign in')} icon={LogIn} onPress={() => navigation.navigate('Auth')} />}
            {rejected && (
              <Button
                label={t('Apply again')}
                icon={RefreshCw}
                onPress={() => navigation.navigate('AffiliateApply', {reapply: true})}
              />
            )}
          </View>
          <View style={styles.actions}>
            <Button
              label={t('Continue shopping')}
              icon={ShoppingBag}
              variant="outline"
              onPress={() => navigation.navigate('App')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: 40},
  body: {paddingHorizontal: 14, paddingTop: 18},
  logout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {alignItems: 'center', paddingVertical: 26},
  statusIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {fontFamily: FONTS.Bold, fontSize: 19, color: COLORS.text, textAlign: 'center'},
  text: {
    fontFamily: FONTS.Regular,
    fontSize: 13.5,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  timeline: {alignSelf: 'stretch', marginTop: 22, paddingHorizontal: 8},
  timelineRow: {flexDirection: 'row'},
  timelineRail: {alignItems: 'center', width: 24},
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDone: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  timelineLine: {width: 2, flex: 1, minHeight: 18, backgroundColor: COLORS.primaryBorder, marginVertical: 3},
  timelineBody: {flex: 1, paddingLeft: 12, paddingBottom: 14},
  timelineLabel: {fontFamily: FONTS.Medium, fontSize: 13.5, color: COLORS.text},
  timelineDate: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.muted},
  actions: {flexDirection: 'row', marginTop: 12, borderRadius: RADIUS.lg},
});

export default AffiliateStatus;
