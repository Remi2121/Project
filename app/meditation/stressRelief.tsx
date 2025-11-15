// MeditationListScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

// ====== Filesystem & Auth ======
import * as FileSystem from "expo-file-system";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../utils/firebaseConfig";

// theme hook
import { useSettings } from "../utilis/Settings";

// --- Stress audio imports ---
import birds_singing from "../../assets/audio/stress/birds_singing.mp3";
import calm_water from "../../assets/audio/stress/calm_water.mp3";
import heaven_water from "../../assets/audio/stress/heaven_water.mp3";
import morning_relaxation from "../../assets/audio/stress/morning_relaxation.mp3";
import motivational from "../../assets/audio/stress/motivational.mp3";
import ocean_waves from "../../assets/audio/stress/ocean_waves.mp3";
import om_chanting from "../../assets/audio/stress/om_chanting.mp3";
import peace_happy from "../../assets/audio/stress/peace_happy.mp3";
import peaceful from "../../assets/audio/stress/peaceful.mp3";
import perfect_rain from "../../assets/audio/stress/perfect_rain.mp3";
import soft_guitar from "../../assets/audio/stress/soft_guitar.mp3";
import soft_water from "../../assets/audio/stress/soft_water.mp3";
import temple from "../../assets/audio/stress/temple.mp3";
import tranquil_forest from "../../assets/audio/stress/tranquil_forest.mp3";
import zen_garden from "../../assets/audio/stress/zen_garden.mp3";

// ====== Notify helper ======
const notify = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("Info", msg);
};

// ====== Constants for local files ======
const DOCUMENT_DIR = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? "";
const ROOT = DOCUMENT_DIR + "moodify/";
const FAV_DIR = ROOT + "/favorites/";
const PL_DIR = ROOT + "playlists/";
const LOGIN_ROUTE = "/authpages/Login-page";

async function ensureDirs() {
  for (const path of [ROOT, FAV_DIR, PL_DIR]) {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}
const favFile = (uid: string) => `${FAV_DIR}${uid}.txt`;       // JSON in .txt
const plFile = (uid: string) => `${PL_DIR}${uid}.txt`;         // JSON in .txt

async function readJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return fallback;
    const content = await FileSystem.readAsStringAsync(path);
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}
async function writeJSON(path: string, data: any) {
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
}

const uid = () => auth.currentUser?.uid ?? null;

// ====== Types ======
type Track = { title: string; file: any; image?: any };
type Category = {
  key: string; label: string;
  subcategories?: { title: string; tracks: Track[] }[];
};
type Favorite = {
  id: string;               // title for music, identifier for story
  title: string;
  type: "music" | "sleep-story";
  file?: any;
  url?: string;
  image: any;
  author?: string;
};
type SleepStory = { identifier: string; title: string; creator: string };
type Playlist = { id: string; name: string; tracks: (Track | SleepStory)[]; created: Date };

// Stored file shapes
type StoredFavorites = {
  favorites: (| { type: "music"; title: string }
    | { type: "sleep-story"; id: string; title: string; author?: string; imageUrl?: string; url?: string })[];
};
type StoredPlaylists = {
  playlists: {
    id: string;
    name: string;
    created: number;
    tracks: (| { kind: "music"; title: string }
      | { kind: "sleep-story"; id: string; title: string; author?: string })[];
  }[];
};

// ====== Local asset map (title -> local require) ======
const LOCAL_ASSET_MAP: Record<string, { file: any; image: any }> = {
  "Calm Mind":           { file: calm_water,        image: require("../../assets/thumbnails/calm_water.png") },
  "Ocean Waves":         { file: ocean_waves,       image: require("../../assets/thumbnails/ocean_waves.png") },
  "Zen Garden":          { file: zen_garden,        image: require("../../assets/thumbnails/zen_garden.png") },
  "Tranquil Forest":     { file: tranquil_forest,   image: require("../../assets/thumbnails/tranquil_forest.png") },
  "Morning Relaxation":  { file: morning_relaxation,image: require("../../assets/thumbnails/morning_relaxation.png") },
  "Heaven Water":        { file: heaven_water,      image: require("../../assets/thumbnails/heaven_water.png") },
  "Perfect Rain":        { file: perfect_rain,      image: require("../../assets/thumbnails/perfect_rain.png") },
  "Soft Water":          { file: soft_water,        image: require("../../assets/thumbnails/soft_water.png") },
  "Birds Singing":       { file: birds_singing,     image: require("../../assets/thumbnails/birds_singing.png") },
  "Soft Guitar":         { file: soft_guitar,       image: require("../../assets/thumbnails/soft_guitar.png") },
  "Peaceful Vibes":      { file: peaceful,          image: require("../../assets/thumbnails/peaceful.png") },
  "Peace & Happy":       { file: peace_happy,       image: require("../../assets/thumbnails/peace_happy.png") },
  "Motivational":        { file: motivational,      image: require("../../assets/thumbnails/motivational.png") },
  "Om Chanting":         { file: om_chanting,       image: require("../../assets/thumbnails/om_chanting.png") },
  "Temple Sounds":       { file: temple,            image: require("../../assets/thumbnails/temple.png") },
};

// ====== Categories ======
const CATEGORIES: Category[] = [
  {
    key: "stress",
    label: "Stress Relief",
    subcategories: [
      {
        title: "Nature Sounds",
        tracks: [
          { title: "Calm Mind", file: calm_water, image: LOCAL_ASSET_MAP["Calm Mind"].image },
          { title: "Ocean Waves", file: ocean_waves, image: LOCAL_ASSET_MAP["Ocean Waves"].image },
          { title: "Zen Garden", file: zen_garden, image: LOCAL_ASSET_MAP["Zen Garden"].image },
          { title: "Tranquil Forest", file: tranquil_forest, image: LOCAL_ASSET_MAP["Tranquil Forest"].image },
          { title: "Morning Relaxation", file: morning_relaxation, image: LOCAL_ASSET_MAP["Morning Relaxation"].image },
          { title: "Heaven Water", file: heaven_water, image: LOCAL_ASSET_MAP["Heaven Water"].image },
          { title: "Perfect Rain", file: perfect_rain, image: LOCAL_ASSET_MAP["Perfect Rain"].image },
          { title: "Soft Water", file: soft_water, image: LOCAL_ASSET_MAP["Soft Water"].image },
          { title: "Birds Singing", file: birds_singing, image: LOCAL_ASSET_MAP["Birds Singing"].image },
        ],
      },
      {
        title: "Instrumentals",
        tracks: [
          { title: "Soft Guitar", file: soft_guitar, image: LOCAL_ASSET_MAP["Soft Guitar"].image },
          { title: "Peaceful Vibes", file: peaceful, image: LOCAL_ASSET_MAP["Peaceful Vibes"].image },
          { title: "Peace & Happy", file: peace_happy, image: LOCAL_ASSET_MAP["Peace & Happy"].image },
        ],
      },
      {
        title: "Motivational",
        tracks: [
          { title: "Motivational", file: motivational, image: LOCAL_ASSET_MAP["Motivational"].image },
          { title: "Om Chanting", file: om_chanting, image: LOCAL_ASSET_MAP["Om Chanting"].image },
          { title: "Temple Sounds", file: temple, image: LOCAL_ASSET_MAP["Temple Sounds"].image },
        ],
      },
    ],
  },
  { key: "sleep", label: "Sleep Tales", subcategories: [
      { title: "Popular Stories", tracks: [] },
      { title: "Recommended for You", tracks: [] },
      { title: "New Releases", tracks: [] },
      { title: "Classics", tracks: [] },
      { title: "For Kids", tracks: [] },
  ]},
  { key: "focus", label: "Focus" },
];

// ====== Favorites: FILE-BASED ======
const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      await ensureDirs();
      if (!user) { setFavorites([]); setReady(true); return; }
      const file = favFile(user.uid);
      const data = await readJSON<StoredFavorites>(file, { favorites: [] });
      const restored: Favorite[] = data.favorites.map((f) => {
        if (f.type === "music") {
          const lk = LOCAL_ASSET_MAP[f.title];
          return { id: f.title, title: f.title, type: "music", file: lk?.file, image: lk?.image } as Favorite;
        }
        return {
          id: f.id,
          title: f.title,
          type: "sleep-story",
          url: f.url ?? "",
          image: { uri: f.imageUrl ?? "" },
          author: f.author ?? "Unknown Author",
        } as Favorite;
      });
      setFavorites(restored);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const persist = async (next: Favorite[]) => {
    const id = uid(); if (!id) return;
    const out: StoredFavorites = {
      favorites: next.map((x) =>
        x.type === "music"
          ? { type: "music", title: x.title }
          : { type: "sleep-story", id: x.id, title: x.title, author: x.author, imageUrl: (x.image as any)?.uri, url: x.url }
      ),
    };
    await writeJSON(favFile(id), out);
  };

  const addFavorite = async (item: Favorite) => {
    const id = uid();
    if (!id) { notify("Please sign in to save favorites."); router.push(LOGIN_ROUTE); return; }
    const next = (prev => (prev.find(f => f.id === item.id) ? prev : [...prev, item]))(favorites);
    setFavorites(next);
    await persist(next);
    notify("Added to Favorites ✅");
  };

  const removeFavorite = async (idStr: string) => {
    const id = uid();
    if (!id) { notify("Please sign in."); router.push(LOGIN_ROUTE); return; }
    const next = favorites.filter((f) => f.id !== idStr);
    setFavorites(next);
    await persist(next);
    notify("Removed from Favorites ❌");
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  return { ready, favorites, addFavorite, removeFavorite, isFavorite };
};

// ====== Playlists: FILE-BASED ======
type PlaylistsHook = {
  playlists: Playlist[];
  isLoaded: boolean;
  createPlaylist: (name: string) => Promise<Playlist>;
  addToPlaylist: (playlistId: string, track: Track | SleepStory) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
};

const usePlaylists = (): PlaylistsHook => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      await ensureDirs();
      if (!user) { setPlaylists([]); setIsLoaded(true); return; }
      const file = plFile(user.uid);
      const data = await readJSON<StoredPlaylists>(file, { playlists: [] });
      const restored: Playlist[] = data.playlists.map((p) => ({
        id: p.id,
        name: p.name,
        created: new Date(p.created),
        tracks: (p.tracks ?? []).map((t) =>
          t.kind === "music"
            ? ({ title: t.title, file: LOCAL_ASSET_MAP[t.title]?.file, image: LOCAL_ASSET_MAP[t.title]?.image } as Track)
            : ({ identifier: t.id, title: t.title, creator: t.author ?? "Unknown Author" } as SleepStory)
        ),
      }));
      setPlaylists(restored);
      setIsLoaded(true);
    });
    return () => unsub();
  }, []);

  const persist = async (next: Playlist[]) => {
    const id = uid(); if (!id) return;
    const out: StoredPlaylists = {
      playlists: next.map((p) => ({
        id: p.id,
        name: p.name,
        created: p.created.getTime(),
        tracks: p.tracks.map((t: any) =>
          "file" in t
            ? { kind: "music", title: t.title }
            : { kind: "sleep-story", id: t.identifier, title: t.title, author: t.creator }
        ),
      })),
    };
    await writeJSON(plFile(id), out);
  };

  const createPlaylist = async (name: string) => {
    const idStr = uid();
    if (!idStr) { notify("Please sign in to create playlists."); router.push(LOGIN_ROUTE); return { id: `local_${Date.now()}`, name, tracks: [], created: new Date() }; }
    const p: Playlist = { id: `pl_${Date.now()}`, name, tracks: [], created: new Date() };
    const next = [...playlists, p];
    setPlaylists(next);
    await persist(next);
    notify("Playlist created 🎶");
    return p;
  };

  const addToPlaylist = async (playlistId: string, track: Track | SleepStory) => {
    const idStr = uid();
    if (!idStr) { notify("Please sign in to add to a playlist."); router.push(LOGIN_ROUTE); return; }
    const next = playlists.map((p) => (p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p));
    setPlaylists(next);
    await persist(next);
    notify("Added to playlist ➕");
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    const idStr = uid();
    if (!idStr) { notify("Please sign in."); router.push(LOGIN_ROUTE); return; }
    const next = playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            tracks: p.tracks.filter((t: any) => ("file" in t ? t.title !== trackId : t.identifier !== trackId)),
          }
        : p
    );
    setPlaylists(next);
    await persist(next);
    notify("Removed from playlist ➖");
  };

  return { playlists, isLoaded, createPlaylist, addToPlaylist, removeFromPlaylist };
};

// ====== Palette helper ======
const getPalette = (dark: boolean) => ({
  backgroundStart: dark ? "#07070a" : "#ffffff",
  backgroundEnd: dark ? "#121018" : "#ffffff",
  pageBg: dark ? "#07070a" : "#ffffff",
  headerText: dark ? "#e6e6e6" : "#0d0b2f",
  helperText: dark ? "#cfcfe8" : "#0d0b2f",
  accent: dark ? "#6f6cff" : "#0d9488",
  cardBg: dark ? "#0f1016" : "#ffffff",
  cardBorder: dark ? "rgba(111,108,255,0.12)" : "#e6e6e6",
  playIconBg: dark ? "#89f0ff22" : "#9ff1ff",
  primaryButtonBg: dark ? "#6f6cff" : "#0d9488",
  success: "#4CAF50",
  danger: "#ff4444",
  muted: dark ? "#9a9ab3" : "#6b7280",
});

// ====== Stress UI ======
function StressUI({
  subcategories,
  favoritesData,
  playlistsData,
}: {
  subcategories: { title: string; tracks: Track[] }[];
  favoritesData: ReturnType<typeof useFavorites>;
  playlistsData: PlaylistsHook;
}) {
  const { addFavorite, removeFavorite, isFavorite } = favoritesData;
  const { addToPlaylist, playlists, createPlaylist } = playlistsData;
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  const handleFavorite = (track: Track) => {
    const u = uid();
    if (!u) { router.push(LOGIN_ROUTE); return; }
    const favorite: Favorite = {
      id: track.title,
      title: track.title,
      type: "music",
      file: track.file,
      image: track.image,
    };
    if (isFavorite(track.title)) removeFavorite(track.title);
    else addFavorite(favorite);
  };

  const openPlaylistModal = (track: Track) => {
    if (!uid()) { router.push(LOGIN_ROUTE); return; }
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  return (
    <>
      <Text style={[styles.helper, { color: palette.helperText }]}>Play Music And Relieve Stress</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {subcategories.map((subcategory) => (
          <View key={subcategory.title} style={[stressStyles.subcategorySection]}>
            <Text style={[stressStyles.subcategoryTitle, { color: palette.headerText }]}>{subcategory.title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stressStyles.horizontalScrollContent}>
              {subcategory.tracks.map((track) => (
                <View key={track.title} style={[stressStyles.trackCard, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
                  <TouchableOpacity
                    style={stressStyles.cardContent}
                    onPress={() => router.push({ pathname: "/meditation/Player", params: { title: track.title, url: track.file, image: track.image } })}
                  >
                    <Image source={track.image} style={stressStyles.trackCardImage} resizeMode="cover" />
                    <Text style={[stressStyles.trackCardTitle, { color: palette.headerText }]}>{track.title}</Text>
                    <View style={[stressStyles.playButton, { backgroundColor: palette.playIconBg }]}>
                      <Ionicons name="play" size={16} color={isDark ? "#07070a" : "#0d0b2f"} />
                    </View>
                  </TouchableOpacity>

                  <View style={stressStyles.actionButtons}>
                    <TouchableOpacity style={stressStyles.favoriteButton} onPress={() => handleFavorite(track)}>
                      <Ionicons name={isFavorite(track.title) ? "heart" : "heart-outline"} size={20} color={isFavorite(track.title) ? "#e63946" : palette.muted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={stressStyles.playlistButton} onPress={() => openPlaylistModal(track)}>
                      <Ionicons name="add-circle-outline" size={20} color={palette.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Playlist Modal */}
      <Modal visible={showPlaylistModal} transparent animationType="slide" onRequestClose={() => setShowPlaylistModal(false)}>
        <View style={[stressStyles.modalContainer]}>
          <View style={[stressStyles.modalContent, { backgroundColor: palette.cardBg }]}>
            <Text style={[stressStyles.modalTitle, { color: palette.headerText }]}>Add to Playlist</Text>
            <Text style={[stressStyles.modalSubtitle, { color: palette.muted }]}>{selectedTrack?.title}</Text>

            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={[stressStyles.playlistItem, { backgroundColor: isDark ? "#0b0b10" : "#f7fafc" }]}
                onPress={async () => {
                  if (selectedTrack) {
                    await addToPlaylist(playlist.id, selectedTrack);
                    notify(`Added to "${playlist.name}" ✅`);
                    setShowPlaylistModal(false);
                  }
                }}
              >
                <Text style={[stressStyles.playlistName, { color: palette.headerText }]}>{playlist.name}</Text>
                <Text style={[stressStyles.playlistCount, { color: palette.accent }]}>{playlist.tracks.length} tracks</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[stressStyles.newPlaylistButton, { backgroundColor: palette.accent }]}
              onPress={async () => {
                const newPlaylist = await createPlaylist(`My Playlist ${playlists.length + 1}`);
                if (selectedTrack && newPlaylist?.id) {
                  await addToPlaylist(newPlaylist.id, selectedTrack);
                  notify(`Added to "${newPlaylist.name}" ✅`);
                }
                setShowPlaylistModal(false);
              }}
            >
              <Ionicons name="add" size={24} color={isDark ? "#fff" : "#0d0b2f"} />
              <Text style={[stressStyles.newPlaylistText, { color: isDark ? "#fff" : "#ffffff" }]}>Create New Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={stressStyles.cancelButton} onPress={() => setShowPlaylistModal(false)}>
              <Text style={[stressStyles.cancelText, { color: palette.headerText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ====== Favorites UI ======
function FavoritesUI({ favoritesData }: { favoritesData: ReturnType<typeof useFavorites> }) {
  const { favorites, removeFavorite } = favoritesData;
  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  if (favorites.length === 0) {
    return (
      <View style={favoritesStyles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color={palette.accent} />
        <Text style={[favoritesStyles.emptyTitle, { color: palette.headerText }]}>No Favorites Yet</Text>
        <Text style={[favoritesStyles.emptyText, { color: palette.muted }]}>Start adding your favorite tracks and stories!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }}>
      <Text style={[favoritesStyles.title, { color: palette.headerText }]}>Your Favorites</Text>
      {favorites.map((favorite) => (
        <View key={favorite.id} style={[favoritesStyles.favoriteItem, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
          <Image
            source={typeof favorite.image === "string" ? { uri: favorite.image } : favorite.image}
            style={favoritesStyles.favoriteImage}
            resizeMode="cover"
          />
          <View style={favoritesStyles.favoriteInfo}>
            <Text style={[favoritesStyles.favoriteTitle, { color: palette.headerText }]}>{favorite.title}</Text>
            {favorite.author && favorite.author !== "Unknown Author" && (
              <Text style={[favoritesStyles.favoriteAuthor, { color: palette.muted }]}>By: {favorite.author}</Text>
            )}
            <Text style={[favoritesStyles.favoriteType, { color: palette.accent }]}>{favorite.type === "music" ? "🎵 Music" : "📖 Sleep Story"}</Text>
          </View>

          <TouchableOpacity
            style={favoritesStyles.playButton}
            onPress={() => {
              if (favorite.type === "music") {
                router.push({ pathname: "/meditation/Player", params: { title: favorite.title, url: favorite.file, image: favorite.image } });
              } else {
                router.push({
                  pathname: "/meditation/talesPlayer",
                  params: { title: favorite.title, url: favorite.url, image: favorite.image, author: favorite.author },
                });
              }
            }}
          >
            <Ionicons name="play" size={20} color={isDark ? "#07070a" : "#0d0b2f"} />
          </TouchableOpacity>

          <TouchableOpacity style={favoritesStyles.removeButton} onPress={() => removeFavorite(favorite.id)}>
            <Ionicons name="heart" size={20} color="#e63946" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ====== Playlists UI ======
function PlaylistsUI({ playlistsData }: { playlistsData: PlaylistsHook }) {
  const { playlists, createPlaylist } = playlistsData;
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }}>
      <TouchableOpacity style={[playlistsStyles.createButton, { backgroundColor: palette.accent }]} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add-circle" size={24} color={isDark ? "#fff" : "#0d0b2f"} />
        <Text style={[playlistsStyles.createButtonText, { color: isDark ? "#fff" : "#ffffff" }]}>Create New Playlist</Text>
      </TouchableOpacity>

      {playlists.length === 0 ? (
        <View style={playlistsStyles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color={palette.accent} />
          <Text style={[playlistsStyles.emptyTitle, { color: palette.headerText }]}>No Playlists Yet</Text>
          <Text style={[playlistsStyles.emptyText, { color: palette.muted }]}>Create your first playlist to organize your favorite content!</Text>
        </View>
      ) : (
        playlists.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            style={[playlistsStyles.playlistItem, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
            onPress={() => router.push({ pathname: "/meditation/playlistDetails", params: { playlistId: playlist.id } })}
          >
            <View style={[playlistsStyles.playlistImage, { backgroundColor: palette.accent }]}><Ionicons name="musical-notes" size={32} color={isDark ? "#fff" : "#0d0b2f"} /></View>
            <View style={playlistsStyles.playlistInfo}>
              <Text style={[playlistsStyles.playlistName, { color: palette.headerText }]}>{playlist.name}</Text>
              <Text style={[playlistsStyles.playlistCount, { color: palette.muted }]}>{playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.muted} />
          </TouchableOpacity>
        ))
      )}

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={playlistsStyles.modalContainer}>
          <View style={[playlistsStyles.modalContent, { backgroundColor: palette.cardBg }]}>
            <Text style={[playlistsStyles.modalTitle, { color: palette.headerText }]}>Create New Playlist</Text>
            <TextInput
              style={[playlistsStyles.nameInput, { backgroundColor: isDark ? "#0b0b10" : "#f3f4f6", color: palette.headerText }]}
              placeholder="Playlist name"
              placeholderTextColor={isDark ? "#888" : "#888"}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TouchableOpacity
              style={[playlistsStyles.createConfirmButton, !newPlaylistName && playlistsStyles.createConfirmButtonDisabled, { backgroundColor: palette.accent }]}
              onPress={async () => {
                if (!newPlaylistName) return;
                await createPlaylist(newPlaylistName);
                setNewPlaylistName("");
                setShowCreateModal(false);
              }}
              disabled={!newPlaylistName}
            >
              <Text style={[playlistsStyles.createConfirmText, { color: "#fff" }]}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity style={playlistsStyles.cancelButton} onPress={() => setShowCreateModal(false)}>
              <Text style={[playlistsStyles.cancelText, { color: palette.headerText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ====== Sleep UI ======
function SleepUI({
  favoritesData,
  playlistsData,
}: {
  favoritesData: ReturnType<typeof useFavorites>;
  playlistsData: PlaylistsHook;
}) {
  const [stories, setStories] = useState<SleepStory[]>([]);
  const [loading, setLoading] = useState(true);
  const { addFavorite, removeFavorite, isFavorite } = favoritesData;
  const { playlists, createPlaylist, addToPlaylist } = playlistsData;
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<SleepStory | null>(null);
  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  const sleepSubcategories = useMemo(() => {
    if (!stories.length) return [];
    return [
      { title: "Popular Stories",      tracks: stories.slice(0, 6)  },
      { title: "Recommended for You",  tracks: stories.slice(6, 12) },
      { title: "New Releases",         tracks: stories.slice(12, 18)},
      { title: "Classics",             tracks: stories.slice(18, 24)},
      { title: "For Kids",             tracks: stories.slice(0, 6)  },
    ].filter((c) => c.tracks.length > 0);
  }, [stories]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const resp = await fetch("https://archive.org/advancedsearch.php?q=collection%3A%22librivoxaudio%22+AND+format%3A%22VBR+MP3%22&fl[]=identifier,title,creator&sort[]=downloads+desc&rows=30&output=json");
        const data = await resp.json();
        if (data.response && data.response.docs) setStories(data.response.docs.slice(0, 24));
        else setStories(getFallbackStories());
      } catch {
        setStories(getFallbackStories());
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const getFallbackStories = (): SleepStory[] => ([
    { identifier: "adventures_sherlock_holmes_001_librivox", title: "The Adventures of Sherlock Holmes", creator: "Arthur Conan Doyle" },
    { identifier: "alice_in_wonderland_librivox", title: "Alice's Adventures in Wonderland", creator: "Lewis Carroll" },
    { identifier: "pride_and_prejudice_librivox", title: "Pride and Prejudice", creator: "Jane Austen" },
    { identifier: "dracula_librivox", title: "Dracula", creator: "Bram Stoker" },
    { identifier: "frankenstein_librivox", title: "Frankenstein", creator: "Mary Shelley" },
    { identifier: "moby_dick_librivox", title: "Moby Dick", creator: "Herman Melville" },
  ]);

  const getAudioUrl = async (identifier: string): Promise<string | null> => {
    try {
      const metadataResponse = await fetch(`https://archive.org/metadata/${identifier}`);
      const metadata = await metadataResponse.json();
      if (!metadata.files) return null;
      const mp3Files = metadata.files.filter((f: any) => f.format === "VBR MP3" || f.name.toLowerCase().endsWith(".mp3"));
      if (mp3Files.length === 0) return null;
      const sorted = mp3Files.sort((a: any, b: any) => (a.size || 0) - (b.size || 0));
      return `https://archive.org/download/${identifier}/${sorted[0].name}`;
    } catch {
      return null;
    }
  };

  const navigateToPlayer = async (story: SleepStory) => {
    const audioUrl = await getAudioUrl(story.identifier);
    if (!audioUrl) { alert("Sorry, this story is not available at the moment."); return; }
    router.push({
      pathname: "/meditation/talesPlayer",
      params: {
        title: story.title,
        url: audioUrl,
        author: story.creator || "Unknown Author",
        type: "sleep-story",
        image: `https://archive.org/services/img/${story.identifier}`,
      },
    });
  };

  const handleFavorite = async (story: SleepStory) => {
    if (!uid()) { router.push(LOGIN_ROUTE); return; }
    const audioUrl = await getAudioUrl(story.identifier);
    const favorite: Favorite = {
      id: story.identifier,
      title: story.title,
      type: "sleep-story",
      url: audioUrl || "",
      image: { uri: `https://archive.org/services/img/${story.identifier}` },
      author: story.creator,
    };
    if (isFavorite(story.identifier)) removeFavorite(story.identifier);
    else addFavorite(favorite);
  };

  const openPlaylistModal = (story: SleepStory) => {
    if (!uid()) { router.push(LOGIN_ROUTE); return; }
    setSelectedStory(story);
    setShowPlaylistModal(true);
  };

  if (loading) {
    return (
      <View style={sleepStyles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[sleepStyles.loadingText, { color: palette.muted }]}>Loading bedtime stories...</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={[sleepStyles.helper, { color: palette.headerText }]}>Wind Down With Bedtime Tales 🌙</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {sleepSubcategories.map((subcategory) => (
          <View key={subcategory.title} style={sleepStyles.subcategorySection}>
            <Text style={[sleepStyles.subcategoryTitle, { color: palette.headerText }]}>{subcategory.title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sleepStyles.horizontalScrollContent}>
              {subcategory.tracks.map((story) => (
                <View key={story.identifier} style={[sleepStyles.storyCard, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
                  <TouchableOpacity style={sleepStyles.cardContent} onPress={() => navigateToPlayer(story)}>
                    <Image
                      source={{ uri: `https://archive.org/services/img/${story.identifier}` }}
                      style={sleepStyles.storyCardImage}
                      defaultSource={require("../../assets/images/Sleep-PNG-Clipart.png")}
                    />
                    <Text style={[sleepStyles.storyCardTitle, { color: palette.headerText }]} numberOfLines={2}>{story.title || "Untitled Story"}</Text>
                    <Text style={[sleepStyles.storyCardAuthor, { color: palette.muted }]} numberOfLines={1}>By: {story.creator || "Unknown Author"}</Text>
                    <View style={sleepStyles.playButtonContainer}>
                      <View style={[sleepStyles.playButton, { backgroundColor: palette.playIconBg }]}><Ionicons name="play" size={16} color={isDark ? "#07070a" : "#0d0b2f"} /></View>
                      <Text style={[sleepStyles.playButtonText, { color: palette.headerText }]}>Play Story</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={sleepStyles.actionButtons}>
                    <TouchableOpacity style={sleepStyles.favoriteButton} onPress={() => handleFavorite(story)}>
                      <Ionicons name={isFavorite(story.identifier) ? "heart" : "heart-outline"} size={20} color={isFavorite(story.identifier) ? "#e63946" : palette.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={sleepStyles.playlistButton} onPress={() => openPlaylistModal(story)}>
                      <Ionicons name="add-circle-outline" size={20} color={palette.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showPlaylistModal} transparent animationType="slide" onRequestClose={() => setShowPlaylistModal(false)}>
        <View style={sleepStyles.modalContainer}>
          <View style={[sleepStyles.modalContent, { backgroundColor: palette.cardBg }]}>
            <Text style={[sleepStyles.modalTitle, { color: palette.headerText }]}>Add to Playlist</Text>
            <Text style={[sleepStyles.modalSubtitle, { color: palette.muted }]}>{selectedStory?.title}</Text>

            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={[sleepStyles.playlistItem, { backgroundColor: isDark ? "#0b0b10" : "#f7fafc" }]}
                onPress={async () => {
                  if (selectedStory) {
                    await addToPlaylist(playlist.id, selectedStory);
                    notify(`Added to "${playlist.name}" ✅`);
                    setShowPlaylistModal(false);
                  }
                }}
              >
                <Text style={[sleepStyles.playlistName, { color: palette.headerText }]}>{playlist.name}</Text>
                <Text style={[sleepStyles.playlistCount, { color: palette.accent }]}>{playlist.tracks.length} tracks</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[sleepStyles.newPlaylistButton, { backgroundColor: palette.accent }]}
              onPress={async () => {
                const newPlaylist = await createPlaylist(`My Playlist ${playlists.length + 1}`);
                if (selectedStory && newPlaylist?.id) {
                  await addToPlaylist(newPlaylist.id, selectedStory);
                  notify(`Added to "${newPlaylist.name}" ✅`);
                }
                setShowPlaylistModal(false);
              }}
            >
              <Ionicons name="add" size={24} color={isDark ? "#fff" : "#0d0b2f"} />
              <Text style={[sleepStyles.newPlaylistText, { color: "#fff" }]}>Create New Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={sleepStyles.cancelButton} onPress={() => setShowPlaylistModal(false)}>
              <Text style={[sleepStyles.cancelText, { color: palette.headerText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ====== Focus UI ======
function FocusUI() {
  const [duration, setDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [breathText, setBreathText] = useState("Inhale");
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`;

  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); setIsRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isRunning) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    let inhale = true;
    const textInterval = setInterval(() => { inhale = !inhale; setBreathText(inhale ? "Inhale" : "Exhale"); }, 4000);
    return () => { loop.stop(); clearInterval(textInterval); };
  }, [isRunning, scaleAnim]);

  return (
    <>
      <Text style={[styles.helper, { color: palette.headerText }]}>Sync Your Heart To Your Breath</Text>
      <View style={[focusStyles.container]}>
        <Text style={[focusStyles.timerText, { color: palette.headerText }]}>{formatTime(timeLeft)}</Text>
        <TouchableOpacity style={[focusStyles.playPauseBtn, { backgroundColor: palette.accent }]} onPress={() => setIsRunning((p) => !p)}>
          <Ionicons name={isRunning ? "stop-circle-outline" : "hourglass-outline"} size={40} color={isDark ? "#fff" : "#0d0b2f"} />
        </TouchableOpacity>
        <View style={focusStyles.presetContainer}>
          <TouchableOpacity style={[focusStyles.presetBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(13,11,47,0.06)" }]} onPress={() => { setDuration(60); setTimeLeft(60); setIsRunning(false); }}><Text style={[focusStyles.presetText, { color: palette.headerText }]}>1m</Text></TouchableOpacity>
          <TouchableOpacity style={[focusStyles.presetBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(13,11,47,0.06)" }]} onPress={() => { setDuration(300); setTimeLeft(300); setIsRunning(false); }}><Text style={[focusStyles.presetText, { color: palette.headerText }]}>5m</Text></TouchableOpacity>
          <TouchableOpacity style={[focusStyles.presetBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(13,11,47,0.06)" }]} onPress={() => { setDuration(600); setTimeLeft(600); setIsRunning(false); }}><Text style={[focusStyles.presetText, { color: palette.headerText }]}>10m</Text></TouchableOpacity>
          <TouchableOpacity style={[focusStyles.presetBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(13,11,47,0.06)" }]} onPress={() => setCustomModalVisible(true)}><Text style={[focusStyles.presetText, { color: palette.headerText }]}>Custom</Text></TouchableOpacity>
          <Modal visible={customModalVisible} transparent animationType="fade" onRequestClose={() => setCustomModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View style={{ backgroundColor: palette.cardBg, padding: 24, borderRadius: 20, width: 320, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 }}>
                <Text style={{ color: palette.headerText, fontSize: 18, marginBottom: 12 }}>Enter duration</Text>
                <TextInput
                  value={customInput}
                  onChangeText={setCustomInput}
                  keyboardType="numeric"
                  placeholder="Minutes"
                  placeholderTextColor={palette.muted}
                  style={{ padding: 10, color: palette.headerText, textAlign: "center", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: palette.cardBorder, width: '100%' }}
                />
                <TouchableOpacity
                  style={{ backgroundColor: palette.accent, paddingVertical: 10, paddingHorizontal: 40, borderRadius: 14, marginBottom: 8, alignItems: "center" }}
                  onPress={() => {
                    const seconds = parseInt(customInput) * 60;
                    if (!isNaN(seconds) && seconds > 0) { setDuration(seconds); setTimeLeft(seconds); setIsRunning(false); setCustomModalVisible(false); setCustomInput(""); }
                    else alert("Please enter a valid number!");
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Set</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 8 }} onPress={() => setCustomModalVisible(false)}><Text style={{ color: palette.headerText, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        <Animated.View style={[focusStyles.breathCircle, { transform: [{ scale: useRef(new Animated.Value(1)).current }], backgroundColor: isDark ? "rgba(111,108,255,0.06)" : "rgba(13,11,47,0.06)" }]}><Text style={[focusStyles.breathText, { color: palette.headerText }]}>{breathText}</Text></Animated.View>
      </View>
    </>
  );
}

// ====== Screen ======
export default function MeditationListScreen() {
  const [active, setActive] = useState<string>(CATEGORIES[0].key);
  const subcategories = useMemo(() => CATEGORIES.find((c) => c.key === active)?.subcategories ?? [], [active]);
  const favoritesData = useFavorites();
  const playlistsData = usePlaylists();
  const { isDark } = useSettings();
  const palette = getPalette(isDark);

  // Force login on first entry if no user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace(LOGIN_ROUTE);
    });
    return () => unsub();
  }, []);

  return (
    <LinearGradient colors={isDark ? ["#07070a", "#121018"] : ["#ffffff", "#ffffff"]} style={[styles.container, { backgroundColor: palette.pageBg }]}>
      <View style={styles.headerBar}><Text style={[styles.header, { color: palette.headerText }]}>Meditation</Text></View>
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          <TouchableOpacity style={[styles.lottieTabItem, active === "stress" && styles.lottieTabItemActive, { borderColor: palette.accent }]} onPress={() => setActive("stress")}>
            <LottieView source={require("../../assets/animation/Guitarist.json")} autoPlay={active === "stress"} loop={active === "stress"} style={{ width: 60, height: 60 }} />
            <Text style={[styles.tabText, active === "stress" && styles.tabTextActive, { color: active === "stress" ? palette.accent : palette.headerText }]}>Music</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lottieTabItem, active === "sleep" && styles.lottieTabItemActive, { borderColor: palette.accent }]} onPress={() => setActive("sleep")}>
            <LottieView source={require("../../assets/animation/Book.json")} autoPlay={active === "sleep"} loop={active === "sleep"} style={{ width: 60, height: 60 }} />
            <Text style={[styles.tabText, active === "sleep" && styles.tabTextActive, { color: active === "sleep" ? palette.accent : palette.headerText }]}>SleepTales</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lottieTabItem, active === "focus" && styles.lottieTabItemActive, { borderColor: palette.accent }]} onPress={() => setActive("focus")}>
            <LottieView source={require("../../assets/animation/Sloth meditate.json")} autoPlay={active === "focus"} loop={active === "focus"} style={{ width: 60, height: 60 }} />
            <Text style={[styles.tabText, active === "focus" && styles.tabTextActive, { color: active === "focus" ? palette.accent : palette.headerText }]}>Breath</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lottieTabItem, active === "playlist" && styles.lottieTabItemActive, { borderColor: palette.accent }]} onPress={() => setActive("playlist")}>
            <LottieView source={require("../../assets/animation/Playlist.json")} autoPlay={active === "playlist"} loop={active === "playlist"} style={{ width: 60, height: 60 }} />
            <Text style={[styles.tabText, active === "playlist" && styles.tabTextActive, { color: active === "playlist" ? palette.accent : palette.headerText }]}>Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lottieTabItem, active === "favorites" && styles.lottieTabItemActive, { borderColor: palette.accent }]} onPress={() => setActive("favorites")}>
            <LottieView source={require("../../assets/animation/Favourite Animation.json")} autoPlay={active === "favorites"} loop={active === "favorites"} style={{ width: 60, height: 60 }} />
            <Text style={[styles.tabText, active === "favorites" && styles.tabTextActive, { color: active === "favorites" ? palette.accent : palette.headerText }]}>Favourites</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={[styles.tracksContainer, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
        {active === "stress" && (
          <StressUI
            subcategories={subcategories}
            favoritesData={favoritesData}
            playlistsData={playlistsData}
          />
        )}
        {active === "sleep" && <SleepUI favoritesData={favoritesData} playlistsData={playlistsData} />}
        {active === "focus" && <FocusUI />}
        {active === "favorites" && <FavoritesUI favoritesData={favoritesData} />}
        {active === "playlist" && <PlaylistsUI playlistsData={playlistsData} />}
      </View>
    </LinearGradient>
  );
}

// ====== Styles (theme-neutral layout) ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginLeft: 6,
  },
  tabsContainer: {
    height: 120,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  lottieTabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  lottieTabItemActive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    marginTop: 4,
  },
  tabTextActive: {
    fontWeight: "600",
  },
  helper: {
    opacity: 0.9,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
    textAlign: "center",
    fontSize: 20,
  },
  tracksContainer: {
    flex: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
});

// ====== Sub-style sheets (kept layout-only, colors applied inline) ======
const stressStyles = StyleSheet.create({
  subcategorySection: { marginBottom: 24 },
  subcategoryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginLeft: 8 },
  horizontalScrollContent: { paddingHorizontal: 8 },
  trackCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
  },
  cardContent: { alignItems: "center", width: "100%" },
  trackCardImage: { width: 120, height: 120, borderRadius: 8, marginBottom: 8 },
  trackCardTitle: { fontSize: 14, fontWeight: "600", textAlign: "center", marginBottom: 8, flexShrink: 1 },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 8, paddingHorizontal: 4 },
  favoriteButton: { padding: 4 },
  playlistButton: { padding: 4 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: "90%", maxWidth: 400, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  modalSubtitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  playlistItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 8, width: "100%" },
  playlistName: { fontSize: 16, fontWeight: "600", flex: 1 },
  playlistCount: { fontSize: 12 },
  newPlaylistButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, marginTop: 12, marginBottom: 8 },
  newPlaylistText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  cancelButton: { padding: 12, alignItems: "center" },
  cancelText: { fontSize: 16 },
});

const favoritesStyles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, textAlign: "center", lineHeight: 22 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 20, marginTop: 10 },
  favoriteItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 12, marginHorizontal: 8, borderWidth: 1 },
  favoriteImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  favoriteInfo: { flex: 1 },
  favoriteTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  favoriteAuthor: { fontSize: 12, marginBottom: 4 },
  favoriteType: { fontSize: 12, fontWeight: "500" },
  playButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginHorizontal: 8 },
  removeButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 4, borderWidth:1 },
});

const playlistsStyles = StyleSheet.create({
  createButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, marginHorizontal: 8, marginBottom: 20 },
  createButtonText: { fontSize: 18, fontWeight: "700", marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, textAlign: "center", lineHeight: 22 },
  playlistItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 16, marginBottom: 12, marginHorizontal: 8, borderWidth: 1 },
  playlistImage: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginRight: 12 },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  playlistCount: { fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: "90%", maxWidth: 400, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  nameInput: { borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, width: "100%" },
  createConfirmButton: { padding: 16, borderRadius: 10, alignItems: "center", marginBottom: 12, width: "100%" },
  createConfirmButtonDisabled: { opacity: 0.6 },
  createConfirmText: { fontSize: 16, fontWeight: "700" },
  cancelButton: { padding: 12, alignItems: "center" },
  cancelText: { fontSize: 16 },
});

const sleepStyles = StyleSheet.create({
  helper: { paddingHorizontal: 16, marginBottom: 8, marginTop: 16, textAlign: "center", fontSize: 20 },
  subcategorySection: { marginBottom: 24 },
  subcategoryTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12, marginLeft: 8 },
  horizontalScrollContent: { paddingHorizontal: 8 },
  storyCard: { width: 150, marginRight: 12, borderRadius: 12, padding: 12, alignItems: "center", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 3 },
  cardContent: { alignItems: "center", width: "100%" },
  storyCardImage: { width: 110, height: 100, borderRadius: 8, marginBottom: 8 },
  storyCardTitle: { fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: 4, flexShrink: 1 },
  storyCardAuthor: { fontSize: 10, textAlign: "center", marginBottom: 8, flexShrink: 1 },
  playButtonContainer: { alignItems: "center" },
  playButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowOpacity: 0.2, shadowRadius: 6, elevation: 3, marginBottom: 4 },
  playButtonText: { fontSize: 10, fontWeight: "600" },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 8, paddingHorizontal: 4 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 16 },
  favoriteButton: { padding: 4 },
  playlistButton: { padding: 4 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: "90%", maxWidth: 400, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  modalSubtitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  playlistItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 8, width: "100%" },
  playlistName: { fontSize: 16, fontWeight: "600", flex: 1 },
  playlistCount: { fontSize: 12 },
  newPlaylistButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, marginTop: 12, marginBottom: 8 },
  newPlaylistText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  cancelButton: { padding: 12, alignItems: "center" },
  cancelText: { fontSize: 16 },
});

const focusStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  timerText: { fontSize: 30, fontWeight: "700", marginBottom: 10, marginTop: -40 },
  playPauseBtn: { width: 80, height: 80, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 30, marginTop: 20 },
  presetContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 50, width: "100%", paddingHorizontal: 40, marginTop: 12 },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginHorizontal: 5, alignItems: "center", justifyContent: "center" },
  presetText: { fontSize: 16, fontWeight: "600" },
  breathCircle: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 40, marginTop: 20 },
  breathText: { fontSize: 18, fontWeight: "600" },
});

