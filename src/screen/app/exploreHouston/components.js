import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../../Assets/Helpers/constant';

export const exploreColors = {
  green: '#206b3a',
  heading: '#1f3d1f',
  text: '#111827',
  body: '#4b5563',
  muted: '#6b7280',
  subtle: '#9ca3af',
  border: '#e5e7eb',
  lightBorder: '#f3f4f6',
  surface: '#f9fafb',
  imageBackground: '#edf6ef',
  amber: '#f59e0b',
  open: '#16a34a',
  closed: '#ef4444',
};

export const exploreStyles = StyleSheet.create({
  text: { fontFamily: FONTS.Regular, color: exploreColors.body, includeFontPadding: false },
  medium: { fontFamily: FONTS.Medium, includeFontPadding: false },
  semibold: { fontFamily: FONTS.SemiBold, includeFontPadding: false },
  bold: { fontFamily: FONTS.Bold, includeFontPadding: false },
  shadow: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.8 },
});

export function StoreImage({ url, icon: Icon, size, color = exploreColors.green, background, strokeWidth, style }) {
  const [failedUrl, setFailedUrl] = useState(null);

  return (
    <View style={[styles.cover, { backgroundColor: background || exploreColors.imageBackground }, style]}>
      {url && failedUrl !== url ? (
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailedUrl(url)}
        />
      ) : <Icon size={size} color={color} strokeWidth={strokeWidth} />}
    </View>
  );
}

export function StoreBackButton({ label, onPress }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || t('Back')}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.back, pressed && exploreStyles.pressed]}>
      <ArrowLeft size={18} color={exploreColors.green} />
      {label && <Text style={[exploreStyles.semibold, styles.backLabel]}>{label}</Text>}
    </Pressable>
  );
}

export function StoreNotice({ loading, title, description, onRetry }) {
  const { t } = useTranslation();

  return (
    <View style={styles.notice}>
      {loading ? <ActivityIndicator color={exploreColors.green} accessibilityLabel={t('Loading...')} /> : (
        <>
          <Text style={[exploreStyles.semibold, styles.noticeTitle]}>{title}</Text>
          {description && <Text style={[exploreStyles.text, styles.noticeDescription]}>{description}</Text>}
          {onRetry && <StoreButton label={t('Try again')} onPress={onRetry} style={styles.retry} />}
        </>
      )}
    </View>
  );
}

export function StoreButton({ label, onPress, disabled, destructive, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, destructive && styles.destructive, style,
        (pressed || disabled) && exploreStyles.pressed]}>
      <Text style={[exploreStyles.semibold, styles.buttonText, destructive && styles.destructiveText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { position: 'absolute', width: '100%', height: '100%' },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingVertical: 8 },
  backLabel: { color: exploreColors.green, fontSize: 14 },
  notice: {
    ...exploreStyles.shadow,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  noticeTitle: { fontSize: 20, color: '#1f2937', textAlign: 'center' },
  noticeDescription: { marginTop: 8, fontSize: 14, color: exploreColors.muted, textAlign: 'center' },
  retry: { marginTop: 16 },
  button: { borderRadius: 8, backgroundColor: exploreColors.green, paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { fontSize: 14, color: '#fff', textAlign: 'center' },
  destructive: { borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff' },
  destructiveText: { color: '#dc2626' },
});
