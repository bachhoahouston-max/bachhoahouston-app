import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  
  const handleAuthPress = () => {
    navigation.navigate('Auth');
  };
  
  return (
    <View style={styles.container}>
      {/* Top Section with Light Green Background */}
      <View style={styles.topSection}>
        <Image
          source={require('../../Assets/Images/welcome.png')}
          style={styles.basketImage}
          resizeMode="contain"
        />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../Assets/Images/newlogo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom Section with Dark Green Background */}
      <View style={styles.bottomSection}>
        {/* Background Image */}
        <Image
          source={require('../../Assets/Images/new.png')}
          style={styles.backgroundImage}
          resizeMode="stretch"
        />
        
        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.subtitleText}>Vietnamese Grocery Delivery Service</Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={handleAuthPress}
          >
            <Text style={styles.linkText}>Click here to Sign In/Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
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
});