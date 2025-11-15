import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import styles from './styles';
import Constants from '../../Assets/Helpers/constant';
import { navigate, reset } from '../../../navigationRef';
import Spinner from '../../Assets/Component/Spinner';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import { Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { CrossIcon, Downarrow, RadiooffIcon, RadioonIcon } from '../../../Theme';
import ActionSheet from 'react-native-actions-sheet';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import Toast from 'react-native-toast-message';

const SignIn = props => {
  const [showPass, setShowPass] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [title, settile] = useState('');
  const [userDetail, setUserDetail] = useState({
    password: '',
    username: '',
  });
  const [selectLanguage, setSelectLanguage] = useState('English');
  const { t } = useTranslation();
  const langRef = createRef();

  useEffect(() => {
    checkLng();
    checkAuthDetails();
  }, []);

  const checkAuthDetails = async () => {
    const authDetails = await AsyncStorage.getItem('authDetails');
    if (authDetails != null) {
      let details = JSON.parse(authDetails);
      setUserDetail({
        ...userDetail,
        username: details.username,
        password: details.password,
      });
    }
  }
  const checkLng = async () => {
    const x = await AsyncStorage.getItem('LANG');
    if (x != null) {
      let lng =
        x == 'en'
          ? 'English'
          : 'Vietnames';
      setSelectLanguage(lng);
    }
  };

  const submit = async () => {
    if (userDetail.username.trim() === '' || userDetail.password === '') {
      setSubmitted(true);
      return;
    }
    const emailcheck = checkEmail(userDetail.username.toLowerCase().trim());
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })
      return;
    }

    let data = {
      username: userDetail.username.toLowerCase().trim(),
      password: userDetail.password,
    };

    console.log('data==========>', userDetail);
    setLoading(true);
    console.log('data2==========>', userDetail);
    Post('login', data, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);
        setSubmitted(false);
        if (res.status) {
          setUserDetail({
            password: '',
            username: '',
          });
          setLoading(false);
          await AsyncStorage.setItem('userDetail', JSON.stringify(res.data));
          await AsyncStorage.setItem('authDetails', JSON.stringify(data));
          setuser(res.data);
          if (res.data.type === 'SELLER') {
            setLoading(false);
            if (res.data.status === 'Verified') {
              reset('Vendortab');
            } else {
              reset('VendorForm');
            }
          } else if (res.data.type === 'DRIVER') {
            setLoading(false);
            if (res.data.status === 'Verified') {
              reset('Drivertab');
            } else if (res.data.status === 'Suspended') {
              Toast.show({
                type: 'error',
                text1: t('Your driver account is suspended. Please contact support.'),
              })
            } else {
              Toast.show({
                type: 'error',
                text1: t('Your driver account is not verified yet. Please contact support.'),
              })
              reset('Driverform');
            }
          } else if (res.data.type === 'ADMIN') {
            setLoading(false);
            reset('Employeetab');
          } else {
            setLoading(false);
            reset('App');
          }
        } else {
          setLoading(false);
          console.log('error------>', res);
          if (res.message !== undefined) {
            Toast.show({
              type: 'error',
              text1: res.message,
            })
          }
        }
      },
      err => {
        setLoading(false);
        console.log(err);
        setSubmitted(false);
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={newStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={newStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[newStyles.scrollContent, { overflow: 'visible' }]}>

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

          {/* Welcome Text on Header */}
          <View style={newStyles.headerTextContainer}>
            <Text style={newStyles.welcomeText}>{t('Welcome!')}</Text>
            <Text style={newStyles.subtitleText}>
              {t('Please enter your details to Sign In')}
            </Text>
          </View>
        </ImageBackground>

        {/* Main Content */}
        <View style={newStyles.mainContent}>
          {/* Character Image */}
          <Image
            source={require('../../Assets/Images/girl1.png')}
            style={newStyles.characterImage}
            resizeMode="contain"
          />

          {/* Email Input */}
          <View style={newStyles.inputContainer}>
            {/* <Text style={newStyles.inputLabel}>{t('Enter Email')}</Text> */}
            <TextInput
              style={newStyles.input}
              placeholder={t('Enter email')}
              placeholderTextColor="#999"
              value={userDetail.username}
              onChangeText={username => setUserDetail({ ...userDetail, username })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {submitted && userDetail.username === '' && (
            <Text style={newStyles.errorText}>{t('Email is required')}</Text>
          )}

          {/* Password Input */}
          <View style={newStyles.inputContainer}>
            {/* <Text style={newStyles.inputLabel}>{t('Password')}</Text> */}
            <View style={newStyles.passwordWrapper}>
              <TextInput
                style={[newStyles.input, { paddingRight: 50 }]}
                placeholder={t('Password')}
                placeholderTextColor="#999"
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

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => navigate('ForgotPassword')}>
            <Text style={newStyles.forgotPassword}>{t('Forgot Password ?')}</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity style={newStyles.signInButton} onPress={() => submit()}>
            <Text style={newStyles.signInButtonText}>{t('Sign In')}</Text>
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity onPress={() => navigate('App')}>
            <Text style={newStyles.skipText}>{t('Skip')}</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={newStyles.signUpContainer}>
            <Text style={newStyles.signUpText}>
              {t('Do not have an Account ? ')}
            </Text>
            <TouchableOpacity onPress={() => navigate('SignUp')}>
              <Text style={newStyles.signUpLink}>{t('Sign Up')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Selection ActionSheet - Keep for backward compatibility */}
        <ActionSheet
          ref={langRef}
          closeOnTouchBackdrop={true}
          containerStyle={{ backgroundColor: 'white' }}>
          <View style={[styles.modal, { backgroundColor: Constants.white }]}>
            <View style={styles.headcov}>
              <Text style={[styles.heading, { color: Constants.black }]}>
                Select Language
              </Text>
              <CrossIcon
                height={13}
                width={13}
                style={{ alignSelf: 'center' }}
                color={Constants.black}
                onPress={() => langRef.current.hide()}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.item,
                {
                  borderColor:
                    selectLanguage === 'English'
                      ? Constants.saffron
                      : Constants.black,
                },
              ]}
              onPress={async () => {
                await AsyncStorage.setItem('LANG', 'en');
                i18n.changeLanguage('en');
                setSelectLanguage('English');
                langRef.current.hide();
              }}>
              {selectLanguage == 'English' ? (
                <RadioonIcon color={Constants.saffron} height={25} width={25} />
              ) : (
                <RadiooffIcon
                  color={Constants.saffron}
                  height={25}
                  width={25}
                />
              )}
              <Text style={[styles.itemTxt, { color: Constants.black }]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.item,
                {
                  borderColor:
                    selectLanguage === 'Vietnames'
                      ? Constants.saffron
                      : Constants.black,
                },
              ]}
              onPress={async () => {
                await AsyncStorage.setItem('LANG', 'vi');
                i18n.changeLanguage('vi');
                setSelectLanguage('Vietnames');
                langRef.current.hide();
              }}>
              {selectLanguage == 'Vietnames' ? (
                <RadioonIcon color={Constants.saffron} height={25} width={25} />
              ) : (
                <RadiooffIcon
                  color={Constants.saffron}
                  height={25}
                  width={25}
                />
              )}
              <Text style={[styles.itemTxt, { color: Constants.black }]}>
                Vietnamese
              </Text>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const newStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    overflow: 'visible',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    overflow: 'visible',
  },
  headerBackground: {
    width: '100%',
    height: 230,
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
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#E8F5E9',

    paddingHorizontal: 20,
    paddingTop: 80,
    zIndex: 5,
    marginTop: 10,
  },
  characterImage: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginTop: -60,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
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
  forgotPassword: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    alignSelf: 'flex-start',
    marginBottom: 30,
    marginLeft: 5,
  },
  signInButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipText: {
    fontSize: 15,
    color: '#666',
    alignSelf: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  signUpContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 30,
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignIn;