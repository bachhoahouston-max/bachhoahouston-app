import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { GetApi } from '../Assets/Helpers/Service';
import { CategoryVisibilityContext } from '../Assets/Helpers/categoryVisibility';

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();
const BAR_WIDTH = Dimensions.get('window').width;
const SIDE_MARGIN = 8;
const BOTTOM_OFFSET = Platform.OS === 'ios' ? 28 : 12;
const PILL_HEIGHT = 58;
const PILL_PADDING = 4;
const PILL_WIDTH = BAR_WIDTH - SIDE_MARGIN * 2;
const ACTIVE_SIZE = 54;

const ICON_SIZE = 22;

const AnimatedTabBar = ({ state, navigation, tabs, cartCount, translate }) => {
  const tabWidth = (PILL_WIDTH - PILL_PADDING * 2) / tabs.length;
  const activeSize = Math.min(ACTIVE_SIZE, tabWidth);
  const activeAnim = useRef(new Animated.Value(state.index)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: state.index,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
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

  const activeTranslateX = activeAnim.interpolate({
    extrapolate: 'clamp',
    inputRange: tabs.map((_, index) => index),
    outputRange: tabs.map(
      (_, index) => PILL_PADDING + tabWidth * index + (tabWidth - activeSize) / 2,
    ),
  });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        {/* The highlight slides behind the buttons so the active icon and label draw on top of it. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeCircle,
            {
              width: activeSize,
              height: activeSize,
              borderRadius: activeSize / 2,
              top: (PILL_HEIGHT - activeSize) / 2,
              transform: [{ translateX: activeTranslateX }],
            },
          ]}
        />
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const item = tabs[index];
          const IconComponent = item.icon;
          const color = isFocused ? Constants.greennew : Constants.custom_black;
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
              activeOpacity={0.7}
              style={[styles.tabButton, { width: tabWidth }]}>
              <View>
                <IconComponent color={color} size={ICON_SIZE} strokeWidth={isFocused ? 2.2 : 2} />
                {item.routeName === 'Cart' && cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.tabText, { color }, isFocused && styles.activeText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}>
                {translate(item.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  const [categoriesVisible, setCategoriesVisible] = useState(null);

  useEffect(() => {
    let request = 0;
    const refreshVisibility = async () => {
      const current = ++request;
      try {
        const response = await GetApi('categoryModuleVisibility');
        const visible = response?.data?.isVisibleOnMobile;
        if (response?.status !== true || typeof visible !== 'boolean') {
          throw new Error('Invalid category visibility');
        }
        if (current === request) setCategoriesVisible(visible);
      } catch {
        if (current === request) setCategoriesVisible(previous => previous ?? true);
      }
    };

    refreshVisibility();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshVisibility();
    });
    return () => {
      request += 1;
      subscription.remove();
    };
  }, []);

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
  ].filter(item => item.routeName !== 'Categories' || categoriesVisible);

  const cartCount =
    cartdetail?.reduce((sum, obj) => sum + (obj?.qty ?? 0), 0) || 0;

  return (
    <CategoryVisibilityContext.Provider value={categoriesVisible}>
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
        {TabArr.map(item => {
          return (
            <Tab.Screen
              key={item.routeName}
              name={item.routeName}
              component={item.component}
              options={{ tabBarShowLabel: false }}
            />
          );
        })}
      </Tab.Navigator>
    </CategoryVisibilityContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    bottom: BOTTOM_OFFSET,
  },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PILL_PADDING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  activeCircle: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(232, 245, 233, 0.9)',
    borderWidth: 1,
    borderColor: Constants.white,
  },
  tabButton: {
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabText: {
    fontFamily: FONTS.Medium,
    fontSize: 11,
    lineHeight: 14,
  },
  activeText: {
    fontFamily: FONTS.SemiBold,
  },
  badge: {
    position: 'absolute',
    top: -9,
    right: -13,
    backgroundColor: Constants.greennew,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Constants.white,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Constants.white,
    fontSize: 10,
    fontFamily: FONTS.Bold,
    lineHeight: 12,
  },
});
