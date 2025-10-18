import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Linking,
  ImageBackground,
  Platform,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import styles from './styles';
import Constants from '../../Assets/Helpers/constant';
import { navigate, reset } from '../../../navigationRef';
import Spinner from '../../Assets/Component/Spinner';
import { ToastContext } from '../../../App';
import { Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { useTranslation } from 'react-i18next';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import Toast from 'react-native-toast-message';
import i18n from '../../../i18n';

const SignUp = props => {
  const { t } = useTranslation();
  const [showPass, setShowPass] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [title, settile] = useState('');
  const [user, setuser] = useState(0);
  const [selectLanguage, setSelectLanguage] = useState('English');
  const [userDetail, setUserDetail] = useState({
    password: '',
    number: '',
    email: '',
    username: '',
    type: 'USER'
  });

  useEffect(() => {
    checkLng();
  }, []);

  const checkLng = async () => {
    const x = await AsyncStorage.getItem('LANG');
    if (x != null) {
      let lng = x == 'en' ? 'English' : 'Vietnames';
      setSelectLanguage(lng);
    }
  };

  const submit = async () => {
    if (
      userDetail.number === '' ||
      userDetail.password === '' ||
      userDetail.email.trim === '' ||
      userDetail.username === ''
    ) {
      setSubmitted(true);
      return;
    }
    const emailcheck = checkEmail(userDetail.email.trim());
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })
      return;
    }
    if (userDetail?.password?.trim().length < 6) {
      Toast.show({
        type: 'error',
        text1: t('Password must be at least 6 characters.'),
      })
      return;
    }
    userDetail.email = userDetail.email.trim().toLowerCase();
    console.log('data==========>', userDetail);
    setLoading(true);
    Post('signUp', userDetail, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);
        setSubmitted(false);
        if (res.success) {
          setUserDetail({
            password: '',
            number: '',
            email: '',
            username: '',
          });
          setToast(res.message);
          navigate('SignIn')

        } else {
          setLoading(false);
          setToast(res.message);
          console.log('error------>', res);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
        setSubmitted(false);
      },
    );
  };

  const privacy = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open('https://www.bachhoahouston.com/PrivacyPolicy', {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.saffron,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        Linking.openURL('https://www.bachhoahouston.com/PrivacyPolicy');
      }
    } catch (error) {
      console.error(error);
    }
  }

  const term = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open('https://www.bachhoahouston.com/Termsandcondition', {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.saffron,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        Linking.openURL('https://www.bachhoahouston.com/PrivacyPolicy');
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <SafeAreaView style={newStyles.container}>
      <Spinner color={'#fff'} visible={loading} />
      <ScrollView
        style={newStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={newStyles.scrollContent}>
        
        {/* Header with Background Image */}
        <ImageBackground
          source={require('../../Assets/Images/ron.png')}
          style={newStyles.headerBackground}
          resizeMode="cover">
          
          {/* Language Switcher */}
          <View style={newStyles.languageSwitcher}>
            <TouchableOpacity
              style={[
                newStyles.langButton,
                selectLanguage === 'English' && newStyles.langButtonActive
              ]}
              onPress={async () => {
                await AsyncStorage.setItem('LANG', 'en');
                i18n.changeLanguage('en');
                setSelectLanguage('English');
              }}>
              <Text style={[
                newStyles.langButtonText,
                selectLanguage === 'English' && newStyles.langButtonTextActive
              ]}>
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                newStyles.langButton,
                selectLanguage === 'Vietnames' && newStyles.langButtonActive
              ]}
              onPress={async () => {
                await AsyncStorage.setItem('LANG', 'vi');
                i18n.changeLanguage('vi');
                setSelectLanguage('Vietnames');
              }}>
              <Text style={[
                newStyles.langButtonText,
                selectLanguage === 'Vietnames' && newStyles.langButtonTextActive
              ]}>
                VI
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header Text */}
          <View style={newStyles.headerTextContainer}>
            <Text style={newStyles.welcomeText}>{t('WELCOME')}</Text>
            <Text style={newStyles.subtitleText}>
              {t('Please enter your Sign up details')}
            </Text>
          </View>
        </ImageBackground>

        {/* Main Content */}
        <View style={newStyles.mainContent}>
          {/* Character Image */}
          {/* <Image
            source={require('../../Assets/Images/girl2.png')}
            style={newStyles.characterImage}
            resizeMode="contain"
          /> */}

          {/* User Type Selection */}
          <View style={newStyles.userTypeContainer}>
            <TouchableOpacity
              style={[
                newStyles.userTypeButton,
                user === 0 && newStyles.userTypeButtonActive
              ]}
              onPress={() => {
                setuser(0);
                userDetail.type = 'USER';
              }}>
              <Text style={[
                newStyles.userTypeText,
                user === 0 && newStyles.userTypeTextActive
              ]}>
                {t('User')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                newStyles.userTypeButton,
                user === 2 && newStyles.userTypeButtonActive
              ]}
              onPress={() => {
                setuser(2);
                userDetail.type = 'DRIVER';
              }}>
              <Text style={[
                newStyles.userTypeText,
                user === 2 && newStyles.userTypeTextActive
              ]}>
                {t('Driver')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={newStyles.inputContainer}>
            <TextInput
              style={newStyles.input}
              placeholder={t('Enter Name')}
              placeholderTextColor="#4B5563"
              value={userDetail.username}
              onChangeText={username => setUserDetail({ ...userDetail, username })}
            />
          </View>
          {submitted && userDetail.username === '' && (
            <Text style={newStyles.errorText}>{t('Name is required')}</Text>
          )}

          {/* Email Input */}
          <View style={newStyles.inputContainer}>
            <TextInput
              style={newStyles.input}
              placeholder={t('Enter Email')}
              placeholderTextColor="#4B5563"
              value={userDetail.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={email => setUserDetail({ ...userDetail, email })}
            />
          </View>
          {submitted && userDetail.email === '' && (
            <Text style={newStyles.errorText}>{t('Email is required')}</Text>
          )}

          {/* Phone Number Input */}
          <View style={newStyles.inputContainer}>
            <TextInput
              style={newStyles.input}
              placeholder={t('Phone Number')}
              placeholderTextColor="#4B5563"
              keyboardType="number-pad"
              value={userDetail.number}
              onChangeText={number => setUserDetail({ ...userDetail, number })}
            />
          </View>
          {submitted && userDetail.number === '' && (
            <Text style={newStyles.errorText}>{t('Number is required')}</Text>
          )}

          {/* Password Input */}
          <View style={newStyles.inputContainer}>
            <View style={newStyles.passwordWrapper}>
              <TextInput
                style={[newStyles.input, { paddingRight: 50 }]}
                placeholder={t('Password')}
                placeholderTextColor="#4B5563"
                secureTextEntry={showPass}
                value={userDetail.password}
                onChangeText={password => setUserDetail({ ...userDetail, password })}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={newStyles.eyeIcon}>
                <Image
                  source={
                    showPass
                      ? require('../../Assets/Images/eye-1.png')
                      : require('../../Assets/Images/eye.png')
                  }
                  style={{ height: 24, width: 24 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
          {submitted && userDetail.password === '' && (
            <Text style={newStyles.errorText}>{t('Password is required')}</Text>
          )}

          {/* Referral Code (only for User type) */}
          {user === 0 && (
            <View style={newStyles.inputContainer}>
              <TextInput
                style={newStyles.input}
                placeholder={t('Referral Code (optional)')}
                placeholderTextColor="#4B5563"
                value={userDetail.referal}
                onChangeText={referal => setUserDetail({ ...userDetail, referal })}
              />
            </View>
          )}

          {/* Terms and Privacy */}
          <View style={newStyles.termsContainer}>
            <Text style={newStyles.termsText}>
              {t('By clicking Sign up, you agree with our')}
            </Text>
            <View style={newStyles.termsLinks}>
              <TouchableOpacity onPress={() => term()}>
                <Text style={newStyles.termsLink}>
                  {t('Terms and Condition')}
                </Text>
              </TouchableOpacity>
              <Text style={newStyles.termsText}> {t('and')} </Text>
              <TouchableOpacity onPress={() => privacy()}>
                <Text style={newStyles.termsLink}>
                  {t('Privacy Policy')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={newStyles.actionButton}
            onPress={() => submit()}>
            <Text style={newStyles.actionButtonText}>{t('Sign Up')}</Text>
          </TouchableOpacity>

          {/* Back to Sign In */}
          <View style={newStyles.backToLoginContainer}>
            <Text style={newStyles.backToLoginText}>
              {t('Already have any account ?')}
            </Text>
            <TouchableOpacity onPress={() => navigate('SignIn')}>
              <Text style={newStyles.backToLoginLink}> {t('Sign in')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const newStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    width: '100%',
    height: 220,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 10,
    position: 'relative',
  },
  languageSwitcher: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 3,
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
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  welcomeText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  subtitleText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginTop: 0,
  },
  characterImage: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginTop: -40,
    marginBottom: 10,
  },
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 25,
    
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderColor:'#2E7D32',
    borderWidth:1,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 22,
  },
  userTypeButtonActive: {
    backgroundColor: '#2E7D32',
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  userTypeTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 15,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 10,
  },
  termsContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  termsLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  termsLink: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 30,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#666',
  },
  backToLoginLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignUp;