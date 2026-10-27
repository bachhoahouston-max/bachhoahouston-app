import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { Home, LayoutDashboard, BringToFront, ShoppingCart, Gift } from 'lucide-react-native';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import HomeScreen from '../screen/app/Home';
import Categories from '../screen/app/Categories';
import Referal from '../screen/app/Referal';
import Cart from '../screen/app/Cart';
import { useTranslation } from 'react-i18next';
import Myorder from '../screen/app/Myorder';
import Products from '../screen/app/Products';
import Payment from '../screen/app/Payment';
import Rewards from '../screen/app/Rewards';
import { createStackNavigator } from '@react-navigation/stack';
import { CartContext } from '../../App';

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();
const AnimatedPath = Animated.createAnimatedComponent(Path);
const BAR_WIDTH = Dimensions.get('window').width;
const SAFE_BOTTOM = Platform.OS === 'ios' ? 22 : 8;
const BAR_HEIGHT = (Platform.OS === 'ios' ? 60 : 56) + SAFE_BOTTOM;
const CORNER_RADIUS = 24;
const NOTCH_WIDTH = 60;
const NOTCH_PAD = 14;
const NOTCH_DEPTH = 30;
const CIRCLE_SIZE = 52;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const PADDING_ABOVE = 5;
const WRAPPER_HEIGHT = BAR_HEIGHT + 35;

const ICON_SIZE = 20;

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

const AnimatedTabBar = ({ state, navigation, tabs, cartCount, translate }) => {
  const tabWidth = BAR_WIDTH / tabs.length;
  const activeAnim = useRef(new Animated.Value(state.index)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: state.index,
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
  }, [activeAnim, state.index]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
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
    <View style={styles.animatedWrapper} pointerEvents="box-none">
      <View style={styles.animatedBar}>
        <Svg width={BAR_WIDTH} height={BAR_HEIGHT}>
          <AnimatedPath d={animatedPath} fill={Constants.greennew} />
        </Svg>
      </View>
      <View style={styles.animatedButtonsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const item = tabs[index];
          const IconComponent = item.icon;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.animatedTabButton, { width: tabWidth }]}>
              {/* The active icon lives in the floating circle; keep its slot so every label shares one baseline. */}
              {isFocused ? (
                <View style={styles.animatedIconSlot} />
              ) : (
                <IconComponent color={Constants.white} size={ICON_SIZE} />
              )}
              <Text
                style={[styles.animatedTabText, isFocused && styles.animatedActiveText]}
                numberOfLines={1}>
                {translate(item.name)}
              </Text>
              {!isFocused && item.routeName === 'Cart' && cartCount > 0 && (
                <View style={styles.animatedBadge}>
                  <Text style={[styles.animatedBadgeText, styles.animatedBadgeTextOnBar]}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.animatedActiveGroup,
          { width: tabWidth, transform: [{ translateX: activeTranslateX }] },
        ]}>
        <View style={styles.animatedActiveCircle}>
          <ActiveIcon color={Constants.greennew} size={22} />
        </View>
        {activeTab.routeName === 'Cart' && cartCount > 0 && (
          <View style={styles.animatedActiveBadge}>
            <Text style={styles.animatedBadgeText}>
              {cartCount > 99 ? '99+' : cartCount}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Products" component={Products} />
  </Stack.Navigator>
);

const CategoriesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CategoriesTab" component={Categories} />
    <Stack.Screen name="Products" component={Products} />
  </Stack.Navigator>
);

const RewardsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RewardsTab" component={Rewards} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersTab" component={Myorder} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartTab" component={Cart} />
    <Stack.Screen name="Payment" component={Payment} />
  </Stack.Navigator>
);

export const TabNav = () => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);

  const TabArr = [
    {
      icon: Home,
      component: HomeStack,
      routeName: 'Home',
      name: 'Home',
    },
    {
      icon: LayoutDashboard,
      component: CategoriesStack,
      routeName: 'Categories',
      name: 'Categories',
    },
    {
      icon: Gift,
      component: RewardsStack,
      routeName: 'Rewards',
      name: 'Rewards',
    },
    {
      icon: BringToFront,
      component: OrdersStack,
      routeName: 'Orders',
      name: 'Orders',
    },
    {
      icon: ShoppingCart,
      component: CartStack,
      routeName: 'Cart',
      name: 'Cart',
    },
  ];

  const cartCount =
    cartdetail?.reduce((sum, obj) => sum + (obj?.qty ?? 0), 0) || 0;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => (
        <AnimatedTabBar
          {...props}
          tabs={TabArr}
          cartCount={cartCount}
          translate={t}
        />
      )}>
      {TabArr.map((item, index) => {
        return (
          <Tab.Screen
            key={index}
            name={item.routeName}
            component={item.component}
            options={{ tabBarShowLabel: false }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  animatedWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: WRAPPER_HEIGHT,
  },
  animatedBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
  },
  animatedButtonsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    paddingBottom: SAFE_BOTTOM,
  },
  animatedTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  animatedIconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  animatedTabText: {
    color: Constants.white,
    fontFamily: FONTS.Medium,
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.92,
  },
  animatedActiveGroup: {
    position: 'absolute',
    left: 0,
    top: PADDING_ABOVE,
    alignItems: 'center',
  },
  animatedActiveCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: Constants.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  animatedActiveText: {
    fontFamily: FONTS.Bold,
    opacity: 1,
  },
  animatedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Constants.white,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedActiveBadge: {
    position: 'absolute',
    top: 0,
    right: 12,
    backgroundColor: Constants.greennew,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  animatedBadgeTextOnBar: {
    color: Constants.greennew,
  },
});