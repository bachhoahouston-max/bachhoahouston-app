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
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import styles from './styles';
import Constants from '../../Assets/Helpers/constant';
import { navigate, reset } from '../../../navigationRef';
import Spinner from '../../Assets/Component/Spinner';
import { LoadContext, ToastContext } from '../../../App';
import { Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import i18n from '../../../i18n';

const ForgotPassword = props => {
  const { t } = useTranslation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [showPass, setShowPass] = useState(true);
  const [showPass2, setShowPass2] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [value, setValue] = useState('');
  const [selectLanguage, setSelectLanguage] = useState('English');

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

  const sendotp = () => {
    if (email === '') {
      setSubmitted(true);
      return;
    }
    const emailcheck = checkEmail(email.trim());
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })
      return;
    }
    const d = {
      email: email.trim().toLowerCase(),
    };
    setLoading(true);

    Post('sendOTP', d, {}).then(async res => {
      setLoading(false);
      console.log(res);
      setSubmitted(false);
      if (res.status) {
        setToast(res.data.message);
        setShowEmail(false);
        setShowOtp(true);
        setShowPassword(false);
        setToken(res?.data?.token);
        console.log('enter');
      } else {
        setLoading(false);
        setToast(res.message);
      }
    });
  };

  const verifyotp = () => {
    if (value === '') {
      setSubmitted(true);
      return;
    }
    const data = {
      otp: value,
      token,
    };
    console.log('data==========>', data);
    setLoading(true);
    Post('verifyOTP', data, {}).then(
      async res => {
        setLoading(false);
        setSubmitted(false);
        console.log('res =======>', res);
        if (res.status) {
          setToast(res.data.message);
          setValue('');
          setShowEmail(false);
          setShowOtp(false);
          setShowPassword(true);
          setToken(res?.data?.token);
        } else {
          setToast(res.message);
        }
      },
      err => {
        setLoading(false);
        console.log('err =======>', err);
      },
    );
  };

  const submit = () => {
    if (confirmPassword === '' || password === '') {
      setSubmitted(true);
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('Your password does not match with Confirm password'),
      })
      return;
    }

    const data = {
      password,
      token,
    };
    console.log('data==========>', data);
    setLoading(true);
    Post('changePassword', data, {}).then(
      async res => {
        setLoading(false);
        setSubmitted(false);
        console.log(res);
        if (res.status) {
          setToast(res.data.message);
          await AsyncStorage.removeItem('userDetail');
          navigate('SignIn');
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  return (
    <SafeAreaView style={newStyles.container}>
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
        <Text style={newStyles.welcomeText}>
  {t('Forgot')}
</Text>
<Text style={newStyles.welcomeText1}>
  {t('password ?')}
</Text>
            <Text style={newStyles.subtitleText}>
             
             
            </Text>
          </View>
        </ImageBackground>

        {/* Main Content */}
        <View style={newStyles.mainContent}>
          {/* Character Image */}
          <Image
            source={require('../../Assets/Images/girl2.png')}
            style={newStyles.characterImage}
            resizeMode="contain"
          />
          <Text style={{ marginBottom: 12 ,marginTop: 18,textAlign: 'center'}}> {showEmail && t('Enter your email to reset password')}</Text>
<Text style={{ marginBottom: 12 ,marginTop: -22,textAlign: 'center'}}> {showOtp && t('Enter the OTP sent to your email')}</Text>
       
       <Text style={{ marginBottom: 12 ,marginTop: -28,textAlign: 'center'}}>  {showPassword && t('Create a new password')}</Text>
          {/* Email Input */}
          {showEmail && (
            <>
              <View style={newStyles.inputContainer}>
                <TextInput
                  style={newStyles.input}
                  placeholder={t('Enter email')}
                  placeholderTextColor="#4B5563"
                  value={email}
                  onChangeText={e => setEmail(e)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {submitted && email === '' && (
                <Text style={newStyles.errorText}>{t('Email is required')}</Text>
              )}
            </>
          )}

          {/* OTP Input */}
          {showOtp && (
            <>
              <View style={newStyles.inputContainer}>
                <TextInput
                  style={newStyles.input}
                  placeholder={t('Enter OTP')}
                  placeholderTextColor="#4B5563"
                  value={value}
                  maxLength={4}
                  keyboardType="number-pad"
                  onChangeText={e => setValue(e)}
                />
              </View>
              {submitted && value === '' && (
                <Text style={newStyles.errorText}>{t('OTP is required')}</Text>
              )}
            </>
          )}

          {/* Password Inputs */}
          {showPassword && (
            <>
              <View style={newStyles.inputContainer}>
                <View style={newStyles.passwordWrapper}>
                  <TextInput
                    style={[newStyles.input, { paddingRight: 50 }]}
                    placeholder={t('Password')}
                    placeholderTextColor="#4B5563"
                    secureTextEntry={showPass}
                    value={password}
                    onChangeText={password => setPassword(password)}
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
              {submitted && password === '' && (
                <Text style={newStyles.errorText}>{t('Password is required')}</Text>
              )}

              <View style={newStyles.inputContainer}>
                <View style={newStyles.passwordWrapper}>
                  <TextInput
                    style={[newStyles.input, { paddingRight: 50 }]}
                    placeholder={t('Confirm Password')}
                    placeholderTextColor="#4B5563"
                    secureTextEntry={showPass2}
                    value={confirmPassword}
                    onChangeText={confirmPassword =>
                      setConfirmPassword(confirmPassword)
                    }
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass2(!showPass2)}
                    style={newStyles.eyeIcon}>
                    <Image
                      source={
                        showPass2
                          ? require('../../Assets/Images/eye-1.png')
                          : require('../../Assets/Images/eye.png')
                      }
                      style={{ height: 24, width: 24 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {submitted && confirmPassword === '' && (
                <Text style={newStyles.errorText}>
                  {t('Confirm Password is required')}
                </Text>
              )}
            </>
          )}

          {/* Action Buttons */}
          {showEmail && (
            <TouchableOpacity
              style={newStyles.actionButton}
              onPress={() => sendotp()}>
              <Text style={newStyles.actionButtonText}>{t('Next')}</Text>
            </TouchableOpacity>
          )}

          {showOtp && (
            <TouchableOpacity
              style={newStyles.actionButton}
              onPress={() => verifyotp()}>
              <Text style={newStyles.actionButtonText}>{t('Verify OTP')}</Text>
            </TouchableOpacity>
          )}

          {showPassword && (
            <TouchableOpacity
              style={newStyles.actionButton}
              onPress={() => submit()}>
              <Text style={newStyles.actionButtonText}>{t('Submit')}</Text>
            </TouchableOpacity>
          )}

          {/* Back to Login */}
          <View style={newStyles.backToLoginContainer}>
            <Text style={newStyles.backToLoginText}>
              {t('Remember your password? ')}
            </Text>
            <TouchableOpacity onPress={() => navigate('SignIn')}>
              <Text style={newStyles.backToLoginLink}>{t('Sign In')}</Text>
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
  fontSize: 54,
  fontWeight: 'bold',
  color: '#FFFFFF',
  marginBottom: 5,  
  lineHeight: 60,   
},
welcomeText1: {
  fontSize: 54,
  fontWeight: 'bold',
  color: '#FFFFFF',
  marginBottom: 25,  
  lineHeight: 60,   
},
  subtitleText: {
    fontSize: 14,
    color: '#FFFFFF',
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
    marginBottom: -15,
  },
  inputContainer: {
    marginBottom: 20,
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
  actionButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
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

export default ForgotPassword;