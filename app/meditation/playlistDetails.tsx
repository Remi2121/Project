import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../utils/firebaseConfig";

// Local assets map (same titles as main)
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

type Track = { title: string; file: any; image?: any };
type SleepStory = { identifier: string; title: string; creator: string };
type Playlist = { id: string; name: string; tracks: (Track | SleepStory)[]; created: Date };

const LOCAL_ASSET_MAP: Record<string, { file: any; image: any }> = {
  "Calm Mind": { file: calm_water, image: require("../../assets/thumbnails/calm_water.png") },
  "Ocean Waves": { file: ocean_waves, image: require("../../assets/thumbnails/ocean_waves.png") },
  "Zen Garden": { file: zen_garden, image: require("../../assets/thumbnails/zen_garden.png") },
  "Tranquil Forest": { file: tranquil_forest, image: require("../../assets/thumbnails/tranquil_forest.png") },
  "Morning Relaxation": { file: morning_relaxation, image: require("../../assets/thumbnails/morning_relaxation.png") },
  "Heaven Water": { file: heaven_water, image: require("../../assets/thumbnails/heaven_water.png") },
  "Perfect Rain": { file: perfect_rain, image: require("../../assets/thumbnails/perfect_rain.png") },
  "Soft Water": { file: soft_water, image: require("../../assets/thumbnails/soft_water.png") },
  "Birds Singing": { file: birds_singing, image: require("../../assets/thumbnails/birds_singing.png") },
  "Soft Guitar": { file: soft_guitar, image: require("../../assets/thumbnails/soft_guitar.png") },
  "Peaceful Vibes": { file: peaceful, image: require("../../assets/thumbnails/peaceful.png") },
  "Peace & Happy": { file: peace_happy, image: require("../../assets/thumbnails/peace_happy.png") },
  "Motivational": { file: motivational, image: require("../../assets/thumbnails/motivational.png") },
  "Om Chanting": { file: om_chanting, image: require("../../assets/thumbnails/om_chanting.png") },
  "Temple Sounds": { file: temple, image: require("../../assets/thumbnails/temple.png") },
};

// Files
const ROOT = FileSystem.documentDirectory + "moodify/";
const PL_DIR = ROOT + "playlists/";
const plFile = (uid: string) => `${PL_DIR}${uid}.txt`;

type StoredPlaylists = {
  playlists: {
    id: string;
    name: string;
    created: number;
    tracks: (| { kind: "music"; title: string }
      | { kind: "sleep-story"; id: string; title: string; author?: string })[];
  }[];
};

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

const usePlaylists = () => {
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setPlaylists([]); setIsLoaded(true); return; }
      const data = await readJSON<StoredPlaylists>(plFile(user.uid), { playlists: [] });
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
    const user = auth.currentUser; if (!user) return;
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
    await writeJSON(plFile(user.uid), out);
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
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
  };

  const deletePlaylist = async (playlistId: string) => {
    const next = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(next);
    await persist(next);
  };

  return { playlists, removeFromPlaylist, deletePlaylist, isLoaded };
};

const getAudioUrl = async (identifier: string): Promise<string | null> => {
  try {
    const metadataResponse = await fetch(`https://archive.org/metadata/${identifier}`);
    const metadata = await metadataResponse.json();
    if (!metadata.files) return null;
    const mp3Files = metadata.files.filter((f: any) => f.format === "VBR MP3" || f.name.toLowerCase().endsWith(".mp3"));
    if (mp3Files.length === 0) return null;
    const sorted = mp3Files.sort((a: any, b: any) => (a.size || 0) - (b.size || 0));
    return `https://archive.org/download/${identifier}/${sorted[0].name}`;
  } catch (e) {
    return null;
  }
};

export default function PlaylistDetailScreen() {
  const { playlistId } = useLocalSearchParams();
  const { playlists, removeFromPlaylist, deletePlaylist, isLoaded } = usePlaylists();
  const actualPlaylistId = Array.isArray(playlistId) ? playlistId[0] : playlistId;
  const playlist = playlists.find((p) => p.id === actualPlaylistId);

  if (!isLoaded) {
    return (
      <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={playlistDetailStyles.container}>
        <View style={playlistDetailStyles.loadingContainer}>
          <Text style={playlistDetailStyles.loadingText}>Loading playlist...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!playlist) {
    return (
      <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={playlistDetailStyles.container}>
        <View style={playlistDetailStyles.header}>
          <TouchableOpacity style={playlistDetailStyles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={playlistDetailStyles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={playlistDetailStyles.errorContainer}>
          <Text style={playlistDetailStyles.errorText}>Playlist not found</Text>
          <TouchableOpacity style={playlistDetailStyles.backButton} onPress={() => router.back()}>
            <Text style={playlistDetailStyles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={playlistDetailStyles.container}>
      {/* Header */}
      <View style={playlistDetailStyles.header}>
        <TouchableOpacity style={playlistDetailStyles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={playlistDetailStyles.headerCenter}>
          <Text style={playlistDetailStyles.title}>{playlist.name}</Text>
          <Text style={playlistDetailStyles.subtitle}>
            {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
          </Text>
        </View>

        <TouchableOpacity
          style={playlistDetailStyles.deleteButton}
          onPress={async () => {
            await deletePlaylist(playlist.id);
            router.back();
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      <ScrollView style={playlistDetailStyles.content}>
        {playlist.tracks.length === 0 ? (
          <View style={playlistDetailStyles.emptyContainer}>
            <Ionicons name="musical-notes" size={64} color="#9ff1ff" />
            <Text style={playlistDetailStyles.emptyTitle}>No Tracks Yet</Text>
            <Text style={playlistDetailStyles.emptyText}>
              Add some tracks or stories to this playlist!
            </Text>
          </View>
        ) : (
          playlist.tracks.map((track, index) => (
            <View key={`${"identifier" in track ? track.identifier : track.title}-${index}`} style={playlistDetailStyles.trackItem}>
              {"file" in track ? (
                <>
                  <Image source={(track as Track).image} style={playlistDetailStyles.trackImage} />
                  <View style={playlistDetailStyles.trackInfo}>
                    <Text style={playlistDetailStyles.trackTitle}>{(track as Track).title}</Text>
                    <Text style={playlistDetailStyles.trackType}>🎵 Music</Text>
                  </View>
                  <TouchableOpacity
                    style={playlistDetailStyles.playButton}
                    onPress={() =>
                      router.push({
                        pathname: "/meditation/Player",
                        params: { title: (track as Track).title, url: (track as Track).file, image: (track as Track).image },
                      })
                    }
                  >
                    <Ionicons name="play" size={20} color="#0d0b2f" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Image
                    source={{ uri: `https://archive.org/services/img/${(track as SleepStory).identifier}` }}
                    style={playlistDetailStyles.trackImage}
                    defaultSource={require("../../assets/images/Sleep-PNG-Clipart.png")}
                  />
                  <View style={playlistDetailStyles.trackInfo}>
                    <Text style={playlistDetailStyles.trackTitle}>{(track as SleepStory).title}</Text>
                    <Text style={playlistDetailStyles.trackAuthor}>By: {(track as SleepStory).creator}</Text>
                    <Text style={playlistDetailStyles.trackType}>📖 Sleep Story</Text>
                  </View>
                  <TouchableOpacity
                    style={playlistDetailStyles.playButton}
                    onPress={async () => {
                      const audioUrl = await getAudioUrl((track as SleepStory).identifier);
                      if (audioUrl) {
                        router.push({
                          pathname: "/meditation/talesPlayer",
                          params: {
                            title: (track as SleepStory).title,
                            url: audioUrl,
                            author: (track as SleepStory).creator,
                            image: `https://archive.org/services/img/${(track as SleepStory).identifier}`,
                          },
                        });
                      }
                    }}
                  >
                    <Ionicons name="play" size={20} color="#0d0b2f" />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={playlistDetailStyles.removeButton}
                onPress={() => removeFromPlaylist(playlist.id, "file" in track ? (track as Track).title : (track as SleepStory).identifier)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const playlistDetailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0b2f", padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 50,
    marginBottom: -30,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backText: { 
    color: "#fff", 
    fontSize: 16, 
    marginLeft: 4 
  },
  headerCenter: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  title: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "700", 
    textAlign: "center", 
    marginBottom: 2, 
    marginTop: 10 
  },
  subtitle: { 
    color: "#cfd3ff", 
    fontSize: 14, 
    textAlign: "center", 
    marginTop: 4 
  },
  deleteButton: { 
    padding: 8
   },
  content: { 
    flex: 1, 
    padding: 16 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 40,
    marginTop: 60 
  },
  emptyTitle: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "700", 
    marginTop: 16, 
    marginBottom: 8 
  },
  emptyText: { 
    color: "#cfd3ff", 
    fontSize: 16, textAlign: "center", lineHeight: 22 
  },
  trackItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.25)", 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12 },
  trackImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 8, 
    marginRight: 12 
  },
  trackInfo: { 
    flex: 1 
  },
  trackTitle: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 4 
  },
  trackAuthor: { 
    color: "#cfd3ff", 
    fontSize: 12, 
    marginBottom: 4 
  },
  trackType: { 
    color: "#9ff1ff", 
    fontSize: 12, 
    fontWeight: "500" 
  },
  playButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#9ff1ff", 
    alignItems: "center", 
    justifyContent: "center", 
    marginHorizontal: 8 
  },
  removeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "rgba(255,107,107,0.2)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  errorText: { 
    color: "#fff", 
    fontSize: 18, 
    textAlign: "center", 
    marginBottom: 20 
  },
});
