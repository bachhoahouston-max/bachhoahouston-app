import React from 'react';
import {
    Modal,
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import Constants from '../Helpers/constant';

const PaymentWaitingModal = ({
    visible,
    message = 'Processing your payment...',
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.text}>{message}</Text>
                    <Text style={styles.subText}>
                        Please Do not refresh this page. We are processing your order
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    text: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: Constants.custom_green
    },
    subText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
        textAlign: 'center',
    },
});


export default PaymentWaitingModal;
