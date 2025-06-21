import { Text, View, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import styles from './homeStyles';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const fullBigText = "Moodify";
  const fullWelcomeText = "Mood-Based Music & Activity Recommender App";

  const [displayedBigText, setDisplayedBigText] = useState('');
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');
  const router = useRouter(); // Declare router here

  useEffect(() => {
    const totalDuration = 5000; // 5 seconds animation
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

    // Set timeout to navigate after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/(tabs)');
    }, 6000);

    // Cleanup intervals and timeout on unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
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
    </View>
  );
}
