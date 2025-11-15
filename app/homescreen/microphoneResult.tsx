// microphoneResult.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';
import { useSettings } from '../utilis/Settings';

export default function MicrophoneResult() {
  const { mood, transcript } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useSettings();
  const palette = getPalette(isDark);
  const styles = getMicrophoneStyles(isDark);

  const moodStr = Array.isArray(mood) ? mood[0] : (mood ?? '');
  const transcriptStr = Array.isArray(transcript) ? transcript[0] : (transcript ?? '');

  const moodEmojis: Record<string, string> = {
    Joy: '😊', Sorrow: '😢', Anger: '😠', Surprise: '😲',
    Anxious: '😰', Calm: '😌', Neutral: '😐',
  };

  const normalizeToAppMood = (m: string) => {
    const k = (m || '').trim().toLowerCase();
    if (k === 'joy') return 'happy';
    if (k === 'sorrow') return 'sad';
    if (k === 'anger') return 'angry';
    if (k === 'surprise') return 'surprise';
    if (k === 'neutral') return 'neutral';
    if (k === 'anxious') return 'anxious';
    if (k === 'calm') return 'calm';
    return 'neutral';
  };
  const normalizedMood = normalizeToAppMood(moodStr);

  const saveMoodToFirestore = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login required', 'Please sign in to save your mood.', [
        { text: 'OK', onPress: () => router.replace('/authpages/Login-page') },
      ]);
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'MoodHistory'), {
        moodOriginal: moodStr,       // what the voice model returned
        mood: normalizedMood,        // your app key
        transcript: transcriptStr || '',
        source: 'voice',
        createdAt: serverTimestamp(),
      });

      router.push({
        pathname: '/recommendList' as any,
        params: { mood: normalizedMood, source: 'voice' },
      });
    } catch (error: any) {
      console.error('Error saving voice mood:', error);
      Alert.alert('Error', error?.message ?? 'Failed to save mood.');
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#07070a', '#121018'] : ['#0d0b2f', '#2a1faa']}
      style={[styles.container]}
    >
      <Text style={[styles.header, { color: palette.header }]}>VOICE MOOD DETECTION</Text>

      {moodStr ? (
        <Text style={[styles.emoji]}>{moodEmojis[moodStr] || '🤔'}</Text>
      ) : (
        <Text style={[styles.errorText, { color: palette.error }]}>Mood not detected</Text>
      )}

      <Text style={[styles.moodText, { color: palette.text }]}>
        Detected Mood: <Text style={[styles.boldText, { color: palette.text }]}>{moodStr || '—'}</Text>
      </Text>

      {transcriptStr ? (
        <View style={[styles.transcriptContainer, { backgroundColor: palette.transcriptBg }]}>
          <Text style={[styles.transcriptLabel, { color: palette.muted }]}>What you said:</Text>
          <Text style={[styles.transcriptText, { color: palette.text }]}>{transcriptStr}</Text>
        </View>
      ) : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: palette.accent }]} onPress={saveMoodToFirestore}>
          <Text style={[styles.buttonText, { color: palette.buttonText }]}>Confirm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: palette.secondary }]}
          onPress={() => router.replace({ pathname: '/homescreen/audio' as any })}
        >
          <Text style={[styles.buttonText, { color: palette.buttonText }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* Palette helper */
const getPalette = (dark: boolean) => ({
  header: dark ? '#e6e6e6' : '#ffffff',
  text: dark ? '#e6e6e6' : '#ffffff',
  muted: dark ? '#bdbddf' : 'rgba(255,255,255,0.85)',
  accent: dark ? '#6f6cff' : '#2a1faa',
  secondary: dark ? 'rgba(111,108,255,0.12)' : 'rgba(255,255,255,0.18)',
  buttonText: '#ffffff',
  transcriptBg: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
  error: '#ff6b6b',
});

/* Styles */
const getMicrophoneStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center', padding: 20 },
    header: { fontSize: 26, marginTop: 60, fontWeight: '700' },
    emoji: { fontSize: 120, marginTop: 50 },
    errorText: { fontSize: 18, marginBottom: 30 },
    moodText: { fontSize: 20, marginTop: 20 },
    boldText: { fontWeight: '700' },
    transcriptContainer: {
      padding: 15,
      borderRadius: 12,
      marginVertical: 20,
      width: '100%',
      maxWidth: 350,
    },
    transcriptLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    transcriptText: { fontSize: 16, lineHeight: 22 },
    buttonContainer: { flexDirection: 'column', alignItems: 'center', marginTop: 50, gap: 20 },
    button: {
      padding: 16,
      paddingHorizontal: 40,
      borderRadius: 10,
      minWidth: 180,
      alignItems: 'center',
    },
    buttonText: { fontWeight: '700', fontSize: 18 },
  });
