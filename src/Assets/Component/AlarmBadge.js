import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Easing,
} from 'react-native';

export default function AlarmBadge({ currentSale }) {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // 🔔 Continuous Shake
        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: -1,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 🔥 Continuous Pop
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-18deg', '18deg'],
    });

    return (
        <View style={styles.container}>
            {/* Continuous Shaking Icon */}
            <Animated.Text
                style={[styles.icon, { transform: [{ rotate }] }]}
            >
                ⏰
            </Animated.Text>

            {/* Continuous Popping Badge */}
            <Animated.View
                style={[
                    styles.badge,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Text style={styles.badgeText}>{currentSale?.days || 0}d {currentSale?.hours || 0}h {currentSale?.minutes || 0}m</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRadius: 999,

    },
    icon: {
        fontSize: 20,
        marginRight: 10,
        color: '#fff',
    },
    badge: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
    },
    badgeText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
