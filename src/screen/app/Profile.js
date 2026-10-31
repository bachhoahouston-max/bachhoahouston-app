import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { BackIcon, EditIcon } from '../../../Theme';
import Spinner from '../../Assets/Component/Spinner';
import { ApiFormData, GetApi, Post, Put } from '../../Assets/Helpers/Service';
import { Dropdown } from 'react-native-element-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ExternalLink, Plus, X } from 'lucide-react-native';
import { SOCIAL_PLATFORMS, displayLink, getPlatform, openUrl } from '../affiliation/utils';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import Header from '../../Assets/Component/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goBack } from '../../../navigationRef';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const Profile = props => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  // const [loading, setLoading] = useState(false);
  const [user, setuser] = useContext(UserContext);
  const [otpfield, setotpfield] = useState(false);
  const [edit, setEdit] = useState(false);
  const [otpval, setotpval] = useState({
    otp: '',
  });
  const [userDetail, setUserDetail] = useState({
    email: '',
    username: '',
    number: '',
    img: '',
  });
  // Affiliates only: social accounts from their affiliation application.
  // null = not an affiliate (or no application), so the section stays hidden.
  const [socialLinks, setSocialLinks] = useState(null);
  useEffect(() => {
    getProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (user?.isAffiliate) {
      getSocialLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAffiliate]);

  const getSocialLinks = () => {
    GetApi('affiliation/applications/me', {}).then(
      res => {
        if (res?.status && res.data) {
          setSocialLinks(
            (res.data.socialLinks || []).map(link => ({
              platform: link.platform || 'website',
              url: link.url || '',
            })),
          );
        }
      },
      err => console.log(err),
    );
  };

  const updateLink = (index, changes) =>
    setSocialLinks(links => links.map((link, i) => (i === index ? { ...link, ...changes } : link)));

  const addLink = () => {
    const used = socialLinks.map(link => link.platform);
    const next = SOCIAL_PLATFORMS.find(p => !used.includes(p.value)) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
    setSocialLinks(links => [...links, { platform: next.value, url: '' }]);
  };

  const removeLink = index => setSocialLinks(links => links.filter((_, i) => i !== index));

  // Returns false when the links could not be saved, so the profile update stops.
  const saveSocialLinks = async () => {
    if (!socialLinks) {
      return true;
    }
    const filledLinks = socialLinks
      .map(link => ({ platform: link.platform, url: link.url.trim() }))
      .filter(link => link.url);
    if (!filledLinks.length) {
      Toast.show({
        type: 'error',
        text1: t('Add at least one social media or website link.'),
      });
      return false;
    }
    const res = await Put('affiliation/applications/me/social-links', { socialLinks: filledLinks }, { ...props });
    if (!res?.status) {
      Toast.show({ type: 'error', text1: res?.message || t('Please try again.') });
      return false;
    }
    setSocialLinks(filledLinks);
    return true;
  };
  const cameraRef = createRef();
  const getImageValue = async img => {
    console.log(img)
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setEdit(true);
          setUserDetail({
            ...userDetail,
            img: res.data.file,
          });
        }
      },
      err => {
        setEdit(false);
        console.log(err);
      },
    );
  };
  console.log('img', userDetail.img);
  const cancel = () => {
    setEdit(false);
    cameraRef.current?.hide()

  };
  const getProfile = () => {
    setLoading(true);
    GetApi(`getProfile`, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          // setprofile(res?.data || {});
          // await AsyncStorage.setItem('profilePic', res?.data?.profile || '');
          // setImage(res?.data?.profile || '');

          setUserDetail({
            email: res.data.email,
            username: res.data.username,
            number: res.data.number,
            img: res.data.profile,
          });
          setuser({ ...user, ...res.data });
          // setVerified(res.data.verified);
        } else {
          // setToast(res.message);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const submit = async () => {
    console.log(userDetail);
    if (
      userDetail.username === '' ||
      userDetail.number === ''
      // || userDetail.email === ''
    ) {
      setSubmitted(true);
      return;
    }

    const emailcheck = checkEmail(userDetail.email);
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })

      return;
    }

    const data = {
      userId: user._id,
      email: userDetail.email.toLowerCase(),
      username: userDetail.username,
      number: userDetail.number,
    };
    // {userDetail.otp&& data.otp=userDetail.otp}
    if (otpval.otp) {
      data.otp = otpval.otp;
    }
    if (userDetail.img) {
      data.profile = userDetail.img;
    }
    console.log('data==========>', data);
    setLoading(true);
    const linksSaved = await saveSocialLinks().catch(() => false);
    if (!linksSaved) {
      setLoading(false);
      return;
    }
    Post('updateprofile', data, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res.status) {
          // await AsyncStorage.setItem('userDetail', JSON.stringify(res.data));
          setToast(res.data.message);

          await AsyncStorage.setItem(
            'userDetail', JSON.stringify(res.data),
          );
          setuser(res.data)

          if (res.data?.otp) {
            setotpfield(true);
            setEdit(true);
          } else {
            setEdit(false);
            setotpfield(false);
            getProfile();
            setotpval({ otp: '' });
          }
        } else {
          setToast(res.message);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
    // }
  };

  const editUpdate = () => {
    setEdit(true);
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Constants.white }]}>
      <View style={styles.toppart}>
        <BackIcon color={Constants.white} onPress={() => goBack()} />
        <Text style={styles.carttxt}>{t('Profile')}</Text>
        {edit ? <Text style={styles.addbtn} onPress={submit}>{t('Update Profile')}</Text> :
          <Text style={styles.addbtn} onPress={() => {
            setEdit(true);
          }}>{t('Edit Profile')}</Text>}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* <Spinner color={'#fff'} visible={loading} /> */}
        <View
          style={{
            height: 120,
            width: 120,
            alignSelf: 'center',
            position: 'relative',
            zIndex: 9,
            marginBottom: 20,
          }}>
          {edit && (
            <Pressable
              style={styles.editiconcov}
              onPress={() => cameraRef.current.show()}>
              <EditIcon height={15} color={Constants.white} />
            </Pressable>
          )}
          <Image
            // source={require('../../Assets/Images/profile.png')}
            source={
              userDetail?.img
                ? {
                  uri: `${userDetail.img}`,
                }
                : require('../../Assets/Images/profile.png')
            }
            style={styles.logo}
          />
        </View>
        <View
          style={[
            styles.card,
            styles.shadowProp,
            { backgroundColor: Constants.white },
            { shadowColor: Constants.black },
          ]}>
          <View style={[styles.textInput, { borderColor: Constants.customgrey }]}>
            <TextInput
              style={[styles.input, { color: Constants.black }]}
              placeholder={t('Enter Name')}
              placeholderTextColor={Constants.customgrey}
              editable={edit}
              value={userDetail?.username}
              onChangeText={username =>
                setUserDetail({ ...userDetail, username })
              }
            />
            <View
              style={[
                styles.mylivejobtitle,
                { backgroundColor: Constants.white },
              ]}>
              <Text style={[styles.jobtitle, { color: Constants.black }]}>
                {t('Name')}
              </Text>
            </View>
          </View>
          {submitted && userDetail.username === '' && (
            <Text style={{ color: 'red' }}>{t('Name is required')}</Text>
          )}
          <View style={[styles.textInput, { borderColor: Constants.customgrey }]}>
            <TextInput
              style={[styles.input, { color: Constants.black }]}
              placeholder={t('Enter Phone Number')}
              placeholderTextColor={Constants.customgrey}
              editable={edit}
              value={userDetail?.number}
              onChangeText={number => setUserDetail({ ...userDetail, number })}
            />
            <View
              style={[
                styles.mylivejobtitle,
                { backgroundColor: Constants.white },
              ]}>
              <Text style={[styles.jobtitle, { color: Constants.black }]}>
                {t('Phone Number')}
              </Text>
            </View>
          </View>
          {submitted && userDetail.number === '' && (
            <Text style={{ color: 'red' }}>{t('Number is required')}</Text>
          )}
          <View style={[styles.textInput, { borderColor: Constants.customgrey }]}>
            <TextInput
              style={[styles.input, { color: Constants.black }]}
              placeholder={t("Enter email")}
              placeholderTextColor={Constants.customgrey}
              editable={edit}
              value={userDetail?.email}
              onChangeText={email => setUserDetail({ ...userDetail, email })}
            />
            <View
              style={[
                styles.mylivejobtitle,
                { backgroundColor: Constants.white },
              ]}>
              <Text style={[styles.jobtitle, { color: Constants.black }]}>
                {t('Email')}
              </Text>
            </View>
          </View>
          {submitted && userDetail.email === '' && (
            <Text style={{ color: 'red' }}>{t('Email is required')}</Text>
          )}

          {otpfield && (
            <View
              style={[styles.textInput, { borderColor: Constants.customgrey }]}>
              <TextInput
                style={[styles.input, { color: Constants.black }]}
                placeholder={t("Enter otp")}
                placeholderTextColor={Constants.customgrey}
                value={otpval.otp}
                onChangeText={otp => setotpval({ ...otpval, otp })}
                keyboardType="number-pad"
              />
              <View
                style={[
                  styles.mylivejobtitle,
                  { backgroundColor: Constants.white },
                ]}>
                <Text style={[styles.jobtitle, { color: Constants.black }]}>
                  {t('OTP')}
                </Text>
              </View>
            </View>
          )}
        </View>
        {!!socialLinks && (
          <View
            style={[
              styles.card,
              styles.socialCard,
              styles.shadowProp,
              { backgroundColor: Constants.white },
              { shadowColor: Constants.black },
            ]}>
            <Text style={styles.sectionTitle}>{t('Your Social Accounts')}</Text>
            {edit ? (
              <>
                {socialLinks.map((link, index) => (
                  <View style={styles.socialEditRow} key={index}>
                    <Dropdown
                      style={styles.platformDropdown}
                      containerStyle={styles.platformMenu}
                      data={SOCIAL_PLATFORMS}
                      value={link.platform}
                      labelField="label"
                      valueField="value"
                      maxHeight={280}
                      onChange={item => updateLink(index, { platform: item.value })}
                      selectedTextStyle={styles.platformText}
                      selectedTextProps={{ numberOfLines: 1 }}
                      renderLeftIcon={() => (
                        <Ionicons
                          style={styles.platformIcon}
                          name={getPlatform(link.platform).icon}
                          size={18}
                          color={getPlatform(link.platform).color}
                        />
                      )}
                      renderItem={item => (
                        <View style={styles.platformItem}>
                          <Ionicons name={item.icon} size={18} color={item.color} />
                          <Text style={styles.platformItemText}>{item.label}</Text>
                        </View>
                      )}
                    />
                    <TextInput
                      style={styles.socialInput}
                      value={link.url}
                      onChangeText={url => updateLink(index, { url })}
                      placeholder={getPlatform(link.platform).placeholder}
                      placeholderTextColor={Constants.customgrey}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    {socialLinks.length > 1 && (
                      <TouchableOpacity onPress={() => removeLink(index)} hitSlop={8} accessibilityLabel={t('Remove')}>
                        <X size={18} color={Constants.customgrey} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addLink} onPress={addLink}>
                  <View style={styles.addLinkIcon}>
                    <Plus size={14} color={Constants.white} />
                  </View>
                  <Text style={styles.addLinkText}>{t('Add another link')}</Text>
                </TouchableOpacity>
              </>
            ) : socialLinks.length ? (
              socialLinks.map((item, index) => {
                const platform = getPlatform(item.platform);
                return (
                  <TouchableOpacity
                    key={`${item.platform}-${index}`}
                    style={[styles.socialRow, index < socialLinks.length - 1 && styles.socialDivider]}
                    onPress={() => openUrl(item.url)}>
                    <View style={styles.socialIcon}>
                      <Ionicons name={platform.icon} size={18} color={platform.color} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.socialName}>{platform.label}</Text>
                      <Text style={styles.socialUrl} numberOfLines={1}>{displayLink(item.url)}</Text>
                    </View>
                    <ExternalLink size={16} color={Constants.customgrey} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.socialUrl}>{t('Add at least one social media or website link.')}</Text>
            )}
          </View>
        )}
        {/* {edit ? (
        <TouchableOpacity style={styles.signInbtn} onPress={submit}>
          <Text style={styles.buttontxt}>Update Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.signInbtn}
          onPress={() => {
            setEdit(true);
          }}>
          <Text style={styles.buttontxt}>Edit Profile</Text>
        </TouchableOpacity>
      )} */}
        <CameraGalleryPeacker
          refs={cameraRef}
          getImageValue={getImageValue}
          base64={false}
          cancel={cancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Constants.white,
    // padding: 20,
  },
  logo: {
    height: 120,
    width: 120,
    alignSelf: 'center',
    borderRadius: 60,
    marginTop: 20,
  },
  textInput: {
    // borderColor: Constants.customgrey,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    // width: 370,
    height: 60,
    marginTop: 40,
    flexDirection: 'row',
  },
  input: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.Medium,
    textAlign: 'left',
    // color: Constants.black,
    flex: 1,
  },
  signInbtn: {
    height: 60,
    // width: 370,
    borderRadius: 10,
    backgroundColor: Constants.lightblue,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  mylivejobtitle: {
    position: 'absolute',
    // backgroundColor: Constants.white,
    paddingHorizontal: 5,
    top: -13,
    left: 30,
  },
  jobtitle: {
    // color: Constants.black,
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
    textAlign: 'center',
    fontWeight: '500',
  },
  editiconcov: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: Constants.customblue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    // marginTop: 115,
    right: -5,
    bottom: 0,
    zIndex: 9,
  },
  shadowProp: {
    // shadowColor: Constants.black,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    // backgroundColor: Constants.white,
    borderRadius: 10,
    paddingTop: 15,
    paddingBottom: 45,
    paddingHorizontal: 15,
    // width: '90%',
    marginVertical: 20,
    // alignSelf: 'center',
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  toppart: {
    backgroundColor: Constants.greennew,
    paddingTop: 5,
    // paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  addbtn: {
    backgroundColor: Constants.pink,
    color: Constants.white,
    paddingHorizontal: 25,
    paddingVertical: 7,
    borderRadius: 15,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    marginTop: 5,
    borderWidth: 1,
    borderColor: Constants.white,
  },
  carttxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  flex: { flex: 1 },
  socialCard: {
    marginTop: 0,
    paddingBottom: 15,
  },
  sectionTitle: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    marginBottom: 5,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  socialDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialName: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },
  socialUrl: {
    color: Constants.customgrey,
    fontSize: 12,
    fontFamily: FONTS.Regular,
  },
  socialEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  platformDropdown: {
    width: 128,
    height: 46,
    borderWidth: 1,
    borderColor: Constants.customgrey,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  platformMenu: { borderRadius: 10, overflow: 'hidden' },
  platformIcon: { marginRight: 6 },
  platformText: { fontFamily: FONTS.Medium, color: Constants.black, fontSize: 13 },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  platformItemText: { fontFamily: FONTS.Regular, color: Constants.black, fontSize: 14 },
  socialInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: Constants.customgrey,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: Constants.black,
    fontFamily: FONTS.Regular,
    fontSize: 13,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginTop: 10,
  },
  addLinkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Constants.greennew,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addLinkText: { fontFamily: FONTS.SemiBold, color: Constants.greennew, fontSize: 14 },
});
