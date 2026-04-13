/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import Constants, {FONTS} from '../Helpers/constant';
import {goBack, navigate, reset} from '../../../navigationRef';
import {GetApi} from '../Helpers/Service';
import {CartContext, LanguageContext, UserContext} from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BackIcon, CartFilledIcon} from '../../../Theme';
import {useNavigation} from '@react-navigation/native';

const DriverHeader = props => {
  const [loading, setLoading] = useState(false);
  const [user, setuser] = useContext(UserContext);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [language, toggleLanguage] = useContext(LanguageContext);
  const [userDetail, setUserDetail] = useState({
    email: '',
    username: '',
    number: '',
    img: '',
  });
  const navigation = useNavigation();

  return (
    <View style={styles.toppart}>
      {/* <StatusBar barStyle={Platform.OS === 'android' ? 'dark-content' : 'dark-light'} backgroundColor={Constants.saffron} /> */}
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          height: '100%',
          alignItems: 'center',
        }}>
        {props.showback ? (
          <TouchableOpacity
            onPress={() => goBack()}
            style={{width: 20, height: 20, marginRight: 10}}>
            <BackIcon color={Constants.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() =>
              user.type === 'DRIVER'
                ? navigate('DriverAccount')
                : user.type === 'SELLER'
                ? navigate('VendorAccount')
                : user.type === 'USER'
                ? navigate('Account')
                : navigate('Auth')
            }>
            <Image
              // source={require('../Images/profile.png')}
              source={
                user?.img
                  ? {
                      uri: `${user.img}`,
                    }
                  : require('../../Assets/Images/profile2.png')
              }
              style={styles.hi}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.backtxt}>{props?.item}</Text>
      </View>
      <View style={styles.rightSection}>
        {props?.showEmptyCart && (
          <TouchableOpacity onPress={props.onEmptyCart} style={styles.emptyCartBtn}>
            <Text style={styles.emptyCartTxt}>Empty Cart</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
          <View style={[styles.langOption, language === 'en' && styles.langActive]}>
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          </View>
          <View style={[styles.langOption, language === 'vi' && styles.langActive]}>
            <Text style={[styles.langText, language === 'vi' && styles.langTextActive]}>VI</Text>
          </View>
        </TouchableOpacity>

        {props?.showCart && (
          <Pressable
            onPress={() =>
              navigation.navigate('App', {
                screen: 'Cart',
              })
            }>
            <CartFilledIcon
              height={28}
              width={28}
              style={{alignSelf: 'center'}}
            />
            {cartdetail && cartdetail.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartdetail.length > 99 ? '99+' : cartdetail.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default DriverHeader;

const styles = StyleSheet.create({
  backtxt: {
    color: Constants.white,
    fontWeight: '600',
    fontSize: 20,
    fontFamily: FONTS.dmsansedium,
  },
  toppart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Constants.greennew,
  },
  hi: {
    marginRight: 10,
    height: 25,
    width: 25,
    borderRadius: 15,
  },
  aliself: {
    alignSelf: 'center',
    // fontWeight:'bold'
    // fontFamily:FONTS.Bold
  },
  emptyCartBtn: {
    backgroundColor: Constants.pink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Constants.white,
  },
  emptyCartTxt: {
    color: Constants.white,
    fontSize: 13,
    fontFamily: FONTS.Bold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 3,
  },
  langOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  langActive: {
    backgroundColor: '#F28321',
  },
  langText: {
    fontSize: 13,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
  langTextActive: {
    color: Constants.white,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Constants.green,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
