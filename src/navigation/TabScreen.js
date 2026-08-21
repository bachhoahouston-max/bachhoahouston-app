import React, { useCallback, useContext, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationState, useIsFocused } from '@react-navigation/native';
import { Home, LayoutDashboard, BringToFront, ShoppingCart } from 'lucide-react-native';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import HomeScreen from '../screen/app/Home';
import Categories from '../screen/app/Categories';
import Referal from '../screen/app/Referal';
import Cart from '../screen/app/Cart';
import { useTranslation } from 'react-i18next';
import Myorder from '../screen/app/Myorder';
import Products from '../screen/app/Products';
import Payment from '../screen/app/Payment';
import { createStackNavigator } from '@react-navigation/stack';
import { CartContext } from '../../App';

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

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

  const TabButton = ({ onPress, onclick, item, index }) => {
    const isFocused = useIsFocused();
    const isCartTab = item.routeName === 'Cart';
    const cartCount = cartdetail?.reduce((sum, obj) => sum + (obj?.qty ?? 0), 0) || 0;

    const IconComponent = item.icon;

    return (
      <View style={styles.tabBtnView}>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={onclick ? onclick : onPress}
            activeOpacity={0.7}
            style={[
              styles.tabBtn,
              isFocused && styles.tabBtnActive,
            ]}>
            <IconComponent
              color={isFocused ? '#2E7D32' : Constants.customgrey3}
              size={22}
              strokeWidth={isFocused ? 2.5 : 2}
            />
          </TouchableOpacity>
          {isCartTab && cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabtxt,
            { color: isFocused ? Constants.white : Constants.customgrey3 },
          ]}>
          {t(item.name)}
        </Text>
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          width: '100%',
          minHeight: Platform?.OS === 'android' ? 75 : 75,
          backgroundColor: '#2E7D32',
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          borderTopWidth: 0,
          paddingTop: 12,
        },
      }}>
      {TabArr.map((item, index) => {
        return (
          <Tab.Screen
            key={index}
            name={item.routeName}
            component={item.component}
            options={{
              tabBarShowLabel: false,
              tabBarButton: props => (
                <TabButton {...props} item={item} index={index} />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBtnView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  iconContainer: {
    position: 'relative',
  },
  tabBtn: {
    height: 42,
    width: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabtxt: {
    color: Constants.black,
    fontFamily: FONTS.Medium,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Constants.green,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});