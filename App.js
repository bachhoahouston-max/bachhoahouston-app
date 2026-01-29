/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import { NewAppScreen } from '@react-native/new-app-screen';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// import {
//   SafeAreaProvider,
//   useSafeAreaInsets,
// } from 'react-native-safe-area-context';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <SafeAreaProvider>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// function AppContent() {
//   const safeAreaInsets = useSafeAreaInsets();

//   return (
//     <View style={styles.container}>
//       <NewAppScreen
//         templateFileName="App.tsx"
//         safeAreaInsets={safeAreaInsets}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;



/* eslint-disable react-hooks/exhaustive-deps */
import { Root } from 'native-base';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from './src/navigation';
import { GetApi, Post } from './src/Assets/Helpers/Service';
import {
    PermissionsAndroid,
    Platform,
    // SafeAreaView,
    StatusBar,
    StyleSheet,
    Alert,
    Linking
} from 'react-native';
import Spinner from './src/Assets/Component/Spinner';
import Geolocation from 'react-native-geolocation-service';
import GetCurrentAddressByLatLong from './src/Assets/Component/GetCurrentAddressByLatLong';
import { OneSignal } from 'react-native-onesignal';
import i18n from './i18n';
import CuurentLocation from './src/Assets/Component/CuurentLocation';
import SplashScreen from 'react-native-splash-screen';
import {
    triggerDeviceRegistrationAfterSignIn,
    // handleUserLogout, // TODO: integrate with logout functions in Account components
} from './src/Assets/Helpers/OneSignalHelper';
import { PERMISSIONS, request } from 'react-native-permissions';
// import ToastManager, { Toast } from 'toastify-react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import Constants from './src/Assets/Helpers/constant';
import { navigate } from './navigationRef';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import BootSplash from "react-native-bootsplash";
import SpInAppUpdates, {
    IAUUpdateKind,
} from 'sp-react-native-in-app-updates';
import DeviceInfo from 'react-native-device-info';
import VersionCheck from 'react-native-version-check';





// import CustomToaster from './src/Component/CustomToaster';
// import {COLORS} from './Theme';
// import {PaperProvider} from 'react-native-paper';
export const Context = React.createContext('');
export const ToastContext = React.createContext('');
export const LoadContext = React.createContext('');
export const CartContext = React.createContext('');
export const AddressContext = React.createContext('');
export const UserContext = React.createContext('');
export const CheckoutContext = React.createContext();
// export const Context = React.createContext<any>('');
const App = () => {
    const [initial, setInitial] = useState('');
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(false);
    const [cartdetail, setcartdetail] = useState([]);
    const [locationadd, setlocationadd] = useState('');
    const [user, setuser] = useState({});
    const [checkoutData, setCheckoutData] = useState({
        PickupType: null,
        pickupDate: null,
        deliveryTip: 0,
        couponDiscount: 0,
    });

    useEffect(() => {
        console.log(DeviceInfo?.getVersion());
        const inAppUpdates = new SpInAppUpdates(
            true, // isDebug
        );
        // curVersion is optional if you don't provide it will automatically take from the app using react-native-device-info
        // {curVersion: VersionInfo?.appVersion}
        if (Platform.OS === 'android') {
            try {

                inAppUpdates.checkNeedsUpdate({ curVersion: VersionInfo?.appVersion }).then(
                    result => {
                        console.log(result);
                        if (result.shouldUpdate) {
                            const updateOptions = Platform.select({
                                ios: {
                                    title: 'Update available',
                                    message:
                                        'Please update the app to the latest version to access new sales and enjoy a smoother experience.',
                                    buttonUpgradeText: 'Update',
                                    buttonCancelText: 'Cancel',
                                },
                                android: {
                                    updateType: IAUUpdateKind.IMMEDIATE,
                                },
                            });
                            inAppUpdates.startUpdate(updateOptions); // https://github.com/SudoPlz/sp-react-native-in-app-updates/blob/master/src/types.ts#L78
                        }
                    },
                    err => {
                        console.log(err);
                    },
                );
            } catch (err) {
                console.log(err);
            }
        }
        if (Platform.OS === 'ios') {
            checkIOSUpdate();
        }
    }, []);

    // const checkIOSUpdate = async () => {
    //     const latestVersion = await VersionCheck.getLatestVersion({
    //         provider: 'appStore',
    //     });



    //     const currentVersion = VersionCheck.getCurrentVersion();
    //     console.log('currentVersion', currentVersion)
    //     console.log('latestVersion', latestVersion)

    //     const updateNeeded = VersionCheck.needUpdate({
    //         currentVersion,
    //         latestVersion,
    //     });


    //     if (updateNeeded?.isNeeded) {
    //         Alert.alert(
    //             'Update Available',
    //             'Please update the app to the latest version to access new sales and enjoy a smoother experience.',
    //             [
    //                 {
    //                     text: 'Update',
    //                     onPress: () =>
    //                         Linking.openURL(
    //                             'https://apps.apple.com/us/app/b%C3%A1ch-ho%C3%A1-houston/id6745395289'
    //                         ),
    //                 },
    //                 {
    //                     text: 'Cancel',
    //                     onPress: () => { }

    //                 },
    //             ],
    //             { cancelable: true }
    //         );
    //     }
    // }
    async function checkIOSUpdate() {
        try {
            const currentVersion = VersionCheck.getCurrentVersion();

            // const latestVersion = await VersionCheck.getLatestVersion({
            //     provider: __DEV__ ? 'testflight' : 'appStore',
            // });

            const latestVersion = await VersionCheck.getLatestVersion({
                provider: 'appStore',
            });

            const update = VersionCheck.needUpdate({
                currentVersion,
                latestVersion,
            });

            console.log({ currentVersion, latestVersion, update });

            // Alert.alert(latestVersion)
            if (update?.isNeeded) {
                Alert.alert(
                    'Update Available',
                    'Please update the app to the latest version to access new sales and enjoy a smoother experience.',
                    [
                        {
                            text: 'Update',
                            onPress: () =>
                                Linking.openURL(
                                    'https://apps.apple.com/us/app/b%C3%A1ch-ho%C3%A1-houston/id6745395289'
                                ),
                        },
                    ]
                );
            }
        } catch (e) {
            Alert.alert(e)
            console.log('Update check failed', e);
        }
    }

    useEffect(() => {
        SplashScreen.hide();

        setInitialRoute();
        checkLng();
        getCartDetail();
        CustomCurrentLocation();
    }, []);
    const setInitialRoute = async () => {
        // First show Welcome screen for all users


        // Then check for existing user session in the background
        try {
            const userData = await AsyncStorage.getItem('userDetail');
            const userDetail = userData ? JSON.parse(userData) : null;
            console.log('userDetail====>', userDetail);
            if (userDetail?.token) {
                getProfile(userDetail);
            } else {
                // No user logged in, go to Auth after delay
                setTimeout(async () => {
                    setInitial('Welcome');
                    await BootSplash.hide({ fade: true });
                    // setInitial('Auth');
                }, 2000);
            }
        } catch (error) {
            console.error('Error checking user session:', error);
            // If there's an error, default to Auth screen
            setTimeout(async () => {
                setInitial('Welcome');
                await BootSplash.hide({ fade: true });

                // setInitial('Auth');
            }, 2000);
        }
    };

    const getCartDetail = async () => {
        let cart = await AsyncStorage.getItem('cartdata');
        if (cart) {
            setcartdetail(JSON.parse(cart));
        }

        const userdata = await AsyncStorage.getItem('userDetail');
        if (userdata) {
            setuser(JSON.parse(userdata));
        }
    };

    const getProfile = async (u) => {
        await AsyncStorage.setItem('userDetail', JSON.stringify(u));
        setLoading(true);
        GetApi('getProfile', {}).then(
            async res => {
                setLoading(false);
                console.log(res);
                if (res.status) {
                    let userDetail = res.data;
                    res.data.token = u?.token;
                    AsyncStorage.setItem('userDetail', JSON.stringify(res.data));
                    setuser(res.data);
                    // setTimeout(async () => {
                    if (userDetail.type === 'ADMIN') {
                        setInitial('Employeetab');
                    } else if (userDetail.type === 'DRIVER') {
                        if (userDetail.status === 'Verified') {
                            setInitial('Drivertab');
                        } else {
                            setInitial('Driverform');
                        }
                    } else {
                        setInitial('App');
                    }
                    await BootSplash.hide({ fade: true });

                    // }, 2000);
                    // triggerDeviceRegistrationAfterSignIn();
                }
            },
            err => {
                setLoading(false);
                console.log(err);
            },
        );
    };

    const CustomCurrentLocation = async () => {
        try {
            if (Platform.OS === 'ios') {
                request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(result => {
                    console.log('dsdswdswdsw===>', result);
                    if (result === 'granted' || result === 'limited') {
                        Geolocation.getCurrentPosition(
                            position => {
                                console.log(position);
                                // setlocationadd(position);
                                GetCurrentAddressByLatLong({
                                    lat: position.coords.latitude,
                                    long: position.coords.longitude,
                                }).then(res => {
                                    console.log('res===>', res);
                                    setlocationadd(res.results[0].formatted_address);
                                });
                            },
                            error => {
                                console.log(error.code, error.message);
                                //   return error;
                            },
                            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
                        );
                    }
                });
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    Geolocation.getCurrentPosition(
                        position => {
                            console.log(position);
                            // setlocation({
                            //   latitude: position.coords.latitude,
                            //   longitude: position.coords.longitude,
                            //   latitudeDelta: 0.05,
                            //   longitudeDelta: 0.05,
                            // });
                            GetCurrentAddressByLatLong({
                                lat: position.coords.latitude,
                                long: position.coords.longitude,
                            }).then(res => {
                                console.log('res===>', res);
                                setlocationadd(res.results[0].formatted_address);
                            });
                        },
                        error => {
                            console.log(error.code, error.message);
                            //   return error;
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
                    );
                } else {
                    console.log('location permission denied');
                }
            }
        } catch (err) {
            console.log('location err =====>', err);
        }
    };

    const APP_ID = 'cc87775c-3a16-47a0-9158-b68702ac5c2c';

    useEffect(() => {
        initializeOneSignal();
    }, []);

    const initializeOneSignal = async () => {
        try {
            console.log('Initializing OneSignal...');
            OneSignal.initialize(APP_ID);

            await OneSignal.Notifications.requestPermission(true);

            OneSignal.User.pushSubscription.addEventListener('change', event => {
                const newId = event?.current?.id;
                console.log('Subscription changed, new ID:', newId);
                if (newId) {
                    // Store the new player ID immediately
                    AsyncStorage.setItem('oneSignalPlayerId', newId);
                    // triggerDeviceRegistrationAfterSignIn();
                }
            });

            OneSignal.Notifications.addEventListener('click', event => {
                navigate('Notification')
                if (initial === '') {
                    setInitial('Notification')
                } else {
                    console.log(event)
                    navigate('Notification')
                }
            });

            const existingPlayerId = await AsyncStorage.getItem('oneSignalPlayerId');
            console.log('Existing stored player ID:', existingPlayerId);

            setTimeout(() => {
                const subscriptionId = OneSignal.User.pushSubscription.id;
                console.log('Current subscription ID:', subscriptionId);

                if (subscriptionId) {
                    AsyncStorage.setItem('oneSignalPlayerId', subscriptionId);
                    triggerDeviceRegistrationAfterSignIn();
                } else if (existingPlayerId) {
                    console.log('Using existing player ID for registration');
                    triggerDeviceRegistrationAfterSignIn();
                } else {
                    console.log('No subscription ID available, retrying...');
                    retrySubscriptionId(1);
                }
            }, 1000);
        } catch (error) {
            console.log('OneSignal init error:', error);
        }
    };

    const retrySubscriptionId = (attempt = 1) => {
        if (attempt > 5) {
            console.log('Failed after 5 attempts');
            return;
        }

        setTimeout(() => {
            const id = OneSignal.User.pushSubscription.id;
            console.log(`Retry ${attempt}: Subscription ID:`, id);
            if (id) {
                AsyncStorage.setItem('oneSignalPlayerId', id);
                // Use the helper function instead of local function
                // triggerDeviceRegistrationAfterSignIn();
            } else {
                retrySubscriptionId(attempt + 1);
            }
        }, attempt * 2000);
    };

    const checkLng = async () => {
        const x = await AsyncStorage.getItem('LANG');
        if (x != null) {
            i18n.changeLanguage(x);
        }
    };
    const [interval, setinter] = useState();

    useEffect(() => {
        if (user?.token) {
            console.log('User token detected, triggering device registration...');
            // triggerDeviceRegistrationAfterSignIn();
        }
    }, [user?.token]);

    useEffect(() => {
        AsyncStorage.setItem('userDetail', JSON.stringify(user))
        clearInterval(interval);
        let int;
        if (user?.type === 'DRIVER') {
            int = setInterval(() => {
                updateTrackLocation(int);
            }, 30000);
            setinter(int);
        } else {
            clearInterval(int);
        }
        return () => {
            clearInterval(int);
        };
    }, [user]);

    const updateTrackLocation = inter => {
        CuurentLocation(res => {
            const data = {
                track: {
                    type: 'Point',
                    coordinates: [res.coords.longitude, res.coords.latitude],
                },
            };
            Post('updateUserLocation', data).then(
                async response => {
                    // setLoading(false);
                    // console.log(response)
                    if (response.status) {
                    } else {
                        clearInterval(inter);
                        console.log('stop');
                    }
                },
                err => {
                    clearInterval(inter);
                    // setLoading(false);
                    console.log(err);
                },
            );
        });
    };
    useEffect(() => {
        console.log('enter1');
        if (toast) {
            console.log('enter2');
            Toast.show({
                type: 'success',
                text1: toast,
                position: 'top',
                visibilityTime: 2500,
                autoHide: true,
                onHide: () => {
                    setToast('');
                },
            });
        }
    }, [toast]);


    return (
        <GestureHandlerRootView>
            <PaperProvider>
                <Context.Provider value={[initial, setInitial]}>
                    <ToastContext.Provider value={[toast, setToast]}>
                        <LoadContext.Provider value={[loading, setLoading]}>
                            <UserContext.Provider value={[user, setuser]}>
                                <CartContext.Provider value={[cartdetail, setcartdetail]}>
                                    <CheckoutContext.Provider value={[checkoutData, setCheckoutData]}>
                                        <AddressContext.Provider value={[locationadd, setlocationadd]}>
                                            <StripeProvider publishableKey="pk_test_51RJ8vERoENQzVclyyZC2YrXTIvGYvx2V8NR88vGDNjqbpBTaar4lovnanf5Df38kC9rzChaYGNAf3PjwTaHL8plP00QaOyY60A">
                                                {/* <StripeProvider publishableKey="pk_live_51RGgXqLieGlAHmAUrFrRUpFsMqVkOCXm0xL8NKzseMnVs9eH1oF0ggqzfPXqg6Kl2MBB1FLpMhKKkOKNPc2aHbM1005DSI1QLJ"> */}
                                                <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'top', 'right'] : ['bottom', 'left', 'right', 'top']}>

                                                    <Spinner color={'#fff'} visible={loading} />
                                                    <StatusBar
                                                        barStyle='default'
                                                        backgroundColor={Constants.greennew}
                                                    />
                                                    {initial !== '' && <Navigation initial={initial} />}
                                                </SafeAreaView>
                                            </StripeProvider>
                                        </AddressContext.Provider>
                                    </CheckoutContext.Provider>
                                </CartContext.Provider>
                            </UserContext.Provider>
                        </LoadContext.Provider>
                    </ToastContext.Provider>
                    <Toast />
                </Context.Provider>
            </PaperProvider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Constants.greennew,
        // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    toastManager: {
        pointerEvents: 'box-none',
    },
});

export default App;
