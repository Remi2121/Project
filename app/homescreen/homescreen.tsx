import { Text, View, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from './homestyles'; 
import { LinearGradient } from 'expo-linear-gradient';


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

  const moodSummary = mood ? `You seem ${mood.toLowerCase()}` : `Let's check your mood`;

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>

      <Text style={styles.greeting}>{getGreeting()},</Text>
      <Text style={styles.username}>User! 👋</Text>
      <Text style={styles.subtitle}>{moodSummary}</Text>

      <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/')}>
        <Text style={styles.icon}>🎭</Text>
        <Text style={styles.mainText}>Detect Mood</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.tile} onPress={() => router.push('/explore')}>
          <Text style={styles.icon}>🎵</Text>
          <Text style={styles.tileText}>Music</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push('/explore')}>
          <Text style={styles.icon}>🧘</Text>
          <Text style={styles.tileText}>Meditation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push('/')}>
          <Text style={styles.icon}>📘</Text>
          <Text style={styles.tileText}>Mood Journal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push('/explore')}>
          <Text style={styles.icon}>📈</Text>
          <Text style={styles.tileText}>Mood Trends</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
