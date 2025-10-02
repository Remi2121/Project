import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Lottie from 'lottie-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { UnknownOutputParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from 'utils/firebaseConfig';
import { listTracksByMood, type StoredTrack } from 'utils/storageAudio';
import styles from '../explore/explorestyles';

/** ===== MAIN MOODS ===== */
const MAIN_MOODS = ['happy', 'sad', 'anger', 'surprise', 'neutral'] as const;
type MainMood = typeof MAIN_MOODS[number];

const moodLabels: Record<MainMood, string> = {
  happy: 'Happy', sad: 'Sad', anger: 'Anger', surprise: 'Surprise', neutral: 'Neutral',
};
const moodEmoji: Record<MainMood, string> = {
  happy: '😊', sad: '😢', anger: '😠', surprise: '😲', neutral: '😐',
};
const emojiToMood: Record<string, MainMood> = {
  '😊':'happy','😐':'neutral','😢':'sad','😡':'anger','😠':'anger','😲':'surprise','🥱':'neutral','🤒':'neutral',
};

/** ===== COVER IMAGES (two variants per mood) ===== */
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

/** Decide cover by mood + actual file name (from Firebase Storage). */
function getCoverFor(mood: MainMood, trackName?: string) {
  const name = (trackName || '').toLowerCase();

  const isTamil =
    name.includes('tamil') || /\bta\b|_ta\b|\.ta\b/.test(name);
  const isEnglish =
    name.includes('english') || /\ben(g|glish)?\b|_en\b|\.en\b/.test(name);

  const set = coverByMood[mood];
  if (isTamil) return set.tamil;
  if (isEnglish) return set.english;
  return set.default;
}

/** ===== In-memory cache so results persist across back/forward ===== */
const TRACKS_CACHE: Partial<Record<MainMood, StoredTrack[]>> = {};

async function getTracksCached(mood: MainMood): Promise<StoredTrack[]> {
  if (TRACKS_CACHE[mood]) {
    return TRACKS_CACHE[mood]!;
  }
  const list = await listTracksByMood(mood);
  TRACKS_CACHE[mood] = list;
  return list;
}

function normalizeToMainMood(input: string): MainMood | null {
  if (!input) return null;
  const raw = input.trim(); const lower = raw.toLowerCase();
  if ((MAIN_MOODS as readonly string[]).includes(lower)) return lower as MainMood;
  if (emojiToMood[raw]) return emojiToMood[raw];
  if (['joy','happiness','happy'].includes(lower)) return 'happy';
  if (['sad','sorrow'].includes(lower)) return 'sad';
  if (['anger','angry','mad'].includes(lower)) return 'anger';
  if (['surprised','surprise','wow'].includes(lower)) return 'surprise';
  if (['neutral','ok','okay','fine','normal'].includes(lower)) return 'neutral';
  return null;
}

type Props = { routeParams?: UnknownOutputParams };

const Explore: React.FC<Props> = ({ routeParams }) => {
  const router = useRouter();
  const [moodInput, setMoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<StoredTrack[]>([]);
  const [suggestions, setSuggestions] = useState<Record<MainMood, StoredTrack[]>>({
    happy: [], sad: [], anger: [], surprise: [], neutral: [],
  });
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<MainMood | null>(null);

  const moodParamRaw = typeof routeParams?.mood === 'string' ? String(routeParams!.mood) : '';
  const moodFromParam = useMemo(() => normalizeToMainMood(moodParamRaw), [moodParamRaw]);

  // Prefill suggestions for all moods (from cache if available; fetch otherwise)
  useEffect(() => {
    (async () => {
      try {
        setSuggestionsLoading(true);
        const entries = await Promise.all(
          MAIN_MOODS.map(async (m) => [m, await getTracksCached(m)] as const)
        );
        const map = { ...suggestions };
        entries.forEach(([m, tracks]) => { (map as any)[m] = tracks; });
        setSuggestions(map as Record<MainMood, StoredTrack[]>);
      } finally { setSuggestionsLoading(false); }
    })();
  }, []);

  // If opened with ?mood=... param, load that mood (from cache)
  useEffect(() => {
    if (moodFromParam) {
      setMoodInput(moodFromParam);
      void fetchFromStorage(moodFromParam);
    }
  }, [moodFromParam]);

  async function logMood(mainMood: MainMood) {
    try { await addDoc(collection(db, 'MoodHistory'), { mood: mainMood, createdAt: serverTimestamp() }); }
    catch (e) { console.warn('Failed to log MoodHistory:', e); }
  }

  async function fetchFromStorage(mainMood: MainMood) {
    try {
      setLoading(true);
      const tracks = await getTracksCached(mainMood); // <-- use cache
      setSearchResults(tracks);
      setCurrentMood(mainMood);
      await logMood(mainMood);
      if (!tracks.length) Alert.alert('No Results', `No audio files found in "${mainMood}/" folder.`);
    } catch (e: any) {
      console.error(e); Alert.alert('Error', e?.code || 'Could not fetch audio from Firebase Storage.');
    } finally { setLoading(false); }
  }

  async function onSearchPress() {
    const normalized = normalizeToMainMood(moodInput);
    if (!normalized) { Alert.alert('Unknown mood', 'Type happy/sad/anger/surprise/neutral or use emoji 😊 😢 😠 😲 😐'); return; }
    await fetchFromStorage(normalized);
  }

  // Navigate helper (RAW URL — no encode)
  function openPlayer(track: StoredTrack, mood: MainMood | null) {
    const m = mood ?? 'neutral';
    router.push({
      pathname: '/explore/player',
      params: {
        path: `${m}/${track.name}`,
        name: track.name,
        mood: m,
      },
    });
  }

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>

      {/* ✅ Added Favorites + Playlist buttons */}
      


      <Image source={require('../../assets/images/bg.png')} style={styles.bgImage} />

      <View style={{flexDirection:"row", justifyContent:"flex-end", paddingTop:40, paddingHorizontal:16}}>
        <TouchableOpacity onPress={()=>router.push("/explore/favorites")} style={{marginRight:20}}>
        <Ionicons name="heart" size={26} color="red"/>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>router.push("/explore/playlist")}>
      <Ionicons name="musical-notes" size={26} color="white"/>
      </TouchableOpacity>
   </View>
      <View style={styles.logoContainer}>
        <Lottie source={require('../../assets/animation/explorelogo.json')} autoPlay loop style={styles.logo} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.textContainer}>
          <Text style={styles.headerinput}>Search Mood</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Type mood or emoji (😊 😢 😠 😲 😐)"
              placeholderTextColor="white"
              value={moodInput}
              onChangeText={setMoodInput}
            />
            <TouchableOpacity onPress={onSearchPress} style={{ padding: 10 }}>
              <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator size="small" color="black" style={{ marginTop: 20 }} />}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsHeader}>Search Results</Text>
              {searchResults.map((t, idx) => (
                <TouchableOpacity key={idx} onPress={() => openPlayer(t, currentMood)}>
                  <LinearGradient colors={['#0d0b2f', '#2a5faa']} style={styles.playlistCard}>
                    {currentMood && (
                      <Image
                        source={getCoverFor(currentMood, t.name)}
                        style={styles.playlistImageLarge}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.playlistNameLarge}>{t.name}</Text>
                    <Text style={styles.playlistTapText}>Tap to Open Player</Text>
                    <Ionicons name="open-outline" size={28} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Suggestions */}
          <Text style={styles.suggestionsHeader}>Suggestions</Text>
          {suggestionsLoading && <ActivityIndicator size="small" color="white" style={{ marginTop: 10 }} />}

          {MAIN_MOODS.map((mood) => (
            <View key={mood} style={styles.moodSectionContainer}>
              <Text style={styles.moodSectionTitle}>{moodLabels[mood]} {moodEmoji[mood]}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScrollView}>
                {(suggestions[mood] || []).map((t, idx) => (
                  <TouchableOpacity key={idx} onPress={() => openPlayer(t, mood)}>
                    <LinearGradient colors={['#0d0b2f', '#2a5faa']} style={styles.playlistCardSmall}>
                      <Image
                        source={getCoverFor(mood, t.name)}
                        style={styles.playlistImageSmall}
                        resizeMode="cover"
                      />
                      <Text numberOfLines={2} style={styles.playlistNameSmall}>{t.name}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}

                {(!suggestions[mood] || suggestions[mood].length === 0) && (
                  <View style={[styles.playlistCardSmall, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Image
                      source={coverByMood[mood].default}
                      style={styles.playlistImageSmall}
                      resizeMode="cover"
                    />
                    <Text style={{ color: 'white', opacity: 0.7, marginTop: 6 }}>No files in “{mood}/”</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Explore;
