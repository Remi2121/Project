// cameraResult.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

// theme hook (same as your journal screen)
import { useSettings } from '../utilis/Settings';

export default function MoodResult() {
  const { mood, confidence } = useLocalSearchParams();
  const router = useRouter();

  // theme
  const { isDark } = useSettings();
  const styles = getCameraStyles(isDark);

  // Normalize router params
  const moodRaw = Array.isArray(mood) ? mood[0] : (mood ?? '');
  const confRaw = Array.isArray(confidence) ? confidence[0] : (confidence ?? '');

  // Emoji map
  const moodEmojis: Record<string, string> = {
    Joy: '😊',
    Sorrow: '😢',
    Anger: '😠',
    Surprise: '😲',
    Neutral: '😐',
  };

  // Map to app mood keys
  const normalizeToAppMood = (m: string) => {
    const k = (m || '').trim().toLowerCase();
    if (k === 'joy') return 'happy';
    if (k === 'sorrow') return 'sad';
    if (k === 'anger') return 'angry';
    if (k === 'surprise') return 'surprise';
    if (k === 'neutral') return 'neutral';
    return 'neutral';
  };

  const normalizedMood = normalizeToAppMood(moodRaw);

  const confidenceNum = (() => {
    const n = Number(confRaw);
    return Number.isFinite(n) ? n : null;
  })();

  const saveMoodToFirestore = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login required', 'Please sign in to save your mood.', [
        { text: 'OK', onPress: () => router.replace('/authpages/Login-page') },
      ]);
      return;
    }

    try {
      const payload: any = {
        moodOriginal: moodRaw,
        mood: normalizedMood,
        source: 'camera',
        createdAt: serverTimestamp(),
      };
      if (confidenceNum !== null) payload.confidence = confidenceNum;

      await addDoc(collection(db, 'users', user.uid, 'MoodHistory'), payload);

      router.push({ pathname: '/recommendList' as any, params: { mood: normalizedMood } });
    } catch (error: any) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', error?.message ?? 'Failed to save mood.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DETECT MOOD</Text>

      {moodRaw ? (
        <Text style={styles.emoji}>{moodEmojis[moodRaw] || '🤔'}</Text>
      ) : (
        <Text style={styles.missingText}>Mood not detected</Text>
      )}

      <Text style={styles.moodText}>
        Detected Mood: <Text style={styles.boldText}>{moodRaw || '—'}</Text>
      </Text>

      <Text style={styles.moodText}>
        Normalized: <Text style={styles.boldText}>{normalizedMood}</Text>
      </Text>

      <Text style={styles.confidenceText}>Confidence: {formatConfidence(confRaw)}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={saveMoodToFirestore}>
          <Text style={styles.primaryButtonText}>Confirm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={() => router.replace({ pathname: '/camera' as any })}
        >
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatConfidence(v: any) {
  if (v == null) return '—';
  const n = Number(Array.isArray(v) ? v[0] : v);
  if (!Number.isFinite(n)) return String(v);
  return n >= 0 && n <= 1 ? `${Math.round(n * 100)}%` : `${n}`;
}

/**
 * Style factory: returns styles tuned for dark or light theme.
 * Adjust palette here if you want different colors across the app.
 */
const getCameraStyles = (dark: boolean) => {
  const palette = {
    background: dark ? '#07070a' : '#ffffff',
    surface: dark ? '#0f0f16' : '#ffffff',
    headerText: dark ? '#e6e6e6' : '#2a1faa',
    accent: dark ? '#6f6cff' : '#2a1faa',
    accentOnDarkText: '#ffffff',
    muted: dark ? '#b9b9ff' : '#555555',
    danger: '#ff5a5f',
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      alignItems: 'center',
      padding: 20,
    },
    header: {
      color: palette.headerText,
      fontSize: 26,
      marginTop: 60,
      fontWeight: 'bold',
    },
    emoji: {
      fontSize: 120,
      marginTop: 50,
      // subtle shadow on dark to make emoji pop
      textShadowColor: dark ? 'rgba(0,0,0,0.6)' : undefined,
      textShadowOffset: dark ? { width: 0, height: 3 } : undefined,
      textShadowRadius: dark ? 6 : undefined,
    },
    moodText: {
      color: palette.headerText,
      fontSize: 20,
      marginTop: 12,
    },
    boldText: {
      fontWeight: 'bold',
      color: palette.headerText,
    },
    confidenceText: {
      color: palette.muted,
      fontSize: 16,
      marginTop: 8,
    },
    missingText: {
      color: palette.danger,
      marginTop: 20,
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 50,
      gap: 20,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 10,
      minWidth: 180,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: dark ? palette.accentOnDarkText : '#ffffff',
      fontWeight: 'bold',
      fontSize: 18,
    },
    secondaryButton: {
      backgroundColor: dark ? '#121217' : '#ffffff',
      borderWidth: 2,
      borderColor: palette.accent,
      paddingVertical: 14,
      paddingHorizontal: 36,
      borderRadius: 10,
      minWidth: 180,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: palette.accent,
      fontWeight: 'bold',
      fontSize: 18,
    },
  });
};
