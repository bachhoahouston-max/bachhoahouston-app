import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Copy, ExternalLink, Link2, Share2} from 'lucide-react-native';
import {COLORS, FONTS, RADIUS} from '../theme';
import {copyText, displayLink, openUrl, shareReferral} from '../utils';
import {Button, Card} from './ui';

const ReferralCard = ({application, suspended, rateBadge, style}) => {
  const {t} = useTranslation();
  const code = application?.referralCode;
  const link = application?.referralLink;

  return (
    <Card style={style}>
      <Text style={styles.cardTitle}>{t('Your Referral Code')}</Text>
      <TouchableOpacity
        style={styles.codeBox}
        activeOpacity={0.8}
        onPress={() => copyText(code, t('Referral code copied'))}>
        <Text style={styles.codeText} numberOfLines={1}>{code || '—'}</Text>
        <Copy size={18} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.actions}>
        <Button
          label={t('Copy Code')}
          icon={Copy}
          onPress={() => copyText(code, t('Referral code copied'))}
          disabled={suspended || !code}
        />
        <Button
          label={t('Share Link')}
          icon={Share2}
          variant="outline"
          onPress={() => shareReferral(t, application)}
          disabled={suspended || !code}
        />
      </View>

      {!!link && (
        <TouchableOpacity
          style={styles.linkBox}
          activeOpacity={0.8}
          onPress={() => copyText(link, t('Referral link copied'))}>
          <Link2 size={16} color={COLORS.muted} />
          <Text style={styles.linkText} numberOfLines={1}>{displayLink(link)}</Text>
          <TouchableOpacity onPress={() => openUrl(link)} hitSlop={10} accessibilityLabel={t('Open link')}>
            <ExternalLink size={16} color={COLORS.muted} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <Text style={[styles.cardTitle, styles.rateTitle]}>{t('Commission Rate')}</Text>
      <View style={styles.rateBox}>
        <Text style={styles.rateText}>{Number(application?.commissionRate || 0)}%</Text>
        {!!rateBadge && (
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>{rateBadge}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardTitle: {fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.text},
  codeBox: {
    marginTop: 12,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {flex: 1, fontFamily: FONTS.SemiBold, fontSize: 18, color: COLORS.text, letterSpacing: 1},
  actions: {flexDirection: 'row', gap: 10, marginTop: 12},
  linkBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {flex: 1, fontFamily: FONTS.Regular, fontSize: 13, color: COLORS.textSecondary, textDecorationLine: 'underline'},
  rateTitle: {marginTop: 18},
  rateBox: {
    marginTop: 10,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  rateText: {fontFamily: FONTS.Bold, fontSize: 16, color: COLORS.primary},
  rateBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rateBadgeText: {fontFamily: FONTS.SemiBold, fontSize: 11.5, color: COLORS.text},
});

export default ReferralCard;
