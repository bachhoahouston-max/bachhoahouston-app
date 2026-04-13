import React, { useRef, useEffect, useState } from "react";
import {
    View,
    Text,
    Animated,
    StyleSheet,
} from "react-native";

export default function MarqueeText({
    text = "🔥 Free Delivery | Save 20% | Buy Now 🔥",
    speed = 40,
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const [contentWidth, setContentWidth] = useState(0);

    useEffect(() => {
        if (!contentWidth) return;

        Animated.loop(
            Animated.timing(translateX, {
                toValue: -contentWidth / 2,
                duration: (contentWidth / 2) * speed,
                useNativeDriver: true,
            })
        ).start();
    }, [contentWidth]);

    return (
        <View style={styles.container}>
            <Animated.View
                style={{
                    flexDirection: "row",
                    transform: [{ translateX }],
                }}
                onLayout={(e) =>
                    setContentWidth(e.nativeEvent.layout.width)
                }
            >
                {/* First Copy */}
                <Text style={styles.text}>{text}   </Text>

                {/* Second Copy */}
                <Text style={styles.text}>{text}   </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 30,
        overflow: "hidden",
        backgroundColor: "#1b5e20",
        justifyContent: "center",
    },
    text: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "600",
    },
});