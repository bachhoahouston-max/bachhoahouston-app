import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {COLORS, FONTS} from '../theme';

// Same notched bar as the customer tabs (TabScreen.js), in the panel's green.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const BAR_WIDTH = Dimensions.get('window').width;
const SAFE_BOTTOM = Platform.OS === 'ios' ? 22 : 8;
const BAR_HEIGHT = (Platform.OS === 'ios' ? 60 : 56) + SAFE_BOTTOM;
const CORNER_RADIUS = 24;
const NOTCH_WIDTH = 60;
const NOTCH_PAD = 14;
const NOTCH_DEPTH = 30;
const CIRCLE_SIZE = 52;
const PADDING_ABOVE = 5;
const ICON_SIZE = 19;
const WRAPPER_HEIGHT = BAR_HEIGHT + 35;

// Bottom padding a scrollable page needs so its last item clears the bar.
export const TAB_BAR_SPACE = WRAPPER_HEIGHT + 16;

const buildBarPath = notchX => {
  const half = NOTCH_WIDTH / 2;
  const left = notchX - half;
  const right = notchX + half;
  const shoulderLeft = Math.max(left - NOTCH_PAD, 0);
  const shoulderRight = Math.min(right + NOTCH_PAD, BAR_WIDTH);
  const leftRadius = Math.min(CORNER_RADIUS, shoulderLeft);
  const rightRadius = Math.min(CORNER_RADIUS, BAR_WIDTH - shoulderRight);
  return [
    `M0,${leftRadius}`,
    `Q0,0 ${leftRadius},0`,
    `L${shoulderLeft},0`,
    `C${left},0 ${left},${NOTCH_DEPTH} ${notchX},${NOTCH_DEPTH}`,
    `C${right},${NOTCH_DEPTH} ${right},0 ${shoulderRight},0`,
    `L${BAR_WIDTH - rightRadius},0`,
    `Q${BAR_WIDTH},0 ${BAR_WIDTH},${rightRadius}`,
    `L${BAR_WIDTH},${BAR_HEIGHT}`,
    `L0,${BAR_HEIGHT}`,
    'Z',
  ].join(' ');
};

/**
 * `tabs[i].onPress`, when set, replaces normal tab switching (used by "Shop",
 * which opens the customer store instead of a page inside the panel).
 */
const AffiliateTabBar = ({state, navigation, tabs}) => {
  const {t: translate} = useTranslation();
  const tabWidth = BAR_WIDTH / tabs.length;
  const activeAnim = useRef(new Animated.Value(state.index)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    Animated.spring(activeAnim, {toValue: state.index, useNativeDriver: false, friction: 7, tension: 60}).start();
  }, [activeAnim, state.index]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  const inputRange = tabs.map((_, index) => index);
  const animatedPath = activeAnim.interpolate({
    inputRange,
    outputRange: tabs.map((_, index) => buildBarPath(tabWidth * index + tabWidth / 2)),
  });
  const activeTranslateX = activeAnim.interpolate({
    inputRange,
    outputRange: tabs.map((_, index) => tabWidth * index),
  });
  const activeTab = tabs[state.index];
  const ActiveIcon = activeTab.icon;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        <Svg width={BAR_WIDTH} height={BAR_HEIGHT}>
          <AnimatedPath d={animatedPath} fill={COLORS.primary} />
        </Svg>
      </View>
      <View style={styles.buttonsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const item = tabs[index];
          const Icon = item.icon;
          const onPress = () => {
            if (item.onPress) {
              item.onPress();
              return;
            }
            const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={translate(item.name)}
              accessibilityState={isFocused ? {selected: true} : {}}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tabButton, {width: tabWidth}]}>
              {/* The active icon lives in the floating circle; keep its slot so every label shares one baseline. */}
              {isFocused ? <View style={styles.iconSlot} /> : <Icon color={COLORS.white} size={ICON_SIZE} />}
              <Text style={[styles.tabText, isFocused && styles.activeText]} numberOfLines={1}>
                {translate(item.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.activeGroup, {width: tabWidth, transform: [{translateX: activeTranslateX}]}]}>
        <View style={styles.activeCircle}>
          <ActiveIcon color={COLORS.primary} size={22} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {position: 'absolute', left: 0, right: 0, bottom: 0, height: WRAPPER_HEIGHT},
  bar: {position: 'absolute', left: 0, bottom: 0, width: BAR_WIDTH, height: BAR_HEIGHT},
  buttonsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    paddingBottom: SAFE_BOTTOM,
  },
  tabButton: {alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2},
  iconSlot: {width: ICON_SIZE, height: ICON_SIZE},
  tabText: {color: COLORS.white, fontFamily: FONTS.Medium, fontSize: 10.5, lineHeight: 14, opacity: 0.92},
  activeGroup: {position: 'absolute', left: 0, top: PADDING_ABOVE, alignItems: 'center'},
  activeCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activeText: {fontFamily: FONTS.Bold, fontSize: 11, opacity: 1},
});

export default AffiliateTabBar;
