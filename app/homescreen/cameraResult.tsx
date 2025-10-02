// cameraResult.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

export default function MoodResult() {
  const { mood, confidence } = useLocalSearchParams();
  const router = useRouter();

  // Normalize router params to strings
  const moodRaw = Array.isArray(mood) ? mood[0] : (mood ?? '');
  const confRaw = Array.isArray(confidence) ? confidence[0] : (confidence ?? '');

  // UI emoji map (camera labels)
  const moodEmojis: Record<string, string> = {
    Joy: '😊',
    Sorrow: '😢',
    Anger: '😠',
    Surprise: '😲',
    Neutral: '😐',
  };

  // Map camera labels -> app mood keys
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

  // Confidence as number or null (never undefined)
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
        moodOriginal: moodRaw,     // e.g. "Joy" from camera
        mood: normalizedMood,      // e.g. "happy" for app
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
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      <Text style={styles.header}>DETECT MOOD</Text>

      {moodRaw ? (
        <Text style={styles.emoji}>{moodEmojis[moodRaw] || '🤔'}</Text>
      ) : (
        <Text style={{ color: 'red', marginTop: 20 }}>Mood not detected</Text>
      )}

      <Text style={styles.moodText}>
        Detected Mood: <Text style={{ fontWeight: 'bold' }}>{moodRaw || '—'}</Text>
      </Text>

      <Text style={styles.moodText}>
        Normalized: <Text style={{ fontWeight: 'bold' }}>{normalizedMood}</Text>
      </Text>

      <Text style={styles.confidenceText}>Confidence: {formatConfidence(confRaw)}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={saveMoodToFirestore}>
          <Text style={styles.buttonText}>     Confirm     </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.replace({ pathname: '/camera' as any })}>
          <Text style={styles.buttonText}>    Try Again    </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function formatConfidence(v: any) {
  if (v == null) return '—';
  const n = Number(Array.isArray(v) ? v[0] : v);
  if (!Number.isFinite(n)) return String(v);
  return n >= 0 && n <= 1 ? `${Math.round(n * 100)}%` : `${n}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0b2f', alignItems: 'center', padding: 20 },
  header: { color: '#fff', fontSize: 26, marginTop: 60 },
  emoji: { fontSize: 120, marginTop: 50 },
  moodText: { color: '#fff', fontSize: 20, marginTop: 12 },
  confidenceText: { color: '#ccc', fontSize: 16, marginTop: 8 },
  buttonContainer: { flexDirection: 'column', alignItems: 'center', marginTop: 50, gap: 40 },
  button: { backgroundColor: '#2a1faa', padding: 20, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
});
