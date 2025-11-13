// app/index.tsx  (Welcome / Splash Screen)
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import Animated,
{
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// 🔥 theme hook – same file path you already use in other screens
import { useSettings } from './utilis/Settings';

export default function WelcomeScreen() {
  const fullBigText = 'Moodify';
  const fullWelcomeText = 'Mood-Based Music & Activity Recommender App';

  const [displayedBigText, setDisplayedBigText] = useState('');
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');
  const opacity = useSharedValue(1);
  const router = useRouter();

  // 🔥 get theme (dark / light)
  const { isDark } = useSettings();
  const styles = getStyles(isDark);

  const navigateToTabs = () => {
    router.push('/(tabs)');
  };

  useEffect(() => {
    const totalDuration = 4000;
    const totalCharacters = fullBigText.length + fullWelcomeText.length;
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
      }
    }, intervalTime);

    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 700 }, (finished) => {
        if (finished) {
          runOnJS(navigateToTabs)();
        }
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        style={styles.backgroundImage}
        source={require('../assets/images/homebg.png')}
      />
      <Image
        style={styles.icon}
        source={require('../assets/images/home.png')}
      />
      <View style={styles.HomefirstContainer}>
        <Text style={styles.BigText}>{displayedBigText}</Text>
        <Text style={styles.welcomeText}>{displayedWelcomeText}</Text>
      </View>
    </Animated.View>
  );
}

// 🔧 Theme-aware styles JUST for this screen
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
      opacity: dark ? 0.45 : 0.6,
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
      color: dark ? '#dddddd' : '#333333',
    },
  });
