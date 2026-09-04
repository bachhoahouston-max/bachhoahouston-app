/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable react-hooks/exhaustive-deps */
import { Root } from 'native-base';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from './src/navigation';
import { GetApi, Post } from './src/Assets/Helpers/Service';
import { getSyncedCart, saveSyncedCart } from './src/Assets/Helpers/CartSync';
import {
    PermissionsAndroid,
    Platform,
    // SafeAreaView,
    StatusBar,
    StyleSheet,
    Alert,
    Linking,
    AppState,
    DeviceEventEmitter,
} from 'react-native';
import Spinner from './src/Assets/Component/Spinner';
import PickupAlertModal from './src/Assets/Component/PickupAlertModal';
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
import { checkVersion } from "react-native-check-version";




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
export const LanguageContext = React.createContext();
// export const Context = React.createContext<any>('');

// Cart items added on the web use web's field names (id/name/price/
// selectedImage/...). The backend's cart-sync merge already copies most of
// them onto the app-native names, but fill in anything still missing here so
// price/name/image never render blank or NaN in the app cart. Idempotent, so
// it's safe to run on items that are already app-shaped.
const normalizeForApp = items =>
    (Array.isArray(items) ? items : []).map(item => {
        if (!item || typeof item !== 'object') return item;
        const next = { ...item };
        if (next.productid === undefined) next.productid = next.id;
        if (next.productname === undefined) next.productname = next.name;
        if (next.image === undefined) next.image = next.selectedImage;
        if (next.offer === undefined) next.offer = next.price;
        if (next.price === undefined) next.price = next.offer;
        if (next.priceSlotIndex === undefined || next.priceSlotIndex === null) {
            next.priceSlotIndex = 0;
        }
        if (!next.price_slot || typeof next.price_slot !== 'object') {
            next.price_slot = {};
        }
        return next;
    });

const App = () => {
    const [initial, setInitial] = useState('');
    const [toast, setToast] = useState('');
    const isInitialized = useRef(false);
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
    const [language, setLanguage] = useState('vi');

    // ── Cross-platform cart sync (separate from the local-cart logic above) ──
    // Tracks which account this device has already merged its local cart
    // into. Persisted in AsyncStorage (not just a ref) so an app restart
    // shortly after ordering is still recognized as "the same session" and
    // just pulls the server's cart instead of re-merging with whatever's
    // still in AsyncStorage at that instant.
    const cartHydrated = useRef(false);
    const cartPushTimer = useRef(null);

    useEffect(() => {
        const userId = user?._id;
        if (!userId || !user?.token) {
            AsyncStorage.removeItem('cartSyncUserId');
            cartHydrated.current = true;
            return;
        }

        let cancelled = false;

        const syncCartOnLogin = async () => {
            try {
                const [res, syncedUserId] = await Promise.all([
                    getSyncedCart(),
                    AsyncStorage.getItem('cartSyncUserId'),
                ]);
                console.log('Synced cart response:', res, syncedUserId);
                if (cancelled) return;

                const serverItems = res?.data?.items || [];
                const isNewSessionForUser = syncedUserId !== userId;
                let finalItems = serverItems;

                if (isNewSessionForUser) {
                    // Merge this device's local/guest cart into the account's
                    // synced cart on login, instead of discarding either side.
                    // App items key on `productid`, web items key on `id` —
                    // fall back across both so a cart merged from the web
                    // still dedupes correctly.
                    const keyOf = item => item.productid || item.id;
                    const byId = new Map();
                    serverItems.forEach(item => byId.set(keyOf(item), item));
                    cartdetail.forEach(item => {
                        if (!byId.has(keyOf(item))) byId.set(keyOf(item), item);
                    });
                    finalItems = Array.from(byId.values());
                    console.log('Merged cart items for new session:', finalItems);
                }

                // Items that were added on the web carry web's field names
                // (id/price/...) — translate those to the app's shape before
                // rendering, or price/name show up blank/NaN.
                finalItems = normalizeForApp(finalItems);

                cartHydrated.current = false;
                setcartdetail(finalItems);
                await AsyncStorage.setItem('cartdata', JSON.stringify(finalItems));
                await AsyncStorage.setItem('cartSyncUserId', userId);

                if (isNewSessionForUser) {
                    await saveSyncedCart(finalItems);
                }
            } catch (e) {
                // Offline or sync failure — keep using the local cart as-is.
            } finally {
                cartHydrated.current = true;
            }
        };

        syncCartOnLogin();
        return () => {
            cancelled = true;
        };
    }, [user?._id, user?.token]);

    useEffect(() => {
        if (!user?._id || !user?.token) return;
        if (!cartHydrated.current) return;

        clearTimeout(cartPushTimer.current);
        cartPushTimer.current = setTimeout(() => {
            console.log(cartdetail, 'cartdetail');
            let cartData = [...cartdetail];
            cartData.forEach(item => {
                if (item.productSource === 'SALE') {
                    item.price_slot.price = item.price;
                    item.price_slot.our_price = item.offer;
                    item.price_slot.other_price = item.price;
                    item.regularPrice = item.price
                }
                console.log(cartData, 'cartData');
            })

            saveSyncedCart(cartData).catch(() => {
                // Offline or sync failure — local cart already has the
                // change, it'll be pushed again on the next cart edit.
            });
        }, 800);

        return () => clearTimeout(cartPushTimer.current);
    }, [cartdetail]);

    // The login pull above only runs once (when user id/token first appears).
    // Re-pull whenever the app returns to the foreground so items added on the
    // web — or another device — show up without a cold restart. Server is the
    // source of truth here, same as the "existing session" login path; the
    // debounced push stays paused via cartHydrated until this settles.
    useEffect(() => {
        if (!user?._id || !user?.token) return;

        const pullSyncedCart = async () => {
            try {
                const res = await getSyncedCart();
                const serverItems = normalizeForApp(res?.data?.items || []);
                cartHydrated.current = false;
                setcartdetail(serverItems);
                await AsyncStorage.setItem('cartdata', JSON.stringify(serverItems));
            } catch (e) {
                // Offline or sync failure — keep the local cart as-is.
            } finally {
                cartHydrated.current = true;
            }
        };

        const subscription = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') pullSyncedCart();
        });
        return () => subscription.remove();
    }, [user?._id, user?.token]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            try {
                const inAppUpdates = new SpInAppUpdates(false);
                const currentVersion = VersionCheck.getCurrentVersion();
                inAppUpdates.checkNeedsUpdate({ curVersion: currentVersion }).then(
                    result => {
                        console.log('Android update check:', result);
                        if (result.shouldUpdate) {
                            inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE }).catch(() => initialSetup());
                        } else {
                            initialSetup()
                        }
                    },
                    err => {
                        initialSetup()
                        console.log('Android update check error:', err);
                    },
                );
            } catch (err) {
                initialSetup()
                console.log('Android update check failed:', err);
            }
        }
    }, []);

    const initialSetup = async () => {
        isInitialized.current = true;
        SplashScreen.hide();
        setInitialRoute();
        checkLng();
        getCartDetail();
        CustomCurrentLocation();
    }


    useEffect(() => {
        if (Platform.OS === 'ios') {
            checkIOSUpdate(0);
            const subscription = AppState.addEventListener('change', nextState => {
                if (nextState === 'active' && !isInitialized.current) {
                    checkIOSUpdate(0);
                }
            });
            return () => subscription.remove();
        }
    }, []);

    function isVersionLower(current, latest) {
        const a = current.split('.').map(Number);
        const b = latest.split('.').map(Number);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const diff = (a[i] || 0) - (b[i] || 0);
            if (diff < 0) return true;
            if (diff > 0) return false;
        }
        return false;
    }

    async function checkIOSUpdate(attempt = 0) {
        const MAX_RETRIES = 3;
        try {
            if (__DEV__) {
                initialSetup();
                return;
            }

            const version = await checkVersion();
            console.log("iOS - Got version info:", version);
            const currentVersion = DeviceInfo.getVersion();
            console.log(currentVersion, version.version)
            if (version && version.version) {
                if (isVersionLower(currentVersion, version.version)) {
                    Alert.alert(
                        'Update Available',
                        'Please update the app to the latest version to access new sales and enjoy a smoother experience.',
                        [
                            {
                                text: 'Update',
                                onPress: () => {
                                    Linking.openURL(version.url);
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                } else {
                    initialSetup();
                }
            } else if (attempt < MAX_RETRIES) {
                checkIOSUpdate(attempt + 1);
            } else {
                initialSetup();
            }
        } catch (e) {
            console.log('iOS update check failed:', e);
            if (attempt < MAX_RETRIES) {
                checkIOSUpdate(attempt + 1);
            } else {
                initialSetup();
            }
        }
    }


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
                    if (userDetail.type === 'ADMIN' || userDetail.type === 'EMPLOYEE') {
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

            // OneSignal.User.pushSubscription.addEventListener('change', event => {
            //     const newId = event?.current?.id;
            //     console.log('Subscription changed, new ID:', newId);
            //     if (newId) {
            //         // Store the new player ID immediately
            //         AsyncStorage.setItem('oneSignalPlayerId', newId);
            //         // triggerDeviceRegistrationAfterSignIn();
            //     }
            // });

            // Foreground: a push arriving while the app is open. Pop the alert
            // modal (buzz + sound) instead of only a silent banner.
            OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
                const data = event?.getNotification?.()?.additionalData
                    || event?.notification?.additionalData
                    || {};
                if (data?.type === 'pickup_alert') {
                    DeviceEventEmitter.emit('pickupAlert', data);
                }
                // Don't preventDefault → OS still shows the banner and plays the
                // notification sound alongside our modal.
            });

            OneSignal.Notifications.addEventListener('click', event => {
                const data = event?.notification?.additionalData || {};
                const actionId = event?.result?.actionId;

                // Curbside / in-store "I'm Here" arrival alert for staff.
                if (data?.type === 'pickup_alert') {
                    if (actionId === 'acknowledge' && data?.alertId) {
                        Post('acknowledgePickupAlert', { alertId: data.alertId, source: 'notification' }).then(
                            res => console.log('Pickup acknowledged:', res?.data?.message),
                            err => console.log('Pickup acknowledge failed:', err),
                        );
                        return;
                    }
                    navigate('Employeetab');
                    // Also pop the alert modal once the app is open.
                    DeviceEventEmitter.emit('pickupAlert', data);
                    return;
                }

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

            // setTimeout(() => {
            //     const subscriptionId = OneSignal.User.pushSubscription.id;
            //     console.log('Current subscription ID:', subscriptionId);

            //     if (subscriptionId) {
            //         AsyncStorage.setItem('oneSignalPlayerId', subscriptionId);
            //         triggerDeviceRegistrationAfterSignIn();
            //     } else if (existingPlayerId) {
            //         console.log('Using existing player ID for registration');
            //         triggerDeviceRegistrationAfterSignIn();
            //     } else {
            //         console.log('No subscription ID available, retrying...');
            //         retrySubscriptionId(1);
            //     }
            // }, 1000);
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
            setLanguage(x);
        } else {
            i18n.changeLanguage('vi');
            setLanguage('vi');
            await AsyncStorage.setItem('LANG', 'vi');
        }
    };

    const toggleLanguage = async () => {
        const next = language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(next);
        setLanguage(next);
        await AsyncStorage.setItem('LANG', next);
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
                <LanguageContext.Provider value={[language, toggleLanguage]}>
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
                                                            barStyle='light-content'
                                                            backgroundColor={Constants.greennew}
                                                        />
                                                        {initial !== '' && <Navigation initial={initial} />}
                                                        <PickupAlertModal />
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
                </LanguageContext.Provider>
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
