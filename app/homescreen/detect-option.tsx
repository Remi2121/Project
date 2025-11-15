// detect-options.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../utilis/Settings';

export default function DetectMoodOptionScreen() {
  const router = useRouter();

  // theme
  const { isDark } = useSettings();
  const styles = getDetectStyles(isDark);
  const palette = getPalette(isDark);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.title }]}>Let’s Find Out Your Mood!</Text>
      <Text style={[styles.subtitle, { color: palette.subtitle }]}>
        Choose how you want to detect your mood
      </Text>

      {/* mood Animation */}
      <LottieView
        source={require('../../assets/animation/Medit.json')}
        style={styles.image}
        resizeMode="contain"
        autoPlay
        loop
      />

      <View style={styles.iconRow}>
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: palette.accent, backgroundColor: palette.buttonBackground }]}
          onPress={() => router.push('/homescreen/camera')}
        >
          <Ionicons name="camera" size={30} color={palette.accent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: palette.accent, backgroundColor: palette.buttonBackground }]}
          onPress={() => router.push({ pathname: '/audio' as any })}
        >
          <MaterialIcons name="keyboard-voice" size={30} color={palette.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Palette helper */
const getPalette = (dark: boolean) => ({
  background: dark ? '#07070a' : '#ffffff',
  title: dark ? '#e6e6e6' : '#2a1faa',
  subtitle: dark ? '#bdbddf' : '#2a1faa',
  accent: dark ? '#6f6cff' : '#2a1faa',
  buttonBackground: dark ? '#0f0f16' : '#ffffff',
});

/** Styles (static layout) */
const getDetectStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 80,
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 20,
      paddingHorizontal: 30,
      lineHeight: 36,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    image: {
      width: 300,
      height: 300,
      marginBottom: 20,
    },
    iconRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '80%',
      marginTop: 40,
    },
    iconButton: {
      padding: 20,
      borderRadius: 50,
      borderWidth: 2,
      // backgroundColor set at runtime from palette
      alignItems: 'center',
      justifyContent: 'center',
      width: 90,
      height: 90,
    },
  });

export { getDetectStyles };

