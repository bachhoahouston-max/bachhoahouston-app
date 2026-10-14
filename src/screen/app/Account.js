/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { navigate, reset } from '../../../navigationRef';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import { GetApi } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverHeader from '../../Assets/Component/DriverHeader';
import {
  DeleteIcon,
  InfoIcon,
  LanguageIcon,
  LocationIcon,
  NotificationIcon,
  OrderIcon,
  PrivacyIcon,
  RightarrowIcon,
} from '../../../Theme';
import { useTranslation } from 'react-i18next';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import Language from './Language';
import { ScrollView } from 'react-native';
import TierCrown from '../../Assets/Component/TierCrown';
import { tierColor } from '../../Assets/Component/TierBadge';

const Account = props => {
  const { t } = useTranslation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  // const [user, setuser] = useState();
  const [userDetail, setUserDetail] = useState({
    email: '',
    name: '',
    phone: '',
    avatar: '',
  });
  const [open, setOpen] = useState(false);
  const [rewards, setRewards] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    // Card is optional; just hide it if the summary can't be loaded
    GetApi('rewards/summary', {})
      .then(res => setRewards(res?.data || null))
      .catch(() => setRewards(null));
  }, [user?.token]);

  // useEffect(() => {
  //   const willFocusSubscription = props.navigation.addListener(
  //     'focus',
  //     async () => {
  //       setInitialRoute();
  //     },
  //   );
  //   return () => {
  //     willFocusSubscription();
  //   };
  // }, []);
  const setInitialRoute = async () => {
    const user = await AsyncStorage.getItem('userDetail');
    const userDetail = JSON.parse(user);
    setuser(JSON.parse(user));
    if (!userDetail?.token) {
      // navigate('Auth')
    } else {
      getProfile();
    }
  };

  // useEffect(() => {
  //   getProfile();
  // }, []);

  const getProfile = () => {
    setLoading(true);
    GetApi(`profile`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.success) {
          // setprofile(res?.data || {});
          // await AsyncStorage.setItem('profilePic', res?.data?.profile || '');
          // setImage(res?.data?.profile || '');

          setUserDetail({
            email: res.data.email,
            name: res.data.name,
            phone: res.data.phone,
            avatar: res.data.avatar,
          });
          // setUser({...user, ...res.data});
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
  const logout = async () => {
    await AsyncStorage.removeItem('userDetail');
    setuser({});
    reset('Auth');
  };
  const inappbrawser = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open('https://www.bachhoahouston.com/ReturnPolicy', {
          // Customization options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.greennew,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        // Fallback to a regular browser if InAppBrowser is not available
        Linking.openURL('https://www.bachhoahouston.com/ReturnPolicy');
      }
    } catch (error) {
      console.error(error);
    }
  };
  const inappbrawser2 = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open('https://www.bachhoahouston.com/ContactUs', {
          // Customization options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.greennew,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        // Fallback to a regular browser if InAppBrowser is not available
        Linking.openURL('https://www.bachhoahouston.com/ContactUs');
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.headtxt}>My Account</Text> */}
      <DriverHeader item={t('My Account')} showback={true} />
      <View>
        <TouchableOpacity
          style={styles.topcard}
          onPress={() => navigate('Profile')}>
          <Image
            // source={require('../../Assets/Images/profile3.png')}
            source={
              user?.profile
                ? {
                  uri: `${user.profile}`,
                }
                : require('../../Assets/Images/profile.png')
            }
            style={styles.proimg}
          />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.protxt}>{user?.username}</Text>
            <Text style={styles.protxt2}>{user?.email}</Text>
            {/* <Text style={styles.protxt2}>{user?.shop_phone}</Text> */}
          </View>
        </TouchableOpacity>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{
            marginTop: 10,
            height: Dimensions.get('window').height - 200,
          }}>
          {rewards?.tier && (
            <RewardsCard
              summary={rewards}
              t={t}
              onPress={() => navigate('App', { screen: 'Rewards' })}
            />
          )}
          <TouchableOpacity
            style={[styles.box, styles.shadowProp]}
            onPress={() => navigate('Myorder')}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <OrderIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('My orders')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box, styles.shadowProp]}
            onPress={() => navigate('Shipping')}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <LocationIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('My address')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity style={[styles.box, styles.shadowProp]} onPress={() => navigate('Language')}>
             <View style={styles.btmboxfirpart}>
            <View style={styles.iconcov}>
                <LocationIcon height={20} width={20} color={Constants.white}/>
              </View>
            <Text style={styles.protxt}>{t('Change Language')}</Text>
            </View>
            <RightarrowIcon
              color={Constants.saffron}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity> */}
          <TouchableOpacity style={[styles.box, styles.shadowProp]} onPress={() => navigate('Notification')}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <NotificationIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('Notifications')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box, styles.shadowProp]}
            onPress={() => inappbrawser()}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <PrivacyIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('Return Policy')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box, styles.shadowProp]}
            onPress={() => inappbrawser2()}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <InfoIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('Help Center')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <View style={[styles.box, { flexDirection: 'column' }]}>
            <TouchableOpacity
              style={[
                styles.box,
                styles.shadowProp,
                {
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  marginTop: 0,
                  width: '100%',
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={() => setOpen(!open)}>
              <View style={styles.btmboxfirpart}>
                <View style={styles.iconcov}>
                  <LanguageIcon
                    height={20}
                    width={20}
                    color={Constants.white}
                  />
                </View>
                <Text style={styles.protxt}>{t('App Language')}</Text>
              </View>
              <RightarrowIcon
                color={'#2E7D32'}
                height={15}
                width={15}
                style={styles.aliself}
              />
            </TouchableOpacity>
            {open && <Language setOpen={setOpen} />}
          </View>
          <TouchableOpacity
            style={[styles.box, styles.shadowProp]}
            onPress={() => setModalVisible2(true)}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <DeleteIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('Delete Account')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box, styles.shadowProp, { marginBottom: 80 }]}
            onPress={() => {
              setModalVisible(true);
            }}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <DeleteIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={styles.protxt}>{t('Log Out')}</Text>
            </View>
            <RightarrowIcon
              color={'#2E7D32'}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
        </ScrollView>
        {/* <Language /> */}

        {/* <TouchableOpacity
            style={styles.btn}
            onPress={async () => {
              setModalVisible(true);
            }}>
            <Text style={styles.btntxt}>Log Out</Text>
            <SignoutIcon
              style={{marginHorizontal: 20}}
              color={Constants.white}
              height={20}
              width={20}
            />
          </TouchableOpacity> */}
      </View>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={{ backgroundColor: 'white', alignItems: 'center' }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to sign out?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible(!modalVisible)}
                  style={styles.cancelButtonStyle}>
                  <Text style={styles.modalText}>{t('Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setModalVisible(!modalVisible);
                    logout();
                  }}
                  style={styles.logOutButtonStyle}>
                  <Text style={styles.modalText}>{t('Sign out')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible2}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible2(!modalVisible2);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={{ backgroundColor: 'white', alignItems: 'center' }}>
              <Text style={[styles.textStyle2, { color: Constants.red }]}>
                {t(
                  'WARNING: You are about to delete your account. This action is permanent and cannot be undone.',
                )}
              </Text>
              <Text style={styles.textStyle3}>
                {t(
                  '• All your data, including personal information, and settings, will be permanently erased.',
                )}
              </Text>
              <Text style={styles.textStyle3}>
                {t(
                  '• You will lose access to all services and benefits associated with your account.',
                )}
              </Text>
              <Text style={styles.textStyle3}>
                {t(
                  '• You will no longer receive updates, support, or communications from us.',
                )}
              </Text>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to delete your account?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible2(!modalVisible2)}
                  style={styles.cancelButtonStyle}>
                  <Text style={styles.modalText}>{t('Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setModalVisible2(!modalVisible2);
                    logout();
                  }}
                  style={styles.logOutButtonStyle}>
                  <Text style={styles.modalText}>{t('Delete Account')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Account;

const RewardsCard = ({ summary, t, onPress }) => {
  const tier = summary.tier;
  const c = tierColor(tier) || tierColor('gold');
  const currentMin = summary.tiers?.find(x => x.key === tier.key)?.minPoints || 0;
  const nextMin = tier.nextTier?.minPoints;
  const progress = nextMin
    ? Math.max(Math.min(((tier.qualifyingPoints - currentMin) / (nextMin - currentMin)) * 100, 100), 0)
    : 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.rewardCard, { backgroundColor: `${c.base}14`, borderColor: `${c.base}55` }]}>
      <View style={[styles.rewardIcon, { backgroundColor: `${c.base}26` }]}>
        <TierCrown tier={tier} size={44} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rewardTier, { color: c.dark }]}>
          {t(`${tier.name.toUpperCase()} MEMBER`)}
        </Text>
        <Text style={styles.rewardPoints}>
          {Number(summary.available || 0).toLocaleString()} {t('Available Points').toLowerCase()}
        </Text>
        <Text style={styles.rewardNext} numberOfLines={1}>
          {tier.nextTier
            ? `${Number(tier.pointsToNextTier || 0).toLocaleString()} ${t('points to reach')} ${t(tier.nextTier.name)}`
            : t("You've reached our highest tier!")}
        </Text>
        <View style={styles.rewardTrack}>
          <View style={[styles.rewardFill, { width: `${progress}%`, backgroundColor: c.base }]} />
        </View>
        <Text style={[styles.rewardRate, { color: c.dark }]}>
          $1 = {tier.pointsPerDollar} {t('points')}
        </Text>
      </View>
      <RightarrowIcon color={'#9CA3AF'} height={15} width={15} style={styles.aliself} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    // paddingVertical: 20,
  },
  headtxt: {
    color: Constants.black,
    // fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 30,
    fontFamily: FONTS.Bold,
  },
  topcard: {
    marginHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    // backgroundColor:Constants.saffron
  },
  protxt: {
    color: '#2E7D32',
    fontSize: 16,
    // fontWeight: '700',
    fontFamily: FONTS.Bold,
  },
  protxt2: {
    color: Constants.black,
    fontSize: 16,
    // fontWeight: '400',
    fontFamily: FONTS.Regular,
  },
  box: {
    paddingHorizontal: 15,
    paddingVertical: 16,
    // borderRadius: 20,
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    width: '93%',
    borderRadius: 5,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shadowProp: {
    // shadowOffset: { width: -2, height: 4 },
    // shadowOpacity: 0.2,
    // shadowRadius: 15,
    // elevation: 5,
  },
  aliself: {
    alignSelf: 'center',
  },
  btntxt: {
    fontSize: 20,
    color: Constants.white,
    // fontWeight:'700'
    fontFamily: FONTS.Bold,
  },
  btn: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    backgroundColor: Constants.custom_green,
    width: '80%',
    alignSelf: 'center',
    marginBottom: 40,
    marginTop: 100,
  },
  proimg: {
    // marginRight: 10,
    height: 70,
    width: 70,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
  },
  /////////logout model //////
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 17,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },

  textStyle: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  textStyle2: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    fontSize: 16,
  },
  textStyle3: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    fontSize: 16,
  },
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  cancelButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.black,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.red,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  redeembtn: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Medium,
    backgroundColor: Constants.custom_green,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 20,
  },
  iconcov: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 10,
  },
  btmboxfirpart: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  rewardCard: {
    width: '93%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  rewardIcon: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTier: { fontFamily: FONTS.Bold, fontSize: 14, letterSpacing: 0.5 },
  rewardPoints: { fontFamily: FONTS.Bold, fontSize: 14, color: '#1F2937' },
  rewardNext: { fontFamily: FONTS.Regular, fontSize: 12, color: '#6B7280' },
  rewardTrack: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden', marginTop: 8 },
  rewardFill: { height: '100%', minWidth: '6%', borderRadius: 4 },
  rewardRate: { fontFamily: FONTS.Medium, fontSize: 12, marginTop: 6 },
});
