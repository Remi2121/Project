// audio.tsx
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../utilis/Settings';

// Use environment variables for API keys
const ASSEMBLY_API_KEY: string = "48ef25c7c2204041a6fef84c3184bf80";

// Emotion detection based on keywords
const detectEmotionFromText = (text: string): string => {
  if (!text) return 'Neutral';
  
  const lowerText = text.toLowerCase();
  
  const emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'joy', 'excited', 'good', 'great', 'wonderful', 'amazing', 'love', 'excellent', 'fantastic', 'smile', 'cheerful', 'delighted', 'content', 'pleased', 'satisfied', 'joyful', 'ecstatic', 'thrilled'],
    sorrow: ['sad', 'unhappy', 'depressed', 'bad', 'terrible', 'awful', 'hate', 'cry', 'miserable', 'upset','lonely', 'heartbroken', 'down', 'gloomy', 'sorrow', 'grief', 'melancholy', 'despair'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'hate', 'rage', 'irritated', 'pissed', 'bitter', 'resentful', 'jealous', 'hostile', 'aggressive', 'outraged', 'fuming', 'livid'],
    anxious: ['anxious', 'nervous', 'worried', 'scared', 'afraid', 'panic', 'stress', 'tense', 'overwhelmed', 'insecure', 'uneasy', 'restless', 'apprehensive', 'fearful', 'terrified', 'dread'],
    calm: ['calm', 'peaceful', 'relaxed', 'chill', 'serene', 'tranquil', 'quiet', 'content', 'balanced', 'grounded', 'soothing', 'composed', 'easygoing', 'placid', 'untroubled'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'speechless', 'wow', 'unbelievable', 'incredible', 'unexpected', 'stunned', 'dumbfounded', 'astounded', 'flabbergasted'],
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return emotion.charAt(0).toUpperCase() + emotion.slice(1);
    }
  }
  
  return 'Neutral';
};

// Upload audio to AssemblyAI
const uploadAudio = async (fileUri: string): Promise<string> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { 
        authorization: ASSEMBLY_API_KEY,
      },
      body: blob,
    });
    
    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }
    
    const json = await uploadRes.json();
    return json.upload_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Audio upload failed: ${error}`);
  }
};

// Request transcription
const requestTranscription = async (audioUrl: string): Promise<string> => {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: ASSEMBLY_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ 
        audio_url: audioUrl,
        language_detection: true
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Transcription request failed: ${response.status}`);
    }
    
    const json = await response.json();
    return json.id;
  } catch (error) {
    console.error('Transcription request error:', error);
    throw new Error(`Transcription request error: ${error}`);
  }
};

// Poll for transcription results
const pollTranscription = async (transcriptId: string): Promise<any> => {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: ASSEMBLY_API_KEY },
      });
      
      if (!res.ok) {
        throw new Error(`Polling failed: ${res.status}`);
      }
      
      const json = await res.json();
      
      if (json.status === 'completed') {
        return json;
      }
      if (json.status === 'error') {
        throw new Error(`Transcription error: ${json.error}`);
      }
      
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Polling error:', error);
      throw new Error(`Polling error: ${error}`);
    }
  }
  
  throw new Error('Transcription timeout');
};

export default function AudioScreen() {
  const router = useRouter();
  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize audio permissions and setup
  useEffect(() => {
    const setupAudio = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Microphone access is required for voice mood detection.');
          return;
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Audio setup error:', error);
        Alert.alert('Error', 'Failed to setup audio.');
      }
    };

    setupAudio();
    
    return () => {
      // Cleanup
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setRecordingDuration(0);
    intervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRecording = async () => {
    if (isBusy) return;
    
    try {
      setIsBusy(true);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingURI(null);
      startTimer();
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Recording failed', 'Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const stopRecording = async () => {
    if (isBusy || !recording) return;
    
    try {
      setIsBusy(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setIsRecording(false);
      setRecording(null);
      stopTimer();
      
      if (!uri) {
        Alert.alert('Recording Error', 'No recording was captured. Please try again.');
        return;
      }
      
      setRecordingURI(uri);
      
      // Reset audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    } finally {
      setIsBusy(false);
    }
  };

  const sendForTranscription = async () => {
    if (!recordingURI) return;
    
    try {
      setIsLoadingTranscript(true);
      const audioUrl = await uploadAudio(recordingURI);
      const transcriptId = await requestTranscription(audioUrl);
      const result = await pollTranscription(transcriptId);
      
      const text = result.text || 'No speech detected.';
      
      // Detect emotion from transcript
      const emotion = detectEmotionFromText(text);
      
      // Navigate directly to microphone result screen
      router.push({
        pathname: '/microphoneResult',
        params: { 
          mood: emotion,
          transcript: text
        }
      });
      
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert(
        'Transcription Error', 
        'Failed to process audio. Please check your connection and try again.'
      );
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = getAudioStyles(isDark);

  return (
    <LinearGradient
      colors={isDark ? ['#07070a', '#121018'] : ['#ffffffff', '#ffffffff']}
      style={[styles.container]}
    >
      <Text style={[styles.title, { color: palette.title }]}>Voice Mood Detection</Text>
      <Text style={[styles.subtitle, { color: palette.subtitle }]}>Record your thoughts to detect your mood</Text>

      {/* Recording Section */}
      {!recordingURI ? (
        <View style={styles.recordingSection}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={[styles.recordButton, isRecording && styles.recordingActive, { borderColor: isRecording ? palette.recordingAccent : 'transparent' }]}
            disabled={isBusy}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={80}
              color={isRecording ? palette.recordingAccent : palette.mic}
            />
            <Text style={[styles.recordButtonText, { color: palette.recordButtonText }]}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.recordingCompleteSection}>
          <Ionicons name="checkmark-circle" size={60} color={palette.success} />
          <Text style={[styles.recordingCompleteText, { color: palette.title }]}>Recording Complete!</Text>
          <Text style={[styles.recordingDuration, { color: palette.subtitle }]}>
            Duration: {formatTime(recordingDuration)}
          </Text>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: palette.recordingAccent }]} />
          <Text style={[styles.recordingTimer, { color: palette.title }]}>
            Recording: {formatTime(recordingDuration)}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {recordingURI && !isLoadingTranscript && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.analyzeButton, { backgroundColor: palette.success }]}
            onPress={sendForTranscription}
            disabled={isLoadingTranscript}
          >
            <Text style={[styles.analyzeButtonText, { color: palette.analyzeButtonText }]}>Analyze Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.retryButton, { borderColor: palette.success, backgroundColor: palette.retryBackground }]}
            onPress={() => {
              setRecordingURI(null);
              setIsRecording(false);
            }}
          >
            <Text style={[styles.retryButtonText, { color: palette.success }]}>Record Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoadingTranscript && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.success} />
          <Text style={[styles.loadingText, { color: palette.subtitle }]}>Analyzing your voice for mood detection...</Text>
        </View>
      )}
    </LinearGradient>
  );
}

/* Palette + styles */
const getPalette = (dark: boolean) => ({
  backgroundStart: dark ? '#07070a' : '#0d0b2f',
  backgroundEnd: dark ? '#121018' : '#2a1faa',
  title: dark ? '#e6e6e6' : '#2a1faa',
  subtitle: dark ? 'rgba(230,230,230,0.85)' : 'rgba(4, 24, 249, 0.9)',
  mic: dark ? '#b9b9ff' : '#4CAF50',               // mic icon color (when idle)
  recordingAccent: '#ff4444',                      // recording red (kept same)
  recordButtonText: dark ? '#ffffff' : '#284fe9ff',
  success: '#4c93afff',                              // analyze button / success color
  analyzeButtonText: '#2a1faa',
  retryBackground: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.2)',
});

/* Styles factory */
const getAudioStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 60,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 10,
    },
    recordingSection: {
      alignItems: 'center',
      flex: 1, 
      justifyContent: 'center',
    },
    recordButton: {
      alignItems: 'center',
      padding: 20,
    },
    recordingActive: {
      backgroundColor: 'rgba(255,68,68,0.08)',
      borderRadius: 50,
    },
    recordButtonText: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: '600',
    },
    recordingCompleteSection: {
      alignItems: 'center',
      marginTop: 50,
    },
    recordingCompleteText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 50,
      marginBottom: 5,
    },
    recordingDuration: {
      fontSize: 16,
      marginTop: 5,
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
    },
    recordingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    recordingTimer: {
      fontSize: 16,
      fontWeight: '600',
    },
    buttonContainer: {
      alignItems: 'center',
      gap: 20,
      marginTop: 30,
    },
    analyzeButton: {
      padding:20,
      borderRadius: 10,
      marginTop: 20,
      minWidth: 160,
      alignItems: 'center',
    },
    analyzeButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    retryButton: {
      padding: 16,
      borderRadius: 10,
      minWidth: 160,
      alignItems: 'center',
      borderWidth: 1,
      marginTop: 10,
    },
    retryButtonText: {
      fontSize: 18,
      fontWeight: '600',
    },
    loadingContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    loadingText: {
      marginTop: 15,
      fontSize: 16,
      textAlign: 'center',
    },
  });
