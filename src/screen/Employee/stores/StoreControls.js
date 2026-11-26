import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, Store } from 'lucide-react-native';
import Constants, { FONTS } from '../../../Assets/Helpers/constant';

export const green = Constants.greennew;
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6F3' },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E9E1',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  fill: { flex: 1 },
  title: { color: '#17251A', fontFamily: FONTS.SemiBold, fontSize: 18 },
  label: { color: '#223326', fontFamily: FONTS.SemiBold, fontSize: 14 },
  body: { color: '#35483A', fontFamily: FONTS.Regular, fontSize: 14 },
  muted: { color: '#57695B', fontFamily: FONTS.Regular, fontSize: 13 },
  field: { gap: 5 },
  input: {
    borderColor: '#D3DFD4',
    borderWidth: 1,
    backgroundColor: '#FFF',
    borderRadius: 9,
    color: '#17251A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontFamily: FONTS.Regular,
  },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  button: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CADBCD',
    backgroundColor: '#FFF',
  },
  buttonText: {
    color: green,
    fontFamily: FONTS.SemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  primary: { backgroundColor: green, borderColor: green },
  primaryText: { color: '#FFF' },
  dangerText: { color: '#A62828' },
  disabled: { opacity: 0.5 },
  header: {
    backgroundColor: green,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    minHeight: 54,
    paddingRight: 14,
  },
  headerTitle: {
    color: '#FFF',
    flex: 1,
    fontFamily: FONTS.SemiBold,
    fontSize: 18,
  },
  back: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: { width: '100%', height: '100%' },
  photo: { width: 86, height: 76, borderRadius: 9, backgroundColor: '#E4EFE5' },
  state: { alignItems: 'center', padding: 18, gap: 10 },
  divider: { borderTopWidth: 1, borderTopColor: '#E0E9E1', paddingTop: 12 },
  badge: {
    backgroundColor: '#E8F3E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});

export function Button({
  label,
  onPress,
  disabled,
  primary,
  danger,
  style,
  selected,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        (primary || selected) && styles.primary,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          (primary || selected) && styles.primaryText,
          danger && styles.dangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function StoreHeader({ title, backLabel, onBack, disabled }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        disabled={disabled}
        onPress={onBack}
        style={styles.back}
      >
        <ArrowLeft color="#FFF" size={23} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        {title}
      </Text>
    </View>
  );
}

export function Field({ label, multiline, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#65776A"
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

export function Toggle({ label, value, onChange, disabled }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, styles.fill]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: '#81B885' }}
      />
    </View>
  );
}

export function LoadState({ loading, error, message, retry, onRetry }) {
  if (!loading && !error && !message) return null;
  return (
    <View style={styles.state}>
      {loading && <ActivityIndicator color={green} />}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={styles.muted}>
          {message}
        </Text>
      )}
      {error && <Button label={retry} onPress={onRetry} />}
    </View>
  );
}

export function StoreIcon({ image, Icon = Store, background = '#edf6ef' }) {
  return (
    <View style={[styles.iconTile, { backgroundColor: background }]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.iconImage} />
      ) : (
        <Icon color={green} size={23} />
      )}
    </View>
  );
}
