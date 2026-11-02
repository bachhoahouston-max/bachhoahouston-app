import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [welcomeImage, setWelcomeImage] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
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
          {!!announcement.trim() && (
            <Text style={styles.announcementText}>{announcement}</Text>
          )}
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
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 8,
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