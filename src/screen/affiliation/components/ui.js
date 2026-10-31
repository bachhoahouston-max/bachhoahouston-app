import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS, FONTS, RADIUS, SHADOW} from '../theme';

// Small building blocks shared by every affiliate page.

export const Card = ({style, children}) => <View style={[styles.card, style]}>{children}</View>;

export const StatCard = ({icon: Icon, label, value}) => (
  <View style={styles.stat}>
    <View style={styles.statIcon}>
      <Icon size={14} color={COLORS.textSecondary} />
    </View>
    <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
  </View>
);

export const StatusPill = ({label, color, bg}) => (
  <View style={[styles.pill, {backgroundColor: bg}]}>
    <Text style={[styles.pillText, {color}]} numberOfLines={1}>{label}</Text>
  </View>
);

export const SectionHeader = ({title, actionLabel, onAction, style}) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {!!actionLabel && (
      <TouchableOpacity onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const Button = ({label, onPress, icon: Icon, variant = 'primary', loading, disabled, style}) => {
  const outline = variant === 'outline';
  const color = outline ? COLORS.primary : COLORS.white;
  return (
    <TouchableOpacity
      style={[styles.button, outline ? styles.buttonOutline : styles.buttonPrimary, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {!!Icon && <Icon size={16} color={color} />}
          <Text style={[styles.buttonText, {color}]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export const EmptyState = ({icon: Icon, title, text, action}) => (
  <View style={styles.empty}>
    {!!Icon && (
      <View style={styles.emptyIcon}>
        <Icon size={24} color={COLORS.primary} />
      </View>
    )}
    <Text style={styles.emptyTitle}>{title}</Text>
    {!!text && <Text style={styles.emptyText}>{text}</Text>}
    {action}
  </View>
);

export const Segmented = ({options, value, onChange}) => (
  <View style={styles.segmented}>
    {options.map(option => {
      const active = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          style={[styles.segment, active && styles.segmentActive]}
          onPress={() => onChange(option.value)}
          activeOpacity={0.85}>
          <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
            {option.label}
            {option.count ? ` (${option.count})` : ''}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOW,
  },
  stat: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primaryBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    minHeight: 96,
  },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {fontFamily: FONTS.Regular, fontSize: 11, color: COLORS.textSecondary, lineHeight: 15},
  statValue: {fontFamily: FONTS.Bold, fontSize: 17, color: COLORS.text, marginTop: 4},
  pill: {borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start'},
  pillText: {fontFamily: FONTS.SemiBold, fontSize: 10.5},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  sectionTitle: {fontFamily: FONTS.SemiBold, fontSize: 16, color: COLORS.text},
  sectionAction: {fontFamily: FONTS.SemiBold, fontSize: 13, color: COLORS.primary, textDecorationLine: 'underline'},
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonPrimary: {backgroundColor: COLORS.primary},
  buttonOutline: {backgroundColor: COLORS.white, borderWidth: 1.2, borderColor: COLORS.primary},
  buttonText: {fontFamily: FONTS.SemiBold, fontSize: 14},
  disabled: {opacity: 0.55},
  empty: {alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20},
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {fontFamily: FONTS.SemiBold, fontSize: 15, color: COLORS.text, textAlign: 'center'},
  emptyText: {fontFamily: FONTS.Regular, fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 4, lineHeight: 19},
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutralSoft,
    borderRadius: 24,
    padding: 4,
  },
  segment: {flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: 'center'},
  segmentActive: {backgroundColor: COLORS.white, ...SHADOW},
  segmentText: {fontFamily: FONTS.Medium, fontSize: 12.5, color: COLORS.muted},
  segmentTextActive: {fontFamily: FONTS.SemiBold, color: COLORS.primary},
});
