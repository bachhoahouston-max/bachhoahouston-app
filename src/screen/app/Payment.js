import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../../navigationRef';
import WebView from 'react-native-webview';
import DriverHeader from '../../Assets/Component/DriverHeader';

const { width } = Dimensions.get('window');

export default function Payment({ route }) {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { url } = route.params;
    console.log(url)

    const onNavStateChange = (navState) => {
        const { url: currUrl } = navState;
        console.log(currUrl)

        if (currUrl.includes('payment-success')) {
            console.log('Payment success detected via deep link');
            // handlePaymentSuccess(currUrl);
        } else if (currUrl.includes('payment-cancel')) {
            console.log('Payment cancel detected via deep link');
            // handlePaymentCancel(currUrl);
        }
        // else {
        //   if (orderID) {
        //     onPaymentCancel(orderID)
        //   }
        // }
    };

    const handleAuthPress = () => {
        navigation.navigate('Auth');
    };

    useEffect(() => {
        if (url) {
            Linking.openURL(url);
        }
    }, [url]);


    return (
        <View style={styles.container}>
            <DriverHeader item={t('Payment')} showback={true} />
            {/* {url && <WebView source={{ uri: url }} onNavigationStateChange={onNavStateChange} />} */}
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