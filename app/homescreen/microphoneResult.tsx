// microphoneResult.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../utils/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default function MicrophoneResult() {
    const { mood, transcript } = useLocalSearchParams();
    const router = useRouter();
    
    const moodEmojis: Record<string, string> = {
        Joy: '😊',
        Sorrow: '😢',
        Anger: '😠',
        Surprise: '😲',
        Anxious: '😰',
        Calm: '😌',
        Neutral: '😐',
    };

    const moodStr = Array.isArray(mood) ? mood[0] : mood;
    const transcriptStr = Array.isArray(transcript) ? transcript[0] : transcript;

    const saveMoodToFirestore = async () => {
        try {
            await addDoc(collection(db, 'voiceMoods'), {
                mood,
                transcript,
                timestamp: new Date().toISOString(),
                source: 'voice'
            });
            console.log('Voice mood saved to Firestore!');
        } catch (error) {
            console.error('Error saving voice mood:', error);
        }
    };

    return (
        <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
            <Text style={styles.header}>VOICE MOOD DETECTION</Text>
            
            {mood ? (
                <Text style={styles.emoji}>{moodEmojis[moodStr] || '🤔'}</Text>
            ) : (
                <Text style={styles.errorText}>Mood not detected</Text>
            )}
            
            <Text style={styles.moodText}>
                Detected Mood: <Text style={styles.boldText}>{mood}</Text>
            </Text>
            
            {transcript && (
                <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptLabel}>What you said:</Text>
                    <Text style={styles.transcriptText}>{transcriptStr}</Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={async () => {
                        await saveMoodToFirestore();
                        router.push({ 
                            pathname: '/recommendList' as any, 
                            params: { mood, source: 'voice' } 
                        });
                    }}
                >
                    <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => router.replace({ pathname: '/homescreen/audio' as any })}
                >
                    <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        
    },
    header: {
        color: '#fff',
        fontSize: 26,
        marginTop: 60,
    },
    emoji: {
        fontSize: 120,
        marginTop: 50,
    },
    errorText: {
        color: 'red',
        fontSize: 18,
        marginBottom: 30,
    },
    moodText: {
        color: '#fff',
        fontSize: 20,
        marginTop: 20,
    },
    boldText: {
        fontWeight: 'bold',
    },
    transcriptContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 12,
        marginVertical: 20,
        width: '100%',
        maxWidth: 350,
    },
    transcriptLabel: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    transcriptText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 50,
        gap: 40,
    },
    button: {
        backgroundColor: '#2a1faa',
        padding:20,
        paddingHorizontal: 40,
        borderRadius: 10,
        
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
});