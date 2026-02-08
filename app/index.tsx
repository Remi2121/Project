// app/index.tsx  (Welcome / Splash Screen)

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// 🌙 Theme
import { useSettings } from './utilis/Settings';

// 🔐 Firebase Auth
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';

export default function WelcomeScreen() {
  const fullBigText = 'Moodify';
  const fullWelcomeText =
    'Mood-Based Music & Activity Recommender App';

  const [displayedBigText, setDisplayedBigText] = useState('');
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');

  const [animationDone, setAnimationDone] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const opacity = useSharedValue(1);
  const router = useRouter();

  const { isDark } = useSettings();
  const styles = getStyles(isDark);

  // 🔐 Check login state
  const checkAuthAndNavigate = () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        setShowLoginPopup(true);
      }
    });
  };

  // 🔤 Typing animation
  useEffect(() => {
    const totalDuration = 4000;
    const totalCharacters =
      fullBigText.length + fullWelcomeText.length;
    const intervalTime = totalDuration / totalCharacters;

    let currentBigText = '';
    let currentWelcomeText = '';
    let bigIndex = 0;
    let welcomeIndex = 0;

    const interval = setInterval(() => {
      if (bigIndex < fullBigText.length) {
        currentBigText += fullBigText[bigIndex];
        setDisplayedBigText(currentBigText);
        bigIndex++;
      } else if (welcomeIndex < fullWelcomeText.length) {
        currentWelcomeText += fullWelcomeText[welcomeIndex];
        setDisplayedWelcomeText(currentWelcomeText);
        welcomeIndex++;
      } else {
        clearInterval(interval);
        setAnimationDone(true);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  // ⏱️ Auth check after animation
  useEffect(() => {
    if (!animationDone) return;

    const timeout = setTimeout(() => {
      opacity.value = withTiming(
        1,
        { duration: 300 },
        (finished) => {
          if (finished) {
            runOnJS(checkAuthAndNavigate)();
          }
        }
      );
    }, 400);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* 🌄 Background Image */}
      <Image
        style={styles.backgroundImage}
        source={require('../assets/images/homebg.png')}
      />

      {/* 🌓 Overlay (controls darkness, not image color) */}
      <View style={styles.imageOverlay} />

      {/* 🎧 App Icon */}
      <Image
        style={styles.icon}
        source={require('../assets/images/home.png')}
      />

      {/* ✨ Text */}
      <View style={styles.HomefirstContainer}>
        <Text style={styles.BigText}>{displayedBigText}</Text>
        <Text style={styles.welcomeText}>
          {displayedWelcomeText}
        </Text>
      </View>

      {/* 🔐 LOGIN POPUP */}
      <Modal visible={showLoginPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Better Experience Awaits 💙
            </Text>

            <Text style={styles.modalText}>
              To get better performance, please login
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.loginBtn}
                onPress={() => {
                  setShowLoginPopup(false);
                  router.replace('/authpages/Login-page');
                }}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </Pressable>

              <Pressable
                style={styles.skipBtn}
                onPress={() => {
                  setShowLoginPopup(false);
                  router.replace('/(tabs)');
                }}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

// 🎨 Styles
const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? '#121212' : '#f8f9fa',
      alignItems: 'center',
      justifyContent: 'center',
    },

    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },

    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: dark
        ? 'rgba(0,0,0,0.35)'
        : 'rgba(255,255,255,0.15)',
    },

    icon: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
      marginBottom: 24,
    },

    HomefirstContainer: {
      paddingHorizontal: 24,
      alignItems: 'center',
    },

    BigText: {
      fontSize: 42,
      fontWeight: '800',
      color: dark ? '#ffffff' : '#000000',
      marginBottom: 12,
    },

    welcomeText: {
      fontSize: 16,
      textAlign: 'center',
      color: dark ? '#eaeaea' : '#dfd5d5ff',
    },

    // 🔵 MODAL
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalBox: {
      width: '85%',
      backgroundColor: '#e8f2ff',
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      elevation: 10,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0b3c6f',
      marginBottom: 8,
    },

    modalText: {
      fontSize: 14,
      textAlign: 'center',
      color: '#1f4f82',
      marginBottom: 20,
    },

    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },

    loginBtn: {
      backgroundColor: '#2f80ed',
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 12,
    },

    loginBtnText: {
      color: '#ffffff',
      fontWeight: '600',
    },

    skipBtn: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#2f80ed',
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 12,
    },

    skipBtnText: {
      color: '#2f80ed',
      fontWeight: '600',
    },
  });