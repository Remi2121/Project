// detect-options.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

export default function DetectMoodOptionScreen() {
  const router = useRouter();
  const themeColor = '#2a1faa'; // main theme color

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColor }]}>Let’s Find Out Your Mood!</Text>
      <Text style={[styles.subtitle, { color: themeColor }]}>
        Choose how you want to detect your mood
      </Text>

      {/* mood Animation */}
      <LottieView
        source={require('../../assets/animation/Medit.json')}
        style={styles.image}
        resizeMode="contain"
        autoPlay
        loop
      />

      <View style={styles.iconRow}>
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: themeColor }]}
          onPress={() => router.push({ pathname: '/camera' as any })}
        >
          <Ionicons name="camera" size={30} color={themeColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: themeColor }]}
          onPress={() => router.push({ pathname: '/audio' as any })}
        >
          <MaterialIcons name="keyboard-voice" size={30} color={themeColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    backgroundColor: '#ffffff', // white background
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
    paddingHorizontal: 30,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
    padding: 20,
    borderRadius: 50,
    borderWidth: 2, // outline using theme color
    backgroundColor: '#ffffff', // keep icons visible
  },
});
