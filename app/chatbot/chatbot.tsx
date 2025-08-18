import { LinearGradient } from 'expo-linear-gradient';
import type { UnknownOutputParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Lottie from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { db } from 'utils/firebaseConfig'; // your firebase config import
import styles from './chatbotstyles';

type Props = {
  routeParams?: UnknownOutputParams;
};

const Chatbot: React.FC<Props> = ({ routeParams }) => {
  const [topic, setTopic] = useState('');
  const [tips, setTips] = useState('');
  const [question] = useState('How are you feeling today?');
  const [loading, setLoading] = useState(false);

  const validMoods = [
    "anxiety", "depression", "stress", "self-care", "mindfulness",
    "mental health", "wellbeing", "coping", "therapy", "burnout",
    "emotions", "mental fitness", "resilience", "sleep", "loneliness",
    "social anxiety", "panic attack", "self-esteem", "sad", "alone", "happy",
    "angry", "frustrated", "overwhelmed", "nervous","anger"
  ];

  const getTips = async () => {
    setLoading(true);
    setTips('');

    const normalizedTopic = topic.trim().toLowerCase();

    if (!validMoods.includes(normalizedTopic)) {
      setTips("This is not a mental health related mood.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://192.168.8.158:8000/get_tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: normalizedTopic }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('JSON parse error:', err, 'Raw response:', text);
        setTips('Server returned invalid JSON.');
        setLoading(false);
        return;
      }

      if (typeof data.tips === 'string') {
        const tipsArray = data.tips.split(/\d+\.\s/);
        tipsArray.shift();
        const numberedTips = tipsArray
          .map((tip: string, index: number) => `${index + 1}. ${tip.trim()}`)
          .join('\n\n');

        setTips(numberedTips);

        // Save mood + tips to Firestore collection "MoodHistory"
        try {
          await addDoc(collection(db, 'MoodHistory'), {
            mood: normalizedTopic,
            tips: numberedTips,
            createdAt: serverTimestamp(),
          });
          console.log('Mood saved to Firestore');
        } catch (firestoreError) {
          console.error('Error saving mood to Firestore:', firestoreError);
        }
      } else {
        setTips('This is not a mental health related concept.');
      }
    } catch (err) {
      console.error(err);
      setTips('Error fetching tips.');
    }

    setLoading(false);
  };

  // 🔁 Automatically fetch tips if topic is passed in routeParams
  const topicParam = typeof routeParams?.topic === 'string' ? routeParams.topic : '';

  useEffect(() => {
    if (topicParam) {
      const normalized = topicParam.trim().toLowerCase();
      setTopic(normalized);

      if (validMoods.includes(normalized)) {
        getTips();
      } else {
        setTips("This is not a mental health related mood.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam]);

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
