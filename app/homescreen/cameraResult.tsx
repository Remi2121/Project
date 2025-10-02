//cameraResult.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../utils/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default function MoodResult() {
    const { mood, confidence } = useLocalSearchParams();
    const router = useRouter();

    const moodEmojis: Record<string, string> = {
        Joy: '😊',
        Sorrow: '😢',
        Anger: '😠',
        Surprise: '😲',
        Neutral: '😐',
    };

    const moodStr = Array.isArray(mood) ? mood[0] : mood;

    const saveMoodToFirestore = async () => {
  try {
    await addDoc(collection(db, 'moods'), {
      mood,
      confidence,
      timestamp: new Date().toISOString()
    });
    console.log('Mood saved to Firestore!');
  } catch (error) {
    console.error('Error saving mood:', error);
  }
};

    return (
        <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
            <Text style={styles.header}>MOOD DETECTION</Text>

            {mood ? (<Text style={styles.emoji}> {moodEmojis[moodStr] || '🤔'} </Text>
            ) : (
                <Text style={{ color: 'red', marginTop: 20 }}>Mood not detected</Text>
            )}
            
            <Text style={styles.moodText}> Detected Mood: <Text style={{ fontWeight: 'bold' }}>{mood}</Text>
            </Text>
            <Text style={styles.confidenceText}>Confidence: {confidence}</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                style={styles.button} 
                onPress={async () => {
                    await saveMoodToFirestore();
                    router.push({ pathname: '/recommendList' as any, params: { mood } });
                    }}>
                    <Text style={styles.buttonText}>     Confirm     </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => router.replace({pathname:'/camera' as any})}>
                    <Text style={styles.buttonText}>    Try Again    </Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0b2f',
        alignItems: 'center',
        padding: 20
    },
    header: {
        color: '#fff',
        fontSize: 26,
        marginTop: 60
    },
    emoji: {
        fontSize: 120,
        marginTop: 50
    },
    moodText: {
        color: '#fff',
        fontSize: 20,
        marginTop: 20
    },
    confidenceText: {
        color: '#ccc',
        fontSize: 16,
        marginTop: 8
    },
    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 50,
        gap: 40
    },
    button: {
        backgroundColor: '#2a1faa',
        padding: 20,
        borderRadius: 10
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20
    },

});
