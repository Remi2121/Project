import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styles from './homeStyles'; // Make sure your styles are correctly defined

export default function WelcomeScreen() {
  const fullBigText = 'Moodify';
  const fullWelcomeText = 'Mood-Based Music & Activity Recommender App';

  const [displayedBigText, setDisplayedBigText] = useState('');
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');
  const opacity = useSharedValue(1);
  const router = useRouter();

  // ✅ Correct function to navigate
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

    // Animate opacity and navigate
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 700 }, (finished) => {
        if (finished) {
          runOnJS(navigateToTabs)(); // ✅ Fixed usage
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

