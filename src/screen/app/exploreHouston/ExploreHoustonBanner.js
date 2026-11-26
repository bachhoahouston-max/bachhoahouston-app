import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import StoreCommunityIcon from '../../../Assets/Icon/store-community.svg';
import { exploreColors, exploreStyles } from './components';

export default function ExploreHoustonBanner({ onPress }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const narrow = width < 360;
  const compactHome = onPress && width < 375;
  const iconSize = wide ? 80 : onPress ? (compactHome ? 42 : 44) : narrow ? 48 : 56;
  const title = t('Explore Houston');
  const description = t('Local businesses and places recommended by the community');
  const homeTitle = wide ? styles.wideTitle : styles.homeTitle;
  const directoryTitle = wide ? styles.wideHeading : styles.heading;

  const contents = (
    <>
      <StoreCommunityIcon width={iconSize} height={iconSize} />
      <View style={[styles.divider, !onPress && (wide ? styles.wideDivider : styles.directoryDivider)]} />
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[
          exploreStyles.bold,
          styles.title,
          onPress ? homeTitle : directoryTitle,
        ]}>
          {title}
        </Text>
        <Text style={[exploreStyles.text, styles.description, onPress && styles.homeDescription, wide && styles.wideDescription]}>
          {description}
        </Text>
      </View>
      {onPress && (
        <View style={[styles.cta, wide && styles.wideCta]}>
          <Text style={[exploreStyles.semibold, styles.ctaLabel, wide && styles.wideCtaLabel]}>
            {t('Explore')}
          </Text>
          <ChevronRight size={wide ? 16 : 13} color="#fff" strokeWidth={2.5} />
        </View>
      )}
    </>
  );

  if (!onPress) {
    return <View style={[styles.banner, wide && styles.wideBanner, wide && styles.wideDirectory]}>{contents}</View>;
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner, styles.home, wide && styles.wideBanner, compactHome && styles.narrowBanner,
        pressed && exploreStyles.pressed,
      ]}>
      {contents}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...exploreStyles.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cfe8cf',
    backgroundColor: '#e8f6e6',
  },
  home: {
    marginHorizontal: 16,
    marginVertical: 4,
    minHeight: 72,
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  wideBanner: { gap: 24, paddingHorizontal: 16, paddingVertical: 20 },
  narrowBanner: { gap: 7, paddingHorizontal: 9 },
  wideDirectory: { paddingHorizontal: 32 },
  divider: { alignSelf: 'stretch', width: 1, backgroundColor: '#bcdcbc' },
  directoryDivider: { height: 56 },
  wideDivider: { height: 64 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: exploreColors.heading },
  homeTitle: { fontSize: 15, lineHeight: 19 },
  wideTitle: { fontSize: 26, lineHeight: 33 },
  heading: { fontSize: 22, lineHeight: 27 },
  wideHeading: { fontSize: 36, lineHeight: 45 },
  description: { marginTop: 2, fontSize: 12, lineHeight: 16, color: exploreColors.body },
  homeDescription: { fontSize: 10, lineHeight: 14 },
  wideDescription: { fontSize: 16, lineHeight: 22 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2e7d32',
    borderRadius: 999,
  },
  wideCta: { paddingHorizontal: 28, paddingVertical: 12 },
  ctaLabel: { color: '#fff', fontSize: 11.5, lineHeight: 17 },
  wideCtaLabel: { fontSize: 16, lineHeight: 24 },
});
