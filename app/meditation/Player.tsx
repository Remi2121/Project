// Player.tsx
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import React, { useEffect, useState } from "react";
import { Alert, Image, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from "react-native";

// ===== Filesystem + Auth (for persistent favorites) =====
import * as FileSystem from "expo-file-system";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../utils/firebaseConfig";

// theme hook
import { useSettings } from "../utilis/Settings";

// ========= Types =========
type Favorite = {
  id: string;
  title: string;
  type: "music" | "sleep-story";
  file?: any;
  url?: string;
  image: any;
  author?: string;
};
type StoredFavorites = {
  favorites: (
    | { type: "music"; title: string }
    | { type: "sleep-story"; id: string; title: string; author?: string; imageUrl?: string; url?: string }
  )[];
};

// ========= FS helpers =========
const ROOT = FileSystem.documentDirectory + "moodify/";
const FAV_DIR = ROOT + "favorites/"; // note: no extra leading slash
const favFile = (uid: string) => `${FAV_DIR}${uid}.txt`;

const notify = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("Info", msg);
};

async function ensureDirs() {
  for (const p of [ROOT, FAV_DIR]) {
    const info = await FileSystem.getInfoAsync(p);
    if (!info.exists) await FileSystem.makeDirectoryAsync(p, { intermediates: true });
  }
}
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

// ========= Favorites hook (file-based, per-user) =========
function useFavoritesFS() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      await ensureDirs();
      if (!user) {
        setFavorites([]);
        setReady(true);
        return;
      }
      const data = await readJSON<StoredFavorites>(favFile(user.uid), { favorites: [] });
      // Rehydrate to Favorite[]
      const restored: Favorite[] = (data.favorites || []).map((f) => {
        if (f.type === "music") {
          // We persist only the title for music; Player gets image/url via route params
          return { id: f.title, title: f.title, type: "music" } as Favorite;
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
    const u = auth.currentUser;
    if (!u) return;
    const out: StoredFavorites = {
      favorites: next.map((x) =>
        x.type === "music"
          ? { type: "music", title: x.title }
          : { type: "sleep-story", id: x.id, title: x.title, author: x.author, imageUrl: (x.image as any)?.uri, url: x.url }
      ),
    };
    await writeJSON(favFile(u.uid), out);
  };

  const addFavorite = (item: Favorite) => {
    const u = auth.currentUser;
    if (!u) {
      notify("Please sign in to save favorites.");
      router.push("/authpages/Login-page");
      return;
    }
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) return prev;
      const next = [...prev, item];
      void persist(next);
      notify("Added to Favorites ✅");
      return next;
    });
  };

  const removeFavorite = (id: string) => {
    const u = auth.currentUser;
    if (!u) {
      notify("Please sign in.");
      router.push("/authpages/Login-page");
      return;
    }
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      void persist(next);
      notify("Removed from Favorites ❌");
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  return { ready, favorites, addFavorite, removeFavorite, isFavorite };
}

// ====== Palette helper for dark/light ======
const getPalette = (dark: boolean) => ({
  background: dark ? "#07070a" : "#ffffff",
  headerIcon: dark ? "#e6e6e6" : "#fff",
  headerIconSecondary: dark ? "#cfcfe8" : "#fff",
  title: dark ? "#e6e6e6" : "#0d0b2f",
  subtitle: dark ? "#b9b9ff" : "#55607a",
  accent: dark ? "#6f6cff" : "#2a1faa",
  playBtnBg: dark ? "#6f6cff" : "#2a1faa",
  playIcon: dark ? "#0b0b0f" : "#0d0b2f",
  artworkBg: dark ? "#0f0f16" : "#f8fafc",
  artworkBorder: dark ? "rgba(255,255,255,0.04)" : "#e6e9ef",
  timeText: dark ? "#e6e6e6" : "#111827",
  favoriteOn: "#ff6b6b",
  sliderTrack: dark ? "#2a2a36" : "#d1d5db",
  sliderThumb: dark ? "#6f6cff" : "#2a1faa",
  errorBg: dark ? "#4b1f1f" : "#ffe6e6",
  errorBorder: dark ? "#6b1f1f" : "#ffd1d1",
  errorText: dark ? "#ffdede" : "#7a1f1f",
});

// ========= Player Screen =========
export default function Player() {
  // Expecting params passed as JSON strings: JSON.stringify(track.file), JSON.stringify(track.image)
  const { title, url, image } = useLocalSearchParams();
  const parsedUrl = url ? JSON.parse(url as string) : null;      // can be require-id number or { uri: ... }
  const parsedImage = image ? JSON.parse(image as string) : null; // can be number (require) or { uri: ... }

  const { isDark } = useSettings();
  const palette = getPalette(Boolean(isDark));
  const styles = getStyles(palette);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0); // ms
  const [duration, setDuration] = useState(1); // ms

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesFS();

  // Unique ID for this track (use title like in the rest of the app)
  const trackId = (title as string) || "unknown_track";

  const handleFavorite = () => {
    const favorite: Favorite = {
      id: trackId,
      title: title as string,
      type: "music",
      file: parsedUrl,      // only used in this screen; persisted schema keeps title for music
      image: parsedImage,   // used for UI; elsewhere your list maps by title to local assets
    };

    if (isFavorite(trackId)) {
      removeFavorite(trackId);
    } else {
      addFavorite(favorite);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const togglePlay = async () => {
    if (!sound && parsedUrl) {
      const { sound: newSound } = await Audio.Sound.createAsync(parsedUrl, { shouldPlay: true });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 1);
          setIsPlaying(status.isPlaying);
        }
      });
    } else if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color={palette.headerIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavorite}>
          <Ionicons
            name={isFavorite(trackId) ? "heart" : "heart-outline"}
            size={28}
            color={isFavorite(trackId) ? palette.favoriteOn : palette.headerIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Artwork + Title */}
      {parsedImage && (
        <Image
          source={parsedImage}
          style={[styles.artwork, { backgroundColor: palette.artworkBg, borderColor: palette.artworkBorder }]}
        />
      )}

      <Text style={[styles.title, { color: palette.title }]}>{title}</Text>

      {/* Progress */}
      <Slider
        style={{ width: "80%", height: 40 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor={palette.accent}   // accent for progress
        maximumTrackTintColor={palette.sliderTrack}
        thumbTintColor={palette.sliderThumb}
      />
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, { color: palette.timeText }]}>{formatTime(position)}</Text>
        <Text style={[styles.timeText, { color: palette.timeText }]}>{formatTime(duration)}</Text>
      </View>

      {/* Play/Pause */}
      <TouchableOpacity style={[styles.playBtn, { backgroundColor: palette.playBtnBg }]} onPress={togglePlay}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color={palette.playIcon} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (p: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    header: {
      position: "absolute",
      top: 50,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      zIndex: 10,
    },
    backButton: {
      padding: 8,
    },
    favoriteButton: {
      padding: 8,
    },
    artwork: {
      width: 300,
      height: 300,
      borderRadius: 20,
      marginBottom: 30,
      marginTop: 40, // room for header
      borderWidth: 1,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 30,
      textAlign: "center",
    },
    playBtn: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "80%",
      marginTop: 10,
    },
    timeText: {
      fontSize: 14,
    },
  });

export { };

