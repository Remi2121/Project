
import React, { useState, useEffect, useRef } from 'react';
import {View, StyleSheet, Text, Alert, TouchableOpacity, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const ASSEMBLY_API_KEY = 'c3a5d2f80bf34f659c14f164a4302baf';

const uploadAudio = async (fileUri: string) => {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: { authorization: ASSEMBLY_API_KEY },
    body: blob,
  });
  const json = await uploadRes.json();
  return json.upload_url;
};

const requestTranscription = async (audioUrl: string) => {
  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLY_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ audio_url: audioUrl, }),
  });
  const json = await response.json();
  return json.id;
};

const pollTranscription = async (transcriptId: string) => {
  while (true) {
    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: ASSEMBLY_API_KEY },
    });
    const json = await res.json();
    if (json.status === 'completed') return json;
    if (json.status === 'error') throw new Error(json.error);
    await new Promise((r) => setTimeout(r, 3000));
  }
};

export default function AudioScreen() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [fullTranscriptText, setFullTranscriptText] = useState('');
  const [animatedTranscript, setAnimatedTranscript] = useState('');
  const [detectedEmotion, setDetectedEmotion] = useState('');
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const animateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission required', 'Microphone access denied.');
      }
    })();
    return () => {
      sound?.unloadAsync();
      stopTimer();
      if (animateIntervalRef.current) clearInterval(animateIntervalRef.current);
    };
  }, [sound]);

  useEffect(() => {
    if (sound) {
      const interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if ('isLoaded' in status && status.isLoaded) {
          setPositionMillis(status.positionMillis || 0);
          setDurationMillis(status.durationMillis || 1);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPositionMillis(0);
          }
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [sound]);

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

 const animateTranscriptText = (text: string) => {
    setAnimatedTranscript('');
    let index = 0;
    if (animateIntervalRef.current) clearInterval(animateIntervalRef.current);
    animateIntervalRef.current = setInterval(() => {
      setAnimatedTranscript((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        if (animateIntervalRef.current) clearInterval(animateIntervalRef.current);
      }
    }, 40); // Adjust speed here (ms per char)
  };

  const record = async () => {
    try {
      setIsBusy(true);
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setIsRecording(true);
      setRecordingURI(null);
      setFullTranscriptText('');
      setAnimatedTranscript('');
      setDetectedEmotion('');
      startTimer();
    } catch (e) {
      Alert.alert('Recording failed', String(e));
    } finally {
      setIsBusy(false);
    }
  };

  const stopRecording = async () => {
  try {
    setIsBusy(true);
    await audioRecorder.stop();
    setIsRecording(false);
    stopTimer();
    const uri = audioRecorder.uri;
    if (!uri) {
      Alert.alert('Recording Error', 'No recording URI found.');
      return;
    }
    setRecordingURI(uri);   
  } catch (e) {
    Alert.alert('Failed to stop recording', String(e));
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
    const text = result.text || '';
    setFullTranscriptText(text);
    animateTranscriptText(text);
   
  } catch (e) {
    Alert.alert('Transcription Error', String(e));
  } finally {
    setIsLoadingTranscript(false);
  }
};

  const playPauseToggle = async () => {
    if (!recordingURI) return;
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordingURI });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
      } else {
        const status = await sound.getStatusAsync();
        if ('isLoaded' in status && status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      Alert.alert('Playback error', String(e));
    }
  };

  const seekAudio = async (value: number) => {
    if (sound) await sound.setPositionAsync(value);
  };

  const deleteRecording = async() => {
    sound?.unloadAsync();
    setSound(null);
    setRecordingURI(null);
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(1);
    setFullTranscriptText('');
    setAnimatedTranscript('');
    setDetectedEmotion('');
    Alert.alert('Deleted');
  };

  const formatMillis = (millis: number) => {
    const secs = Math.floor(millis / 1000);
    const mins = (secs / 60) | 0;
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      {!recordingURI ? (
        <TouchableOpacity
          onPress={isRecording ? stopRecording : record}
          style={styles.recordButton}
          disabled={isBusy}
        >
          <Icon
            name={isRecording ? 'pause-circle' : 'microphone'}
            size={64}
            color={isRecording ? '#f00' : '#1fb28a'}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.voiceContainer}>
          <TouchableOpacity onPress={playPauseToggle}>
            <Icon
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={42}
              color="#1fb28a"
            />
          </TouchableOpacity>

          <Slider
            style={styles.voiceSlider}
            minimumValue={0}
            maximumValue={durationMillis}
            value={positionMillis}
            onSlidingComplete={seekAudio}
            minimumTrackTintColor="#1fb28a"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#1fb28a"
          />

          <Text style={styles.timeText}>{formatMillis(positionMillis)}</Text>

          <TouchableOpacity onPress={deleteRecording}>
            <Icon name="trash-can-outline" size={28} color="crimson" />
          </TouchableOpacity>
        </View>
      )}

      {isRecording && (
        <Text style={styles.timer}>
          {formatMillis(recordingDuration * 1000)}
        </Text>
      )}

      {recordingURI && !fullTranscriptText && !isLoadingTranscript && (
  <TouchableOpacity
    style={{
      backgroundColor: '#1fb28a',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 25,
      marginTop: 20,
    }}
    onPress={sendForTranscription}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Send</Text>
  </TouchableOpacity>
)}


      {isLoadingTranscript && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1fb28a" />
          <Text style={{ marginTop: 8, color: '#fff' }}>Fetching transcript...</Text>
        </View>
      )}

      {!isLoadingTranscript && animatedTranscript !== '' && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Transcript:</Text>
          <Text style={styles.transcript}>{animatedTranscript}</Text>
          <Text style={styles.resultLabel}>Detected Emotion:</Text>
          <Text style={styles.emotion}>{detectedEmotion}</Text>
        </View>
      )}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  recordButton: {
    marginBottom: 20,
  },
  timer: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  voiceSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    width: 40,
    textAlign: 'center',
  },
  resultBox: {
  marginTop: 30,
  padding: 16,
  backgroundColor: '#fff',
  borderRadius: 20,
  width: '100%',
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  elevation: 3,
},

resultLabel: {
  fontSize: 16,
  fontWeight: 'bold',
  marginTop: 8,
  marginBottom: 4,
  color: '#1f1f1f',
},

transcript: {
  fontSize: 14,
  color: '#333',
  lineHeight: 20,
},

emotion: {
  fontSize: 16,
  color: '#6a1b9a',
  fontWeight: '600',
  marginTop: 4,
},
loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },

});
