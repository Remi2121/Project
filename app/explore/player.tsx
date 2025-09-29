import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { StoredTrack } from 'utils/storageAudio';
import { listTracksByMood } from 'utils/storageAudio'; // ✅ use storage helper

type MainMood = 'happy' | 'sad' | 'anger' | 'surprise' | 'neutral';

const moodCovers: Record<MainMood, any> = {
  happy: require('../../assets/covers/happy.png'),
  sad: require('../../assets/covers/sad.png'),
  anger: require('../../assets/covers/anger.png'),
  surprise: require('../../assets/covers/surprise.png'),
  neutral: require('../../assets/covers/neutral.png'),
};

export default function Player() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // We get the starting track name + mood
  const startName = String(params.name || 'Unknown');
  const mood = (String(params.mood || 'neutral') as MainMood);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);

  // playlist & index
  const [playlist, setPlaylist] = useState<StoredTrack[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [title, setTitle] = useState<string>(startName);

  // audio mode (safe fields)
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: false,
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  // Load playlist for this mood, then play the selected (or first) track
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listTracksByMood(mood); // read from Storage (URLs resolved)
        if (!mounted) return;

        if (!list.length) {
          Alert.alert('No files', `No audio files found in “${mood}/”.`);
          return;
        }

        setPlaylist(list);

        let startIdx = list.findIndex((t) => t.name === startName);
        if (startIdx < 0) startIdx = 0;
        setIndex(startIdx);

        await loadAndPlay(list[startIdx].url, list[startIdx].name);
      } catch (e) {
        console.error(e);
        Alert.alert('Playback Error', 'Could not load playlist.');
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, startName]);

  async function loadAndPlay(url: string, nameForTitle: string) {
    // cleanup previous
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {}
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, rate } // keep current speed
    );
    soundRef.current = sound;
    setTitle(nameForTitle);
    setIsPlaying(true);

    sound.setOnPlaybackStatusUpdate((s: any) => {
      if (!s?.isLoaded) return;
      setIsPlaying(!!s.isPlaying);
    });
  }

  async function togglePlay() {
    if (!soundRef.current) return;
    const st = await soundRef.current.getStatusAsync();
    if (!st.isLoaded) return;
    if (st.isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  }

  async function stop() {
    if (!soundRef.current) return;
    await soundRef.current.stopAsync();
    await soundRef.current.setPositionAsync(0);
  }

  async function changeSpeed(next: number) {
    if (!soundRef.current) return;
    setRate(next);
    await soundRef.current.setRateAsync(next, true); // correct pitch
  }

  // ✅ NEXT button handler
  async function nextTrack() {
    if (!playlist.length) return;
    const nextIdx = (index + 1) % playlist.length;
    setIndex(nextIdx);
    const t = playlist[nextIdx];
    await loadAndPlay(t.url, t.name);
  }

  // (optional) Prev if you want later:
  // async function prevTrack() { ... }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={s.coverWrap}>
        <Image source={moodCovers[mood]} style={s.cover} />
      </View>

      <View style={s.meta}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <Text style={s.subtitle}>{mood.toUpperCase()}</Text>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity style={s.iconBtn} onPress={stop}>
          <Ionicons name="stop-circle" size={38} color="#fff" />
          <Text style={s.ctrlLabel}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.playBtn} onPress={togglePlay}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#1c54e2ff" />
        </TouchableOpacity>

        {/* ✅ NEXT button */}
        <TouchableOpacity style={s.iconBtn} onPress={nextTrack}>
          <Ionicons name="play-skip-forward" size={38} color="#fff" />
          <Text style={s.ctrlLabel}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Speed pills */}
      <View style={s.speedRow}>
        {[0.75, 1.0, 1.25, 1.5].map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.speedPill, rate === r && s.speedPillActive]}
            onPress={() => changeSpeed(r)}
          >
            <Text style={[s.speedTxt, rate === r && s.speedTxtActive]}>{r}x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },

  coverWrap: { marginTop: 24, alignItems: 'center' },
  cover: { width: 280, height: 280, borderRadius: 12 },

  meta: { marginTop: 18, alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#ccead7', marginTop: 4 },

  controls: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // a bit tighter to fit 3 buttons
  },
  iconBtn: { alignItems: 'center' },
  playBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlLabel: { color: '#fff', marginTop: 4, fontSize: 12 },

  speedRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 50 },
  speedPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  speedPillActive: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  speedTxt: { color: '#ffffff' },
  speedTxtActive: { color: '#0b5d34', fontWeight: '700' },
});
