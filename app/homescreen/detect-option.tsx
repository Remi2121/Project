// app/detect-options.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

export default function DetectMoodOptionScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      <Text style={styles.title}>Let’s Find Out Your Mood!</Text>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            Choose how you want to detect your mood</Text>
      {/* mood Animation */}
      <LottieView
        source={require('../../assets/animation/Medit.json')} 
        style={styles.image}
        resizeMode="contain"
        autoPlay
        loop
      />

      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/camera')}>
          <Ionicons name="camera" size={30} color="white"  />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/')}>
          <MaterialIcons name="keyboard-voice" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    backgroundColor: '#0d0b2f',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 30,
    paddingHorizontal: 30,
    lineHeight: 36,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
    
  },
  iconRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '80%',
  marginTop: 40,
},
  iconButton: {
    backgroundColor: '#1f1b5a',
    padding: 20,
    borderRadius: 50,
  },
});
