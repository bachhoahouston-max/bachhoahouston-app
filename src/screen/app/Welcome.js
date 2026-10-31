import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [welcomeImage, setWelcomeImage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [language, setLanguage] = useState(i18n.language?.startsWith('vi') ? 'vi' : 'en');

  useEffect(() => {
    GetApi('getsetting', {})
      .then(res => {
        const setting = res?.setting?.[0];
        if (setting) {
          setWelcomeImage(setting.welcomeImage || '');
          setAnnouncement(
            (i18n.language?.startsWith('vi')
              ? setting.announcementVi
              : setting.announcementEn) || '',
          );
        }
      })
      .catch(error => {
        console.log('Unable to load welcome settings', error);
      });
  }, [i18n.language]);

  const changeLanguage = async nextLanguage => {
    await AsyncStorage.setItem('LANG', nextLanguage);
    await i18n.changeLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };

  const imageSource = welcomeImage ? { uri: welcomeImage } : require('../../Assets/Images/welcome.png');

  const handleAuthPress = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      {/* Top Section with Light Green Background */}
      <View style={styles.topSection}>
        <Image
          source={imageSource}
          style={styles.basketImage}
          resizeMode="contain"
        />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../Assets/Images/newlogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom Section with Dark Green Background */}
      <View style={styles.bottomSection}>
        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          <View style={styles.languageSwitcher}>
            {['en', 'vi'].map(code => (
              <TouchableOpacity
                key={code}
                style={[styles.languageButton, language === code && styles.activeLanguageButton]}
                onPress={() => changeLanguage(code)}>
                <Text style={styles.languageButtonText}>{code.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.welcomeText}>{t('Welcome')}</Text>
          {!!announcement && <Text style={styles.announcementText}>{announcement}</Text>}
          <Text style={styles.subtitleText}>{t('Vietnamese Grocery Delivery Service')}</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleAuthPress}
          >
            <Text style={styles.linkText}>{t('Click here to Sign In/Sign Up')}</Text>

          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigate('App')}>
            <Text style={styles.skipText}>{t('Skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  topSection: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  basketImage: {
    width: width,
    height: 300,
    marginTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 130,
  },
  logoImage: {
    width: 250,
    height: 180,
  },
  bottomSection: {
    width: width,
    height: 320,
    position: 'relative',
  },
  contentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  announcementText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 40,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  skipText: {
    fontSize: 15,
    color: 'white',
    alignSelf: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  languageSwitcher: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 4,
  },
  activeLanguageButton: {
    backgroundColor: '#FFFFFF',
  },
  languageButtonText: {
    color: '#206B3A',
    fontSize: 12,
    fontWeight: 'bold',
  },
});