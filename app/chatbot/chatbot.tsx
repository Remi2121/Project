import { LinearGradient } from 'expo-linear-gradient';
import type { UnknownOutputParams } from 'expo-router';
import Lottie from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, Text, TextInput } from 'react-native';
import styles from './chatbotstyles';

import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from 'utils/firebaseConfig';

type Props = { routeParams?: UnknownOutputParams };

const Chatbot: React.FC<Props> = ({ routeParams }) => {
  const router = useRouter();

  // NOTE: still using "topic" for input state, but we will SAVE as "mood"
  const [topic, setTopic] = useState('');
  const [tips, setTips] = useState('');
  const [question] = useState('How are you feeling today?');
  const [loading, setLoading] = useState(false);

  // recent from MoodHistory (per user)
  const [recent, setRecent] = useState<{ id: string; mood: string; tag?: string; createdAt?: Date }[]>([]);

  const validMoods = [
    "anxiety","depression","stress","self-care","mindfulness",
    "mental health","wellbeing","coping","therapy","burnout",
    "emotions","mental fitness","resilience","sleep","loneliness",
    "social anxiety","panic attack","self-esteem","sad","alone","happy",
    "angry","frustrated","overwhelmed","nervous","anger","calm","neutral"
  ];

  /** ===== Helpers: user-scoped paths ===== */
  const requireUser = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('NOT_SIGNED_IN');
    return uid;
  };
  const userHistoryColl = () => {
    const uid = requireUser();
    return collection(db, 'users', uid, 'MoodHistory');
  };

  /** ===== Load recent (reads mood field, not topic) ===== */
  const loadRecent = async () => {
    try {
      const qRef = query(userHistoryColl(), orderBy('createdAt', 'desc'));
      const snap = await getDocs(qRef);
      const rows = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          mood: (data.mood ?? data.topic ?? '').toString(),
          tag: data.tag ?? undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
        };
      });
      setRecent(rows.slice(0, 5));
    } catch (e: any) {
      console.log('loadRecent error:', e?.message ?? e);
    }
  };

  /** ===== Save one session per user ===== */
  const saveSession = async (payload: {
    mood: string;     // normalized mood key (e.g., "sad")
    tips: string;
    raw?: any;
  }) => {
    await addDoc(userHistoryColl(), {
      mood: payload.mood,               // <- main field
      tag: `mood-${payload.mood}`,      // <- "mood-sad" like you asked
      tips: payload.tips,
      source: 'chatbot',
      createdAt: serverTimestamp(),
      raw: payload.raw ?? null,
    });
  };

  /** ===== Fetch tips & store per user ===== */
  const getTips = async () => {
    setLoading(true);
    setTips('');

    const normalizedTopic = topic.trim().toLowerCase();

    if (!validMoods.includes(normalizedTopic)) {
      setTips('This is not a mental health related mood.');
      setLoading(false);
      return;
    }

    try {
      try {
        requireUser();
      } catch {
        Alert.alert('Login required', 'Please sign in to use the chatbot.', [
          { text: 'OK', onPress: () => router.replace('/authpages/Login-page') },
        ]);
        setLoading(false);
        return;
      }

      const res = await fetch('http://192.168.8.158:8000/get_tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: normalizedTopic }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('JSON parse error:', err, 'Raw response:', text);
        setTips('Server returned invalid JSON.');
        setLoading(false);
        return;
      }

      if (typeof data.tips === 'string') {
        // make numbered list
        const tipsArray = data.tips.split(/\d+\.\s/);
        tipsArray.shift();
        const numberedTips = tipsArray
          .map((tip: string, index: number) => `${index + 1}. ${tip.trim()}`)
          .join('\n\n');

        setTips(numberedTips);

        // 🔐 Save using "mood" + "mood-<mood>" tag
        await saveSession({
          mood: normalizedTopic,
          tips: numberedTips,
          raw: data,
        });

        loadRecent();
      } else {
        setTips('This is not a mental health related concept.');
      }
    } catch (err) {
      console.error(err);
      setTips('Error fetching tips.');
    } finally {
      setLoading(false);
    }
  };

  /** ===== Auto-run by route param ===== */
  const topicParam = typeof routeParams?.topic === 'string' ? routeParams.topic : '';
  useEffect(() => {
    if (topicParam) {
      const normalized = topicParam.trim().toLowerCase();
      setTopic(normalized);

      if (validMoods.includes(normalized)) {
        getTips();
      } else {
        setTips('This is not a mental health related mood.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam]);

  /** ===== Ensure user present & load recent once ===== */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.replace('/authpages/Login-page');
      } else {
        loadRecent();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
      <Image source={require('../../assets/images/bg.png')} style={styles.bgImage} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Your AI Meditation Doctor</Text>
        <Lottie
          source={require('../../assets/animation/doctoranimation.json')}
          autoPlay
          loop
          style={{ height: 200 }}
        />
        <Text style={styles.question}>{question}</Text>

        <TextInput
          style={styles.input}
          placeholder="Describe your feeling..."
          value={topic}
          onChangeText={setTopic}
          placeholderTextColor="white"
          autoCapitalize="none"
        />

        <Button title="Get Tips" onPress={getTips} />

        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
        ) : (
          <Text style={styles.tips}>{tips}</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default Chatbot;
