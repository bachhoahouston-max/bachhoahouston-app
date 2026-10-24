import React, {useState} from 'react';
import {Linking, Platform, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Copy, ExternalLink, Link2, Mail, MessageSquareText, MoreHorizontal, Share2} from 'lucide-react-native';
import {useAffiliate} from './AffiliateContext';
import AffiliateHeader from './components/AffiliateHeader';
import {TAB_BAR_SPACE} from './components/AffiliateTabBar';
import {Button, Card, SectionHeader} from './components/ui';
import {COLORS, FONTS, RADIUS} from './theme';
import {copyText, displayLink, getPlatform, openUrl, shareReferral} from './utils';

const CAPTIONS = [
  'caption_weekly',
  'caption_fresh',
  'caption_code',
];

const AffiliateLinks = () => {
  const {t} = useTranslation();
  const {dashboard, refresh} = useAffiliate();
  const [refreshing, setRefreshing] = useState(false);

  const application = dashboard?.application || {};
  const code = application.referralCode || '';
  const link = application.referralLink || '';
  const suspended = application.status === 'Suspended';
  const rate = Number(application.commissionRate || 0);
  const message = t('Shop at Bach Hoa Houston with my referral code {{code}}: {{link}}', {code, link});
  const encoded = encodeURIComponent(message);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <AffiliateHeader
          compact
          title={t('My links')}
          subtitle={t('Earn {{rate}}% on every eligible order placed with your code', {rate})}
        />

        <View style={styles.body}>
          <Card>
            <Text style={styles.overline}>{t('Your referral code')}</Text>
            <View style={styles.ticket}>
              <Text style={styles.ticketCode} numberOfLines={1} adjustsFontSizeToFit>{code || '—'}</Text>
              <Text style={styles.ticketHint}>
                {t('Customers enter this code in "Coupon or referral code" at checkout.')}
              </Text>
            </View>

            {!!link && (
              <>
                <Text style={[styles.overline, styles.gapTop]}>{t('Your referral link')}</Text>
                <View style={styles.linkBox}>
                  <Link2 size={16} color={COLORS.primary} />
                  <Text style={styles.linkText} numberOfLines={1}>{displayLink(link)}</Text>
                  <TouchableOpacity onPress={() => openUrl(link)} hitSlop={10} accessibilityLabel={t('Open link')}>
                    <ExternalLink size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.actions}>
              <Button
                label={t('Copy Link')}
                icon={Copy}
                onPress={() => copyText(link || code, t('Referral link copied'))}
                disabled={suspended || !code}
              />
              <Button
                label={t('Share')}
                icon={Share2}
                variant="outline"
                onPress={() => shareReferral(t, application)}
                disabled={suspended || !code}
              />
            </View>
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

          <SectionHeader title={t('Ready-to-post captions')} style={styles.sectionGap} />
          {CAPTIONS.map(key => {
            const text = t(key, {code, link: link || code});
            return (
              <Card key={key} style={styles.caption}>
                <Text style={styles.captionText}>{text}</Text>
                <View style={styles.captionActions}>
                  <TouchableOpacity
                    style={styles.captionAction}
                    onPress={() => copyText(text, t('Caption copied'))}
                    disabled={suspended || !code}>
                    <Copy size={14} color={COLORS.primary} />
                    <Text style={styles.captionActionText}>{t('Copy')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.captionAction}
                    onPress={() => Share.share({message: text}).catch(() => {})}
                    disabled={suspended || !code}>
                    <Share2 size={14} color={COLORS.primary} />
                    <Text style={styles.captionActionText}>{t('Share')}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

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

          <SectionHeader title={t('How it works')} style={styles.sectionGap} />
          <Card>
            {[
              {title: t('Share your code'), text: t('Post your link or code where your audience shops.')},
              {title: t('Customers order'), text: t('They enter your code at checkout on the app or website.')},
              {title: t('You earn commission'), text: t('Commission is added when the order is completed or delivered.')},
            ].map((step, index, list) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepRail}>
                  <View style={styles.stepDot}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  {index < list.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={[styles.flex, styles.stepBody]}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
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
  overline: {fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.textSecondary},
  gapTop: {marginTop: 16},
  ticket: {
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ticketCode: {fontFamily: FONTS.Bold, fontSize: 30, color: COLORS.primary, letterSpacing: 3},
  ticketHint: {fontFamily: FONTS.Regular, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6},
  linkBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {flex: 1, fontFamily: FONTS.Regular, fontSize: 13, color: COLORS.text},
  actions: {flexDirection: 'row', gap: 10, marginTop: 14},
  sectionGap: {marginTop: 22},
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
  caption: {marginBottom: 10, padding: 14},
  captionText: {fontFamily: FONTS.Regular, fontSize: 13, color: COLORS.text, lineHeight: 20},
  captionActions: {flexDirection: 'row', gap: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 10},
  captionAction: {flexDirection: 'row', alignItems: 'center', gap: 6},
  captionActionText: {fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.primary},
  listCard: {paddingVertical: 4},
  socialRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12},
  divider: {borderBottomWidth: 1, borderBottomColor: COLORS.divider},
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
  step: {flexDirection: 'row'},
  stepRail: {alignItems: 'center', width: 30},
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {fontFamily: FONTS.Bold, fontSize: 13, color: COLORS.white},
  stepLine: {flex: 1, width: 2, backgroundColor: COLORS.primaryBorder, marginVertical: 4},
  stepBody: {paddingLeft: 12, paddingBottom: 16},
  stepTitle: {fontFamily: FONTS.SemiBold, fontSize: 14, color: COLORS.text},
  stepText: {fontFamily: FONTS.Regular, fontSize: 12.5, color: COLORS.muted, marginTop: 2, lineHeight: 18},
});

export default AffiliateLinks;
