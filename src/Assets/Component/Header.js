/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  TextInput,
  PermissionsAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
  DownarrIcon,
  LocationIcon,
  ProfileIcon,
  SearchIcon,
} from '../../../Theme';
import Constants, { FONTS } from '../Helpers/constant';
import { goBack, navigate } from '../../../navigationRef';
import MarqueeText from './MarqueeText';
// import { GetApi } from '../Helpers/Service';
// import { PERMISSIONS, request } from 'react-native-permissions';
// import Geolocation from 'react-native-geolocation-service';
// import GetCurrentAddressByLatLong from './GetCurrentAddressByLatLong';
import { AddressContext, LanguageContext, UserContext } from '../../../App';


const Header = props => {
  const [location, setlocation] = useState(null);
  const [locationadd, setlocationadd] = useContext(AddressContext);
  const [user, setuser] = useContext(UserContext);
  const [language, toggleLanguage] = useContext(LanguageContext);

  const width = Dimensions.get('window').width;

  return (
    <View style={{ backgroundColor: Constants.yellow }}>
      <StatusBar barStyle={Platform.OS === 'android' ? "light-content" : "light-content"} backgroundColor={Constants.greennew} />
      <View style={styles.toppart}>
        <View style={styles.firstrow}>
          <TouchableOpacity
            style={{ flexDirection: 'row' }}
            onPress={() => navigate('Shipping')}>
            <LocationIcon height={25} width={25} color={Constants.white} />
            {user?.address ? (
              <Text style={styles.locationtxt} numberOfLines={1}>
                {user?.ApartmentNo
                  ? `${user?.ApartmentNo}, ${user?.address}`
                  : user?.address}
              </Text>
            ) : (
              <Text style={styles.locationtxt} numberOfLines={1}>
                {locationadd}
              </Text>
            )}
            <DownarrIcon height={15} width={15} style={{ alignSelf: 'center' }} />
          </TouchableOpacity>
          {/* <View style={{ width: width - 50, alignSelf: 'center', backgroundColor: 'transparent' }}>
            <MarqueeText speed={20} text="🔥 This is a scrolling marquee text in React Native 🔥" />
          </View> */}

          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
              <View style={[styles.langOption, language === 'en' && styles.langActive]}>
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
              </View>
              <View style={[styles.langOption, language === 'vi' && styles.langActive]}>
                <Text style={[styles.langText, language === 'vi' && styles.langTextActive]}>VI</Text>
              </View>
            </TouchableOpacity>

            {user?.img ? (
              <TouchableOpacity onPress={() =>
                user.email ? navigate('Account') : navigate('Auth')
              }>
                <Image
                  source={{ uri: `${user.img}` }}
                  style={styles.hi}
                />
              </TouchableOpacity>
            ) : (
              <ProfileIcon
                height={25}
                width={25}
                onPress={() =>
                  user.email ? navigate('Account') : navigate('Auth')
                }
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  toppart: {
    backgroundColor: Constants.greennew,
    paddingTop: 5,
    // paddingBottom: 20,
  },
  firstrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 10,
  },
  locationtxt: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
    marginRight: 5,
    width: '50%',
  },
  hi: {
    height: 28,
    width: 28,
    borderRadius: 15,
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
});
