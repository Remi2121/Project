import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { db } from "utils/firebaseConfig";
import type { StoredTrack } from 'utils/storageAudio';
import { listTracksByMood } from 'utils/storageAudio';

type MainMood = 'happy' | 'sad' | 'anger' | 'surprise' | 'neutral';

/** cover mapping */
const coverByMood: Record<MainMood, { tamil: any; english: any; default: any }> = {
  happy: {
    english: require('../../assets/covers/happy.png'),
    tamil:   require('../../assets/covers/happy2.png'),
    default: require('../../assets/covers/happy.png'),
  },
  sad: {
    english: require('../../assets/covers/sad2.png'),
    tamil:   require('../../assets/covers/sad.png'),
    default: require('../../assets/covers/sad2.png'),
  },
  anger: {
    english: require('../../assets/covers/anger.png'),
    tamil:   require('../../assets/covers/anger2.png'),
    default: require('../../assets/covers/anger.png'),
  },
  neutral: {
    english: require('../../assets/covers/neutral.png'),
    tamil:   require('../../assets/covers/neutral2.png'),
    default: require('../../assets/covers/neutral2.png'),
  },
  surprise: {
    english: require('../../assets/covers/surprise.png'),
    tamil:   require('../../assets/covers/surprise.png'),
    default: require('../../assets/covers/surprise.png'),
  },
};

/** cover util */
function getCoverFor(mood: MainMood, trackName?: string) {
  const name = (trackName || '').toLowerCase();
  const isTamil = name.includes('tamil');
  const isEnglish = name.includes('english');

  const set = coverByMood[mood];
  if (isTamil) return set.tamil;
  if (isEnglish) return set.english;
  return set.default;
}

export default function Player() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const startName = String(params.name || 'Unknown');
  const mood = (String(params.mood || 'neutral') as MainMood);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);

  const [playlist, setPlaylist] = useState<StoredTrack[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [title, setTitle] = useState<string>(startName);

  // favorites state
  const [isFav, setIsFav] = useState(false);
  const userId = "demoUser"; // 👉 replace with Firebase Auth UID later

  /** helpers */
  const stopAndUnload = async () => {
    if (!soundRef.current) return;
    try { await soundRef.current.stopAsync(); } catch {}
    try { await soundRef.current.unloadAsync(); } catch {}
    soundRef.current = null;
    setIsPlaying(false);
  };

  const handleBack = async () => {
    await stopAndUnload();
    router.push('/(tabs)/explore');
  };

  // audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: false,
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  // Load playlist
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listTracksByMood(mood);
        if (!mounted) return;

        if (!list.length) {
          Alert.alert('No files', `No audio files found in “${mood}/”.`);
          return;
        }

        setPlaylist(list);

        let startIdx = list.findIndex((t) => t.name === startName);
        if (startIdx < 0) startIdx = 0;
        setIndex(startIdx);

        await loadTrack(list[startIdx].url, list[startIdx].name);

        // check favorite status
        checkIfFavorite(list[startIdx].name);
      } catch (e) {
        console.error(e);
        Alert.alert('Playback Error', 'Could not load playlist.');
      }
    })();

    return () => { mounted = false; };
  }, [mood, startName]);

  /** load track but don't auto-play */
  async function loadTrack(url: string, nameForTitle: string) {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, rate }   // no auto play
    );
    soundRef.current = sound;
    setTitle(nameForTitle);
    setIsPlaying(false);

    sound.setOnPlaybackStatusUpdate((s: any) => {
      if (!s?.isLoaded) return;
      setIsPlaying(!!s.isPlaying);
    });
  }

  /** check if current song is in favorites */
  async function checkIfFavorite(trackName: string) {
    const favDoc = doc(db, "Favorites", userId, "songs", trackName);
    const snap = await getDoc(favDoc);
    setIsFav(snap.exists());
  }

  /** toggle favorite */
  async function toggleFavorite(trackName: string) {
    const favDoc = doc(db, "Favorites", userId, "songs", trackName);
    const snap = await getDoc(favDoc);
    if (snap.exists()) {
      await deleteDoc(favDoc);
      setIsFav(false);
      Alert.alert("Removed from Favorites");
    } else {
      await setDoc(favDoc, {
        name: trackName,
        mood,
        createdAt: new Date(),
      });
      setIsFav(true);
      Alert.alert("Added to Favorites ❤️");
    }
  }

  /** add to playlist (default playlist) */
  async function addToPlaylist(trackName: string, url: string) {
    const playlistRef = doc(db, "Playlists", userId, "playlists", "default");
    await updateDoc(playlistRef, {
      songs: arrayUnion({ name: trackName, mood, url })
    }).catch(async () => {
      // if playlist not exist, create it
      await setDoc(playlistRef, {
        title: "My Playlist",
        createdAt: new Date(),
        songs: [{ name: trackName, mood, url }]
      });
    });
    Alert.alert("Added to Playlist ➕");
  }

  async function togglePlay() {
    if (!soundRef.current) return;
    const st = await soundRef.current.getStatusAsync();
    if (!st.isLoaded) return;
    if (st.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }

  async function stop() {
    await stopAndUnload();
  }

  async function changeSpeed(next: number) {
    if (!soundRef.current) return;
    setRate(next);
    await soundRef.current.setRateAsync(next, true);
  }

  async function nextTrack() {
    if (!playlist.length) return;
    const nextIdx = (index + 1) % playlist.length;
    setIndex(nextIdx);
    const t = playlist[nextIdx];
    await loadTrack(t.url, t.name);
    checkIfFavorite(t.name);
  }

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={s.coverWrap}>
        <Image source={getCoverFor(mood, title)} style={s.cover} />
      </View>

      <View style={s.meta}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <Text style={s.subtitle}>{mood.toUpperCase()}</Text>
      </View>

      {/* Actions Row: Fav + Add */}
      <View style={s.actionsRow}>
        <TouchableOpacity onPress={() => toggleFavorite(title)}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={32} color={isFav ? "red" : "white"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          const current = playlist[index];
          if (current) addToPlaylist(current.name, current.url);
        }}>
          <Ionicons name="add-circle-outline" size={32} color="white" />
        </TouchableOpacity>
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

  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginVertical: 20,
  },

  controls: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: { alignItems: 'center' },
  playBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlLabel: { color: '#fff', marginTop: 4, fontSize: 12 },

  speedRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 20 },
  speedPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  speedPillActive: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  speedTxt: { color: '#ffffff' },
  speedTxtActive: { color: '#0b5d34', fontWeight: '700' },
});
