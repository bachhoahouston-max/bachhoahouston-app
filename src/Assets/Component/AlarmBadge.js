import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Easing,
} from 'react-native';
import Svg, { Defs, Stop, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { AlarmClock } from 'lucide-react-native';

export default function AlarmBadge({ currentSale }) {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 100,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: -1,
                    duration: 100,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 100,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-20deg', '20deg'],
    });

    const hours = String(
        (currentSale?.days || 0) * 24 + (currentSale?.hours || 0)
    ).padStart(2, '0');
    const minutes = String(currentSale?.minutes || 0).padStart(2, '0');

    return (
        <LinearGradient
            colors={['#0F3D2E', '#2E7D32']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradentRadius}
            onLayout={e => {
                const { width, height } = e.nativeEvent.layout;
                setSize({ width, height });
            }}>
            {/* {size.width > 0 && (
                <Svg
                    style={StyleSheet.absoluteFill}
                    width={size.width}
                    height={size.height}>
                    <Defs>
                        <LinearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#0F3D2E" />
                            <Stop offset="1" stopColor="#2E7D32" />
                        </LinearGradient>
                    </Defs>
                    <Rect
                        width={size.width}
                        height={size.height}
                        rx={20}
                        fill="url(#badgeGrad)"
                    />
                </Svg>
            )} */}
            <View style={styles.container}>


                <Animated.Text style={[styles.icon, { transform: [{ rotate }] }]}>
                    <AlarmClock size={25} color={'#F2D27A'} />
                </Animated.Text>
                <View style={styles.textGroup}>
                    <Text style={styles.label}>FLASH DEAL</Text>
                    <Text style={styles.countdown}>
                        {hours}h : {minutes}m
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',

        paddingHorizontal: 10,
        paddingVertical: 6,
        // borderTopRadius: 20,
        borderTopStartRadius: 20,
        borderTopEndRadius: 10,
        borderBottomEndRadius: 30,
        borderRightWidth: 5,
        borderRightColor: '#D4AF37',
        borderBottomWidth: 3,
        borderBottomColor: '#D4AF37',
        // borderColor: '#D4AF37',
        gap: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,

    },
    gradentRadius: {
        borderTopStartRadius: 20,
        borderTopEndRadius: 10,
        borderBottomEndRadius: 30,
    },
    icon: {
        fontSize: 20,
    },
    textGroup: {
        flexDirection: 'column',
        gap: 1,
    },
    label: {
        color: '#D4AF37',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    countdown: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
