import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';

const defaultWelcomeImage = require('../../Assets/Images/welcome.png');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { height } = useWindowDimensions();
  const [setting, setSetting] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [language, setLanguage] = useState(
    i18n.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en',
  );

  useEffect(() => {
    const syncLanguage = nextLanguage => {
      setLanguage(nextLanguage?.toLowerCase().startsWith('vi') ? 'vi' : 'en');
    };

    syncLanguage(i18n.language);
    i18n.on('languageChanged', syncLanguage);
    return () => i18n.off('languageChanged', syncLanguage);
  }, [i18n]);

  useEffect(() => {
    let isMounted = true;

    GetApi('getsetting', {})
      .then(res => {
        const appSetting = res?.setting?.[0];
        if (isMounted && res?.success && appSetting) {
          setSetting(appSetting);
        }
      })
      .catch(error => {
        console.log('Unable to load welcome settings', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const changeLanguage = async nextLanguage => {
    try {
      await AsyncStorage.setItem('LANG', nextLanguage);
      await i18n.changeLanguage(nextLanguage);
    } catch (error) {
      console.log('Unable to save welcome screen language', error);
    }
  };

  const remoteImage = typeof setting?.welcomeImage === 'string'
    ? setting.welcomeImage.trim()
    : '';
  const imageSource = remoteImage && !imageFailed
    ? { uri: remoteImage }
    : defaultWelcomeImage;
  const announcement = language === 'vi'
    ? setting?.announcementVi
    : setting?.announcementEn;

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, height < 700 && styles.compactTopSection]}>
        <Image
          source={imageSource}
          style={styles.welcomeImage}
          resizeMode="contain"
          onError={() => setImageFailed(true)}
          accessibilityLabel={t('Welcome')}
        />
        <Image
          source={require('../../Assets/Images/newlogo.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="Bach Hoa Houston"
        />
      </View>

      <View style={[styles.bottomSection, height < 700 && styles.compactBottomSection]}>
        <View style={styles.content}>
          <View style={styles.languageSwitcher} accessibilityRole="radiogroup">
            {['en', 'vi'].map(code => {
              const isSelected = language === code;
              return (
                <TouchableOpacity
                  key={code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={code === 'en' ? 'English' : 'Tiếng Việt'}
                  style={[styles.languageButton, isSelected && styles.activeLanguageButton]}
                  onPress={() => changeLanguage(code)}>
                  <Text style={[styles.languageButtonText, isSelected && styles.activeLanguageButtonText]}>
                    {code.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.welcomeText}>{t('Welcome')}</Text>
          {!!announcement?.trim?.() && (
            <Text style={styles.announcementText}>{announcement.trim()}</Text>
          )}
          <Text style={styles.subtitleText}>{t('Vietnamese Grocery Delivery Service')}</Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Auth')}>
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
    flex: 0.58,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  compactTopSection: {
    flex: 0.52,
  },
  welcomeImage: {
    width: '100%',
    height: '74%',
  },
  logoImage: {
    width: 190,
    height: 92,
    marginTop: 2,
  },
  bottomSection: {
    flex: 0.42,
    minHeight: 0,
    backgroundColor: '#206B3A',
  },
  compactBottomSection: {
    flex: 0.48,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  announcementText: {
    maxHeight: 76,
    fontSize: 15,
    lineHeight: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 7,
  },
  linkButton: {
    marginTop: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  skipText: {
    fontSize: 15,
    color: 'white',
    fontStyle: 'italic',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  languageSwitcher: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginHorizontal: 4,
  },
  activeLanguageButton: {
    backgroundColor: '#FFFFFF',
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeLanguageButtonText: {
    color: '#206B3A',
  },
});
