import React, {useCallback, useContext, useRef} from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigationState, useIsFocused} from '@react-navigation/native';
import {ClipboardList, History as HistoryIcon, Package} from 'lucide-react-native';
import Constants, {FONTS} from '../Assets/Helpers/constant';
import {useTranslation} from 'react-i18next';
import Orders from '../screen/Employee/Order';
import History from '../screen/Employee/History';
import Products from '../screen/Employee/Products';

const Tab = createBottomTabNavigator();

export const Employeetab = () => {
  const {t} = useTranslation();
  const TabArr = [
    {
      icon: ClipboardList,
      component: Orders,
      routeName: 'Orders',
      name: 'Orders',
    },
    {
      icon: HistoryIcon,
      component: History,
      routeName: 'History',
      name: 'History',
    },
    {
      icon: Package,
      component: Products,
      routeName: 'Products',
      name: 'Products',
    },
  ];

  const TabButton = ({onPress, onclick, item, index}) => {
    const isFocused = useIsFocused();
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
          backgroundColor: Constants.greennew,
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          borderTopWidth: 0,
          paddingTop: 12,
        },
        tabBarItemStyle: {
          // Removed custom padding to use default styling
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
    color: Constants.white,
    fontFamily: FONTS.Medium,
    fontSize: 11,
    marginTop: 2,
  },
});
