import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowLeft, Bell, CheckCircle2} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {COLORS, FONTS, RADIUS} from '../theme';

/**
 * Green, rounded panel header. Shows the store logo (or a back button) with a
 * notification bell on top, then a title/subtitle and an optional status chip.
 * `inline` puts the title next to the back button in a single row.
 */
const AffiliateHeader = ({title, subtitle, chip, onBack, right, compact = false, inline = false}) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={onBack} hitSlop={8} accessibilityLabel="Back">
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBox}>
            <Image source={require('../../../Assets/Images/newlogo.png')} style={styles.logo} resizeMode="contain" />
          </View>
        )}
        {inline && (
          <Text style={[styles.title, styles.inlineTitle]} numberOfLines={1}>{title}</Text>
        )}
        {right !== undefined ? (
          right
        ) : (
          <TouchableOpacity
            style={styles.bell}
            onPress={() => navigation.navigate('Notification')}
            accessibilityLabel="Notifications">
            <Bell size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!inline && (
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
          </View>
          {!!chip && (
            <View style={[styles.chip, {backgroundColor: chip.bg || COLORS.white}]}>
              {chip.icon !== false && <CheckCircle2 size={14} color={chip.color} />}
              <Text style={[styles.chipText, {color: chip.color}]}>{chip.label}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  compact: {paddingBottom: 20},
  inlineTitle: {flex: 1, marginLeft: 12, fontSize: 20},
  topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  logoBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logo: {width: 64, height: 34},
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12},
  titleBlock: {flex: 1},
  title: {fontFamily: FONTS.Bold, fontSize: 24, color: COLORS.white, lineHeight: 32},
  subtitle: {fontFamily: FONTS.Regular, fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {fontFamily: FONTS.SemiBold, fontSize: 12},
});

export default AffiliateHeader;
