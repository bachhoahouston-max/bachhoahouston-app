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
  const [selectLanguage, setSelectLanguage] = useState(
    i18n.language?.toLowerCase().startsWith('vi') ? 'Vietnames' : 'English',
  );

  useEffect(() => {
    AsyncStorage.getItem('LANG').then(language => {
      if (language === 'en' || language === 'vi') {
        const selectedLanguage = language === 'vi' ? 'Vietnames' : 'English';
        setSelectLanguage(selectedLanguage);
        i18n.changeLanguage(language);
      }
    });
  }, [i18n]);

  useEffect(() => {
    setSelectLanguage(
      i18n.language?.toLowerCase().startsWith('vi') ? 'Vietnames' : 'English',
    );
    GetApi('getsetting', {})
      .then(res => {
        const setting = res?.setting?.[0];
        if (!setting) {
          return;
        }

        setWelcomeImage(
          typeof setting.welcomeImage === 'string'
            ? setting.welcomeImage.trim()
            : '',
        );
        const selectedAnnouncement = i18n.language?.toLowerCase().startsWith('vi')
          ? setting.announcementVi
          : setting.announcementEn;
        setAnnouncement(
          typeof selectedAnnouncement === 'string'
            ? selectedAnnouncement.trim()
            : '',
        );
      })
      .catch(error => {
        console.log('Unable to load welcome settings', error);
      });
  }, [i18n.language]);

  const handleAuthPress = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      {/* Top Section with Light Green Background */}
      <View style={styles.topSection}>
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            style={[
              styles.langButton,
              selectLanguage === 'English' && styles.langButtonActive,
            ]}
            onPress={async () => {
              await AsyncStorage.setItem('LANG', 'en');
              i18n.changeLanguage('en');
              setSelectLanguage('English');
            }}>
            <Text
              style={[
                styles.langButtonText,
                selectLanguage === 'English' && styles.langButtonTextActive,
              ]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langButton,
              selectLanguage === 'Vietnames' && styles.langButtonActive,
            ]}
            onPress={async () => {
              await AsyncStorage.setItem('LANG', 'vi');
              i18n.changeLanguage('vi');
              setSelectLanguage('Vietnames');
            }}>
            <Text
              style={[
                styles.langButtonText,
                selectLanguage === 'Vietnames' && styles.langButtonTextActive,
              ]}>
              VI
            </Text>
          </TouchableOpacity>
        </View>
        <Image
          source={
            welcomeImage
              ? null
              : require('../../Assets/Images/welcome.png')
          }
          style={styles.basketImage}
          resizeMode="contain"
        />

        <View style={styles.logoContainer}>
          <Image
            // source={require('../../Assets/Images/newlogo.png')}
            source={
              welcomeImage
                ? { uri: welcomeImage }
                : require('../../Assets/Images/newlogo.png')
            }
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {!!announcement.trim() && (
          <Text style={styles.announcementText}>
            {announcement}
          </Text>
        )}
      </View>

      {/* Bottom Section with Dark Green Background */}
      <View style={styles.bottomSection}>
        {/* Background Image */}
        <Image
          source={require('../../Assets/Images/new.png')}
          style={styles.backgroundImage}
          resizeMode="stretch"
        />

        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.subtitleText}>Vietnamese Grocery Delivery Service</Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleAuthPress}
          >
            <Text style={styles.linkText}>Click here to Sign In/Sign Up</Text>

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
  languageSwitcher: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 3,
    zIndex: 1,
  },
  langButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 18,
  },
  langButtonActive: {
    backgroundColor: '#DCE775',
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  basketImage: {
    width: 300,
    height: 300,
    position: 'absolute',
    left: -10,
    top: 80,
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
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: 360,
    top: 0,
    left: 0,
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
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 40,
  },
  announcementText: {
    position: 'absolute',
    bottom: 6,
    width: width - 40,
    fontSize: 16,
    color: '#000',
    opacity: 0.9,
    textAlign: 'center',
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
});