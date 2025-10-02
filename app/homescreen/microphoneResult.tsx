// microphoneResult.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

export default function MicrophoneResult() {
  const { mood, transcript } = useLocalSearchParams();
  const router = useRouter();

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
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      <Text style={styles.header}>VOICE MOOD DETECTION</Text>

      {moodStr ? <Text style={styles.emoji}>{moodEmojis[moodStr] || '🤔'}</Text>
               : <Text style={styles.errorText}>Mood not detected</Text>}

      <Text style={styles.moodText}>
        Detected Mood: <Text style={styles.boldText}>{moodStr || '—'}</Text>
      </Text>

      {transcriptStr ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>What you said:</Text>
          <Text style={styles.transcriptText}>{transcriptStr}</Text>
        </View>
      ) : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={saveMoodToFirestore}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace({ pathname: '/homescreen/audio' as any })}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  header: { color: '#fff', fontSize: 26, marginTop: 60 },
  emoji: { fontSize: 120, marginTop: 50 },
  errorText: { color: 'red', fontSize: 18, marginBottom: 30 },
  moodText: { color: '#fff', fontSize: 20, marginTop: 20 },
  boldText: { fontWeight: 'bold' },
  transcriptContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
    width: '100%',
    maxWidth: 350,
  },
  transcriptLabel: { color: '#ccc', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  transcriptText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  buttonContainer: { flexDirection: 'column', alignItems: 'center', marginTop: 50, gap: 40 },
  button: { backgroundColor: '#2a1faa', padding: 20, paddingHorizontal: 40, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
});
