// app/index.tsx (HomeScreen)
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

// 🔥 THEME
import { useSettings } from '../utilis/Settings';
import getHomeStyles from './homestyles';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [username, setUsername] = useState('User');

  // 🔥 Theme state from global settings
  const { isDark } = useSettings();
  const styles = getHomeStyles(isDark);

  const mood = typeof params.mood === 'string' ? params.mood : null;

  // 🔐 Load username from Auth or Firestore
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUsername('User');
        return;
      }

      if (u.displayName && u.displayName.trim()) {
        setUsername(u.displayName.trim());
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.exists() ? snap.data() : null;
        if (data?.username) {
          setUsername(String(data.username));
          return;
        }
      } catch {}

      if (u.email) {
        setUsername(u.email.split('@')[0]);
      } else {
        setUsername('User');
      }
    });

    return unsub;
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const moodSummary = mood
    ? `You seem ${mood.toLowerCase()}`
    : "Let's check your mood";

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <LinearGradient
        colors={
          isDark
            ? ['#050509', '#141327'] // 🔥 Dark mode gradient
            : ['#0d0b2f', '#2a1faa'] // 🔆 Light mode gradient (original)
        }
        style={styles.navBar}
      >
        {/* App Name */}
        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>Moodify</Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={() => router.push('../authpages/Login-page')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Greeting & Mood */}
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.username}>{username}! 👋</Text>
        <Text style={styles.subtitle}>{moodSummary}</Text>

        {/* Detect Mood Button */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.push('/detect-options')}
        >
          <Text style={styles.icon}>🎭</Text>
          <Text style={styles.mainText}>Detect Mood</Text>
        </TouchableOpacity>

        {/* Grid Buttons */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.icon}>🎵</Text>
            <Text style={styles.tileText}>Music</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() =>
              router.push({ pathname: '../meditation/stressRelief' as any })
            }
          >
            <Text style={styles.icon}>🧘</Text>
            <Text style={styles.tileText}>Meditation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push('/journal')}
          >
            <Text style={styles.icon}>📘</Text>
            <Text style={styles.tileText}>Mood Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push('/(tabs)/mood_trends')}
          >
            <Text style={styles.icon}>📈</Text>
            <Text style={styles.tileText}>Mood Trends</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
