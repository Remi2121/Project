import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

type Track = { title: string; file: any; image?: any };
type SleepStory = {
  identifier: string;
  title: string;
  creator: string;
};
type Playlist = {
  id: string;
  name: string;
  tracks: (Track | SleepStory)[];
  created: Date;
};

// Use the same hook implementation as in your main screen
const usePlaylists = () => {
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load playlists on mount
  React.useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const stored = await AsyncStorage.getItem('@playlists');
      console.log('Loaded playlists from storage:', stored);
      if (stored) {
        const parsedPlaylists = JSON.parse(stored);
        setPlaylists(parsedPlaylists);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setIsLoaded(true);
    }
  };

  const savePlaylists = async (newPlaylists: Playlist[]) => {
    try {
      console.log('Saving playlists:', newPlaylists);
      await AsyncStorage.setItem('@playlists', JSON.stringify(newPlaylists));
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  };

  // Save playlists whenever they change
  React.useEffect(() => {
    if (isLoaded && playlists.length >= 0) {
      savePlaylists(playlists);
    }
  }, [playlists, isLoaded]);

  const removeFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev =>
      prev.map(playlist =>
        playlist.id === playlistId
          ? {
            ...playlist, tracks: playlist.tracks.filter(track =>
              ('identifier' in track ? track.identifier : track.title) !== trackId
            )
          }
          : playlist
      )
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  return { playlists, removeFromPlaylist, deletePlaylist, isLoaded };
};

const getAudioUrl = async (identifier: string): Promise<string | null> => {
  try {
    const metadataResponse = await fetch(
      `https://archive.org/metadata/${identifier}`
    );
    const metadata = await metadataResponse.json();

    if (!metadata.files) return null;

    const mp3Files = metadata.files.filter((file: any) =>
      file.format === 'VBR MP3' || file.name.toLowerCase().endsWith('.mp3')
    );

    if (mp3Files.length === 0) return null;

    const sortedFiles = mp3Files.sort((a: any, b: any) =>
      (a.size || 0) - (b.size || 0)
    );

    return `https://archive.org/download/${identifier}/${sortedFiles[0].name}`;

  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
};

export default function PlaylistDetailScreen() {
  const { playlistId } = useLocalSearchParams();
  const { playlists, removeFromPlaylist, deletePlaylist, isLoaded } = usePlaylists();
  
  // Ensure playlistId is a string (it can be an array from useLocalSearchParams)
  const actualPlaylistId = Array.isArray(playlistId) ? playlistId[0] : playlistId;
  
  const playlist = playlists.find(p => p.id === actualPlaylistId);

  // Show loading state
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
          <TouchableOpacity 
            style={playlistDetailStyles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={playlistDetailStyles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={playlistDetailStyles.errorContainer}>
          <Text style={playlistDetailStyles.errorText}>Playlist not found</Text>
          <TouchableOpacity 
            style={playlistDetailStyles.backButton}
            onPress={() => router.back()}
          >
            <Text style={playlistDetailStyles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={playlistDetailStyles.container}>
      {/* Fixed Header Section */}
      <View style={playlistDetailStyles.header}>
        <TouchableOpacity 
          style={playlistDetailStyles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={playlistDetailStyles.headerCenter}>
          <Text style={playlistDetailStyles.title}>{playlist.name}</Text>
          <Text style={playlistDetailStyles.subtitle}>
            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
          </Text>
        </View>

        <TouchableOpacity
          style={playlistDetailStyles.deleteButton}
          onPress={() => {
            deletePlaylist(playlist.id);
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
            <View key={`${'identifier' in track ? track.identifier : track.title}-${index}`} style={playlistDetailStyles.trackItem}>
              {'file' in track ? (
                // Music track
                <>
                  <Image source={track.image} style={playlistDetailStyles.trackImage} />
                  <View style={playlistDetailStyles.trackInfo}>
                    <Text style={playlistDetailStyles.trackTitle}>{track.title}</Text>
                    <Text style={playlistDetailStyles.trackType}>🎵 Music</Text>
                  </View>
                  <TouchableOpacity
                    style={playlistDetailStyles.playButton}
                    onPress={() =>
                      router.push({
                        pathname: "/meditation/Player",
                        params: { title: track.title, url: track.file, image: track.image },
                      })
                    }
                  >
                    <Ionicons name="play" size={20} color="#0d0b2f" />
                  </TouchableOpacity>
                </>
              ) : (
                // Sleep story
                <>
                  <Image 
                    source={{ uri: `https://archive.org/services/img/${track.identifier}` }} 
                    style={playlistDetailStyles.trackImage} 
                    defaultSource={require('../../assets/images/Sleep-PNG-Clipart.png')}
                  />
                  <View style={playlistDetailStyles.trackInfo}>
                    <Text style={playlistDetailStyles.trackTitle}>{track.title}</Text>
                    <Text style={playlistDetailStyles.trackAuthor}>By: {track.creator}</Text>
                    <Text style={playlistDetailStyles.trackType}>📖 Sleep Story</Text>
                  </View>
                  <TouchableOpacity
                    style={playlistDetailStyles.playButton}
                    onPress={async () => {
                      const audioUrl = await getAudioUrl(track.identifier);
                      if (audioUrl) {
                        router.push({
                          pathname: "/meditation/talesPlayer",
                          params: {
                            title: track.title,
                            url: audioUrl,
                            author: track.creator,
                            image: `https://archive.org/services/img/${track.identifier}`
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
                onPress={() => removeFromPlaylist(playlist.id, 'identifier' in track ? track.identifier : track.title)}
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
 container: {
    flex: 1,
    backgroundColor: "#0d0b2f",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 50,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
    fontSize: 16,
    marginLeft: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 10,
    
  },
  subtitle: {
    color: '#cfd3ff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#cfd3ff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackAuthor: {
    color: '#cfd3ff',
    fontSize: 12,
    marginBottom: 4,
  },
  trackType: {
    color: '#9ff1ff',
    fontSize: 12,
    fontWeight: '500',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9ff1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,107,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});