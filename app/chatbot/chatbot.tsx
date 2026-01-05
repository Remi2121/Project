import { LinearGradient } from 'expo-linear-gradient';
import type { UnknownOutputParams } from 'expo-router';
import Lottie from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView, // ✅ ADDED
  Platform,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';

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

// THEME imports
import { useSettings } from '../utilis/Settings';
import { getChatbotStyles } from './chatbotstyles';

type Props = { routeParams?: UnknownOutputParams };

const Chatbot: React.FC<Props> = ({ routeParams }) => {
  const router = useRouter();
  const { isDark } = useSettings();
  const styles = getChatbotStyles(isDark);

  // 🔽 Scroll reference (IMPORTANT)
  const scrollRef = useRef<ScrollView>(null);

  const [topic, setTopic] = useState('');
  const [tips, setTips] = useState('');
  const [question] = useState('How are you feeling today?');
  const [loading, setLoading] = useState(false);

  const [recent, setRecent] = useState<
    { id: string; mood: string; tag?: string; createdAt?: Date }[]
  >([]);

  const validMoods = [
    'anxiety','depression','stress','self-care','mindfulness',
    'mental health','wellbeing','coping','therapy','burnout',
    'emotions','mental fitness','resilience','sleep','loneliness',
    'social anxiety','panic attack','self-esteem','sad','alone','happy',
    'angry','frustrated','overwhelmed','nervous','anger','calm','neutral'
  ];

  /** ===== Auth helpers ===== */
  const requireUser = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('NOT_SIGNED_IN');
    return uid;
  };

  const userHistoryColl = () => {
    const uid = requireUser();
    return collection(db, 'users', uid, 'MoodHistory');
  };

  /** ===== Load recent moods ===== */
  const loadRecent = async () => {
    try {
      const qRef = query(userHistoryColl(), orderBy('createdAt', 'desc'));
      const snap = await getDocs(qRef);
      const rows = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          mood: (data.mood ?? '').toString(),
          tag: data.tag,
          createdAt: data.createdAt?.toDate?.(),
        };
      });
      setRecent(rows.slice(0, 5));
    } catch (e) {
      console.log('loadRecent error', e);
    }
  };

  /** ===== Save session ===== */
  const saveSession = async (payload: {
    mood: string;
    tips: string;
    raw?: any;
  }) => {
    await addDoc(userHistoryColl(), {
      mood: payload.mood,
      tag: `mood-${payload.mood}`,
      tips: payload.tips,
      source: 'chatbot',
      createdAt: serverTimestamp(),
      raw: payload.raw ?? null,
    });
  };

  /** ===== Fetch tips ===== */
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

      const res = await fetch('http://10.52.112.146:8000/get_tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: normalizedTopic }),
      });

      const data = await res.json();

      if (typeof data.tips === 'string') {
        const tipsArray = data.tips.split(/\d+\.\s/);
        tipsArray.shift();

        const numberedTips = tipsArray
          .map((tip: string, index: number) => `${index + 1}. ${tip.trim()}`)
          .join('\n\n');

        setTips(numberedTips);

        // ✅ EXISTING AUTO SCROLL (unchanged)
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 300);

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

  /** ===== Auto-run from route param ===== */
  const topicParam =
    typeof routeParams?.topic === 'string' ? routeParams.topic : '';

  useEffect(() => {
    if (topicParam) {
      const normalized = topicParam.trim().toLowerCase();
      setTopic(normalized);

      if (validMoods.includes(normalized)) {
        getTips();
      }
    }
  }, [topicParam]);

  /** ===== Auth listener ===== */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        router.replace('/authpages/Login-page');
      } else {
        loadRecent();
      }
    });
    return unsub;
  }, []);

  return (
    <LinearGradient
      colors={isDark ? ['#0b0b10', '#121018'] : ['#ffffff', '#ffffff']}
      style={styles.gradient}
    >
      {/* ✅ ADDED: KeyboardAvoidingView (wrapper only) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingTop: 50, paddingBottom: 10 }, // ✅ ADDED
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"              // ✅ ADDED
          onContentSizeChange={() =>                // ✅ ADDED
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          <Text style={styles.header}>Your AI Meditation Doctor</Text>

          <Lottie
            source={require('../../assets/animation/doctoranimation.json')}
            autoPlay
            loop
            style={{ height: 300 }}
          />

          <Text style={styles.question}>{question}</Text>

          <TextInput
            style={styles.input}
            placeholder="Describe your feeling..."
            placeholderTextColor={isDark ? '#bdbdbd' : '#2a1faa'}
            value={topic}
            onChangeText={setTopic}
            autoCapitalize="none"
          />

          <Button
            title="Get Tips"
            onPress={getTips}
            color={isDark ? '#6f6cff' : undefined}
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color={isDark ? '#ffffff' : '#2a1faa'}
              style={{ marginTop: 20 }}
            />
          ) : (
            <Text style={styles.tips}>{tips}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default Chatbot;
