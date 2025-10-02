// app/index.tsx (HomeScreen)
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={styles.container}>

      {/* Top Navigation Bar */}
      <LinearGradient
        colors={['#0d0b2f', '#2a1faa']} // Your gradient colors
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

          <TouchableOpacity style={styles.tile} onPress={() => router.push({pathname:'../meditation/stressRelief' as any})}>
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
      </View>
    </View>
    

    
  );
}