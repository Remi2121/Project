// app/index.tsx (HomeScreen)
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './homestyles';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const mood = typeof params.mood === 'string' ? params.mood : null;

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
    <LinearGradient colors={['#0e0e13ff', '#2a1faa']} style={styles.container}>

      {/* Login Button - Top Right Corner */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 60,       // distance from top (adjust for status bar)
          right: 20,     // distance from right edge
          backgroundColor: '#2f03cbff',
          paddingVertical: 8,
          paddingHorizontal: 15,
          borderRadius: 8,
          zIndex: 10,
        }}
        onPress={() => router.push('../authpages/Login-page')}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Login</Text>
      </TouchableOpacity>

      {/* Greeting & Mood */}
      <Text style={styles.greeting}>{getGreeting()},</Text>
      <Text style={styles.username}>User! 👋</Text>
      <Text style={styles.subtitle}>{moodSummary}</Text>

      {/* Detect Mood Button */}
      <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/detect-options')}>
        <Text style={styles.icon}>🎭</Text>
        <Text style={styles.mainText}>Detect Mood</Text>
      </TouchableOpacity>

      {/* Grid Buttons */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.tile} onPress={() => router.push('/explore')}>
          <Text style={styles.icon}>🎵</Text>
          <Text style={styles.tileText}>Music</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push('/explore')}>
          <Text style={styles.icon}>🧘</Text>
          <Text style={styles.tileText}>Meditation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push('/journal')}>
          <Text style={styles.icon}>📘</Text>
          <Text style={styles.tileText}>Mood Journal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push('/(tabs)/mood_trends')}>
          <Text style={styles.icon}>📈</Text>
          <Text style={styles.tileText}>Mood Trends</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
