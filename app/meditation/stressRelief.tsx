import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Animated, Easing, Button, Modal, TextInput, FlatList, ActivityIndicator, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';


// --- Stress audio imports ---
import calm_water from "../../assets/audio/stress/calm_water.mp3";
import ocean_waves from "../../assets/audio/stress/ocean_waves.mp3";
import zen_garden from "../../assets/audio/stress/zen_garden.mp3";
import tranquil_forest from "../../assets/audio/stress/tranquil_forest.mp3";
import morning_relaxation from "../../assets/audio/stress/morning_relaxation.mp3";
import heaven_water from "../../assets/audio/stress/heaven_water.mp3";
import om_chanting from "../../assets/audio/stress/om_chanting.mp3";
import perfect_rain from "../../assets/audio/stress/perfect_rain.mp3";
import temple from "../../assets/audio/stress/temple.mp3";
import peaceful from "../../assets/audio/stress/peaceful.mp3";
import motivational from "../../assets/audio/stress/motivational.mp3";
import soft_water from "../../assets/audio/stress/soft_water.mp3";
import peace_happy from "../../assets/audio/stress/peace_happy.mp3";
import soft_guitar from "../../assets/audio/stress/soft_guitar.mp3";
import birds_singing from "../../assets/audio/stress/birds_singing.mp3";



type Track = { title: string; file: any; image?: any };
type Category = {
  key: string; label: string; tracks?: Track[];
  subcategories?: { title: string; tracks: Track[] }[];
};

const CATEGORIES: Category[] = [
  {
    key: "stress",
    label: "Stress Relief",
    subcategories: [
      {
        title: "Nature Sounds",
        tracks: [
          { title: "Calm Mind", file: calm_water, image: require("../../assets/thumbnails/calm_water.png") },
          { title: "Ocean Waves", file: ocean_waves, image: require("../../assets/thumbnails/ocean_waves.png") },
          { title: "Zen Garden", file: zen_garden, image: require("../../assets/thumbnails/zen_garden.png") },
          { title: "Tranquil Forest", file: tranquil_forest, image: require("../../assets/thumbnails/tranquil_forest.png") },
          { title: "Morning Relaxation", file: morning_relaxation, image: require("../../assets/thumbnails/morning_relaxation.png") },
          { title: "Heaven Water", file: heaven_water, image: require("../../assets/thumbnails/heaven_water.png") },
          { title: "Perfect Rain", file: perfect_rain, image: require("../../assets/thumbnails/perfect_rain.png") },
          { title: "Soft Water", file: soft_water, image: require("../../assets/thumbnails/soft_water.png") },
          { title: "Birds Singing", file: birds_singing, image: require("../../assets/thumbnails/birds_singing.png") },
        ],
      },
      {
        title: "Instrumentals",
        tracks: [
          { title: "Soft Guitar", file: soft_guitar, image: require("../../assets/thumbnails/soft_guitar.png") },
          { title: "Peaceful Vibes", file: peaceful, image: require("../../assets/thumbnails/peaceful.png") },
          { title: "Peace & Happy", file: peace_happy, image: require("../../assets/thumbnails/peace_happy.png") },
        ],
      },
      {
        title: "Motivational",
        tracks: [
          { title: "Motivational", file: motivational, image: require("../../assets/thumbnails/motivational.png") },
          { title: "Om Chanting", file: om_chanting, image: require("../../assets/thumbnails/om_chanting.png") },
          { title: "Temple Sounds", file: temple, image: require("../../assets/thumbnails/temple.png") },
        ],
      },
    ],
  },

  {
    key: "sleep",
    label: "Sleep Tales",
    subcategories: [
      {
        title: "Popular Stories",
        tracks: []
      },
      {
        title: "Recommended for You",
        tracks: []
      },
      {
        title: "New Releases",
        tracks: []
      },
      {
        title: "Classics",
        tracks: []
      },
      {
        title: "For Kids",
        tracks: []
      },
    ]
  },
  { key: "focus", label: "Focus" },
];

// Add these types at the top
type Favorite = {
  id: string;
  title: string;
  type: 'music' | 'sleep-story';
  file?: any;
  url?: string;
  image: any;
  author?: string;
};

type Playlist = {
  id: string;
  name: string;
  tracks: (Track | SleepStory)[];
  created: Date;
};

// --- Sleep Component ---
type SleepStory = {
  identifier: string;
  title: string;
  creator: string;
};

// Add storage hook (you can use AsyncStorage or a proper state management)
const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Load favorites from storage when component mounts
  useEffect(() => {
     console.log('Loading favorites from storage...');
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('@favorites');
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        //console.log('Parsed favorites:', parsedFavorites);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites: Favorite[]) => {
    try {
      //console.log('Saving favorites:', newFavorites);
      await AsyncStorage.setItem('@favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  useEffect(() => {
    if (favorites.length > 0) {
      saveFavorites(favorites);
    }
  }, [favorites]);

  const addFavorite = (item: Favorite) => {
    setFavorites(prev => {
      const exists = prev.find(fav => fav.id === item.id);
      if (exists) return prev; // Don't add duplicates
      const newFavorites = [...prev, item];
      return newFavorites;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id);
  };

  return { favorites, addFavorite, removeFavorite, isFavorite };
};

const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (isLoaded && playlists.length >= 0) {
      savePlaylists(playlists);
    }
  }, [playlists, isLoaded]);

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      created: new Date()
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const addToPlaylist = (playlistId: string, track: Track | SleepStory) => {
    setPlaylists(prev =>
      prev.map(playlist =>
        playlist.id === playlistId
          ? { ...playlist, tracks: [...playlist.tracks, track] }
          : playlist
      )
    );
  };

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

  return { playlists, createPlaylist, addToPlaylist, removeFromPlaylist, isLoaded };
};

// --- Stress Component ---
function StressUI({ subcategories, navigation, favoritesData}: { subcategories: { title: string; tracks: Track[] }[]; navigation: any;favoritesData: ReturnType<typeof useFavorites>; }) {
  const { addFavorite, removeFavorite, isFavorite } = favoritesData;
  const { addToPlaylist, playlists, createPlaylist } = usePlaylists();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const handleFavorite = (track: Track) => {
    const favorite: Favorite = {
      id: track.title,
      title: track.title,
      type: 'music',
      file: track.file,
      image: track.image,
    };

    if (isFavorite(track.title)) {
      removeFavorite(track.title);
    } else {
      addFavorite(favorite);
    }
  };

  const openPlaylistModal = (track: Track) => {
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  return (
    <>
      <Text style={styles.helper}>Play Music And Relieve Stress</Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {subcategories.map((subcategory) => (
          <View key={subcategory.title} style={stressStyles.subcategorySection}>
            <Text style={stressStyles.subcategoryTitle}>{subcategory.title}</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={stressStyles.horizontalScrollContent}
            >
              {subcategory.tracks.map((track) => (
                <View key={track.title} style={stressStyles.trackCard}>
                  <TouchableOpacity
                    style={stressStyles.cardContent}
                    onPress={() =>
                      router.push({
                        pathname: "/meditation/Player",
                        params: { title: track.title, url: track.file, image: track.image },
                      })
                    }
                  >
                    <Image source={track.image} style={stressStyles.trackCardImage} resizeMode="cover" />
                    <Text style={stressStyles.trackCardTitle}>{track.title}</Text>
                    <View style={stressStyles.playButton}>
                      <Ionicons name="play" size={16} color="#0d0b2f" />
                    </View>
                  </TouchableOpacity>

                  {/* Favorite and Add to Playlist Buttons */}
                  <View style={stressStyles.actionButtons}>
                    <TouchableOpacity
                      style={stressStyles.favoriteButton}
                      onPress={() => handleFavorite(track)}
                    >
                      <Ionicons
                        name={isFavorite(track.title) ? "heart" : "heart-outline"}
                        size={20}
                        color={isFavorite(track.title) ? "#ff6b6b" : "#fff"}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={stressStyles.playlistButton}
                      onPress={() => openPlaylistModal(track)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#9ff1ff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Playlist Selection Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={stressStyles.modalContainer}>
          <View style={stressStyles.modalContent}>
            <Text style={stressStyles.modalTitle}>Add to Playlist</Text>
            <Text style={stressStyles.modalSubtitle}>{selectedTrack?.title}</Text>

            {playlists.map(playlist => (
              <TouchableOpacity
                key={playlist.id}
                style={stressStyles.playlistItem}
                onPress={() => {
                  if (selectedTrack) {
                    addToPlaylist(playlist.id, selectedTrack);
                    setShowPlaylistModal(false);
                  }
                }}
              >
                <Text style={stressStyles.playlistName}>{playlist.name}</Text>
                <Text style={stressStyles.playlistCount}>{playlist.tracks.length} tracks</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={stressStyles.newPlaylistButton}
              onPress={() => {
                // Create new playlist and add track
                const newPlaylist = createPlaylist(`My Playlist ${playlists.length + 1}`);
                if (selectedTrack) {
                  addToPlaylist(newPlaylist.id, selectedTrack);
                }
                setShowPlaylistModal(false);
              }}
            >
              <Ionicons name="add" size={24} color="#0d0b2f" />
              <Text style={stressStyles.newPlaylistText}>Create New Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={stressStyles.cancelButton}
              onPress={() => setShowPlaylistModal(false)}
            >
              <Text style={stressStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Favorites UI Component
function FavoritesUI({ favoritesData }: { favoritesData: ReturnType<typeof useFavorites> }) {
  const { favorites, removeFavorite } = favoritesData;

  if (favorites.length === 0) {
    return (
      <View style={favoritesStyles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#9ff1ff" />
        <Text style={favoritesStyles.emptyTitle}>No Favorites Yet</Text>
        <Text style={favoritesStyles.emptyText}>Start adding your favorite tracks and stories!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }}>
      <Text style={favoritesStyles.title}>Your Favorites</Text>
      {favorites.map(favorite => (
        <View key={favorite.id} style={favoritesStyles.favoriteItem}>
          <Image source={favorite.image=='string' ?{ uri: favorite.image } : favorite.image} style={favoritesStyles.favoriteImage}  resizeMode="cover"/>
          <View style={favoritesStyles.favoriteInfo}>
            <Text style={favoritesStyles.favoriteTitle}>{favorite.title}</Text>
            {favorite.author && favorite.author !== "Unknown Author" && (
              <Text style={favoritesStyles.favoriteAuthor}>By: {favorite.author}</Text>
            )}
            <Text style={favoritesStyles.favoriteType}>
              {favorite.type === 'music' ? '🎵 Music' : '📖 Sleep Story'}
            </Text>
          </View>
          <TouchableOpacity
            style={favoritesStyles.playButton}
            onPress={() => {
              if (favorite.type === 'music') {
                router.push({
                  pathname: "/meditation/Player",
                  params: { title: favorite.title, url: favorite.file, image: favorite.image },
                });
              } else {
                router.push({
                  pathname: "/meditation/talesPlayer",
                  params: {
                    title: favorite.title,
                    url: favorite.url,
                    image: favorite.image,
                    author: favorite.author
                  },
                });
              }
            }}
          >
            <Ionicons name="play" size={20} color="#0d0b2f" />
          </TouchableOpacity>
          <TouchableOpacity
            style={favoritesStyles.removeButton}
            onPress={() => removeFavorite(favorite.id)}
          >
            <Ionicons name="heart" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// Playlists UI Component
function PlaylistsUI() {
  const { playlists, createPlaylist } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }}>
      <TouchableOpacity
        style={playlistsStyles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#0d0b2f" />
        <Text style={playlistsStyles.createButtonText}>Create New Playlist</Text>
      </TouchableOpacity>

      {playlists.length === 0 ? (
        <View style={playlistsStyles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#9ff1ff" />
          <Text style={playlistsStyles.emptyTitle}>No Playlists Yet</Text>
          <Text style={playlistsStyles.emptyText}>Create your first playlist to organize your favorite content!</Text>
        </View>
      ) : (
        playlists.map(playlist => (
          <TouchableOpacity
            key={playlist.id}
            style={playlistsStyles.playlistItem}
            onPress={() => {
              // Navigate to playlist detail screen
              router.push({
                pathname: "/meditation/playlistDetails",
                params: { playlistId: playlist.id }
              });
            }}
          >
            <View style={playlistsStyles.playlistImage}>
              <Ionicons name="musical-notes" size={32} color="#0d0b2f" />
            </View>
            <View style={playlistsStyles.playlistInfo}>
              <Text style={playlistsStyles.playlistName}>{playlist.name}</Text>
              <Text style={playlistsStyles.playlistCount}>
                {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cfd3ff" />
          </TouchableOpacity>
        ))
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={playlistsStyles.modalContainer}>
          <View style={playlistsStyles.modalContent}>
            <Text style={playlistsStyles.modalTitle}>Create New Playlist</Text>
            <TextInput
              style={playlistsStyles.nameInput}
              placeholder="Playlist name"
              placeholderTextColor="#ccc"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TouchableOpacity
              style={[
                playlistsStyles.createConfirmButton,
                !newPlaylistName && playlistsStyles.createConfirmButtonDisabled
              ]}
              onPress={() => {
                if (newPlaylistName) {
                  createPlaylist(newPlaylistName);
                  setNewPlaylistName('');
                  setShowCreateModal(false);
                }
              }}
              disabled={!newPlaylistName}
            >
              <Text style={playlistsStyles.createConfirmText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={playlistsStyles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={playlistsStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ----stress styles ----
const stressStyles = StyleSheet.create({
  subcategorySection: {
    marginBottom: 24,
  },
  subcategoryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 8,
  },
  trackCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    position: "relative",
  },
  cardContent: {
    alignItems: "center",
    width: "100%",
  },
  trackCardImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  trackCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    flexShrink: 1,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9ff1ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9ff1ff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  playlistButton: {
    padding: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d0b2f',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#cfd3ff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: 8,
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  playlistCount: {
    color: '#9ff1ff',
    fontSize: 12,
  },
  newPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9ff1ff',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  newPlaylistText: {
    color: '#0d0b2f',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
});

// --- Favorites Styles ---
const favoritesStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 8,
  },
  favoriteImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteAuthor: {
    color: '#cfd3ff',
    fontSize: 12,
    marginBottom: 4,
  },
  favoriteType: {
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
    marginLeft: 4,
  },
});

// --- Playlists Styles ---
const playlistsStyles = StyleSheet.create({
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9ff1ff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#0d0b2f',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 8,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9ff1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistCount: {
    color: '#cfd3ff',
    fontSize: 14,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d0b2f',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  createConfirmButton: {
    backgroundColor: '#9ff1ff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  createConfirmButtonDisabled: {
    opacity: 0.5,
  },
  createConfirmText: {
    color: '#0d0b2f',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
});

// --- Sleep Component with Horizontal Subcategories ---
function SleepUI({ favoritesData }: { favoritesData: ReturnType<typeof useFavorites> }) {
  
  const [stories, setStories] = useState<SleepStory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { addFavorite, removeFavorite, isFavorite } = favoritesData;
  const { playlists, createPlaylist, addToPlaylist } = usePlaylists();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<SleepStory | null>(null);

  // Group stories into subcategories based on some criteria
  const sleepSubcategories = useMemo(() => {
    if (!stories.length) return [];

    // Simple grouping logic - you can customize this based on your needs
    return [
      {
        title: "Popular Stories",
        tracks: stories.slice(0, 6) // First 6 as popular
      },
      {
        title: "Recommended for You",
        tracks: stories.slice(6, 12) // Next 6 as recommended
      },
      {
        title: "New Releases",
        tracks: stories.slice(12, 18) // Next 6 as new releases
      },
      {
        title: "Classics",
        tracks: stories.slice(18, 24) // Next 6 as classics
      },
      {
        title: "For Kids",
        tracks: stories.slice(0, 6) // You might want different logic for kids content
      }
    ].filter(category => category.tracks.length > 0);
  }, [stories]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch(
          "https://archive.org/advancedsearch.php?q=collection%3A%22librivoxaudio%22+AND+format%3A%22VBR+MP3%22&fl[]=identifier,title,creator&sort[]=downloads+desc&rows=30&output=json"
        );

        const data = await response.json();

        if (data.response && data.response.docs) {
          setStories(data.response.docs.slice(0, 24)); // Limit to 24 for better grouping
        } else {
          setStories(getFallbackStories());
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        setStories(getFallbackStories());
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const getFallbackStories = (): SleepStory[] => [
    {
      identifier: "adventures_sherlock_holmes_001_librivox",
      title: "The Adventures of Sherlock Holmes",
      creator: "Arthur Conan Doyle"
    },
    {
      identifier: "alice_in_wonderland_librivox",
      title: "Alice's Adventures in Wonderland",
      creator: "Lewis Carroll"
    },
    {
      identifier: "pride_and_prejudice_librivox",
      title: "Pride and Prejudice",
      creator: "Jane Austen"
    },
    {
      identifier: "dracula_librivox",
      title: "Dracula",
      creator: "Bram Stoker"
    },
    {
      identifier: "frankenstein_librivox",
      title: "Frankenstein",
      creator: "Mary Shelley"
    },
    {
      identifier: "moby_dick_librivox",
      title: "Moby Dick",
      creator: "Herman Melville"
    }
  ];

  // Function to navigate to player screen
  const navigateToPlayer = async (story: SleepStory) => {
    try {
      // Get the audio URL first
      const audioUrl = await getAudioUrl(story.identifier);

      if (!audioUrl) {
        alert("Sorry, this story is not available at the moment.");
        return;
      }

      // Navigate to player screen with story details
      router.push({
        pathname: "/meditation/talesPlayer",
        params: {
          title: story.title,
          url: audioUrl,
          author: story.creator || "Unknown Author",
          type: "sleep-story",
          image: `https://archive.org/services/img/${story.identifier}`
        }
      });

    } catch (error) {
      console.error("Error preparing story:", error);
      alert("Error loading this story. Please try another one.");
    }
  };

  // Function to get audio URL
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

  // Handle adding/removing favorites
  const handleFavorite = async (story: SleepStory) => {
    try {
      const audioUrl = await getAudioUrl(story.identifier);
      const favorite: Favorite = {
        id: story.identifier,
        title: story.title,
        type: 'sleep-story',
        url: audioUrl || '',
        image: { uri: `https://archive.org/services/img/${story.identifier}` },
        author: story.creator,
      };

      if (isFavorite(story.identifier)) {
        removeFavorite(story.identifier);
      } else {
        addFavorite(favorite);
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      alert("Error saving to favorites");
    }
  };

  // Handle playlist modal
  const openPlaylistModal = (story: SleepStory) => {
    setSelectedStory(story);
    setShowPlaylistModal(true);
  };

  if (loading) {
    return (
      <View style={sleepStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
        <Text style={sleepStyles.loadingText}>Loading bedtime stories...</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={sleepStyles.helper}>Wind Down With Bedtime Tales 🌙</Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontal Subcategories */}
        {sleepSubcategories.map((subcategory) => (
          <View key={subcategory.title} style={sleepStyles.subcategorySection}>
            {/* Subcategory Header */}
            <Text style={sleepStyles.subcategoryTitle}>{subcategory.title}</Text>

            {/* Horizontal ScrollView for Stories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={sleepStyles.horizontalScrollContent}
            >
              {subcategory.tracks.map((story) => (
                <View key={story.identifier} style={sleepStyles.storyCard}>
                  <TouchableOpacity
                    style={sleepStyles.cardContent}
                    onPress={() => navigateToPlayer(story)}
                  >
                    <Image
                      source={{ uri: `https://archive.org/services/img/${story.identifier}` }}
                      style={sleepStyles.storyCardImage}
                      defaultSource={require('../../assets/images/Sleep-PNG-Clipart.png')}
                    />
                    <Text style={sleepStyles.storyCardTitle} numberOfLines={2}>
                      {story.title || "Untitled Story"}
                    </Text>
                    <Text style={sleepStyles.storyCardAuthor} numberOfLines={1}>
                      By: {story.creator || "Unknown Author"}
                    </Text>

                    {/* Play Button */}
                    <View style={sleepStyles.playButtonContainer}>
                      <View style={sleepStyles.playButton}>
                        <Ionicons name="play" size={16} color="#0d0b2f" />
                      </View>
                      <Text style={sleepStyles.playButtonText}>Play Story</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Favorite and Add to Playlist Buttons */}
                  <View style={sleepStyles.actionButtons}>
                    <TouchableOpacity
                      style={sleepStyles.favoriteButton}
                      onPress={() => handleFavorite(story)}
                    >
                      <Ionicons
                        name={isFavorite(story.identifier) ? "heart" : "heart-outline"}
                        size={20}
                        color={isFavorite(story.identifier) ? "#ff6b6b" : "#fff"}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={sleepStyles.playlistButton}
                      onPress={() => openPlaylistModal(story)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#9ff1ff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Playlist Selection Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={sleepStyles.modalContainer}>
          <View style={sleepStyles.modalContent}>
            <Text style={sleepStyles.modalTitle}>Add to Playlist</Text>
            <Text style={sleepStyles.modalSubtitle}>{selectedStory?.title}</Text>

            {playlists.map(playlist => (
              <TouchableOpacity
                key={playlist.id}
                style={sleepStyles.playlistItem}
                onPress={() => {
                  if (selectedStory) {
                    addToPlaylist(playlist.id, selectedStory);
                    setShowPlaylistModal(false);
                  }
                }}
              >
                <Text style={sleepStyles.playlistName}>{playlist.name}</Text>
                <Text style={sleepStyles.playlistCount}>{playlist.tracks.length} tracks</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={sleepStyles.newPlaylistButton}
              onPress={() => {
                const newPlaylist = createPlaylist(`My Playlist ${playlists.length + 1}`);
                if (selectedStory) {
                  addToPlaylist(newPlaylist.id, selectedStory);
                }
                setShowPlaylistModal(false);
              }}
            >
              <Ionicons name="add" size={24} color="#0d0b2f" />
              <Text style={sleepStyles.newPlaylistText}>Create New Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={sleepStyles.cancelButton}
              onPress={() => setShowPlaylistModal(false)}
            >
              <Text style={sleepStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// --- Sleep Styles ----
const sleepStyles = StyleSheet.create({
  helper: {
    color: "#E6E8FF",
    opacity: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
    textAlign: "center",
    fontSize: 20,
  },
  subcategorySection: {
    marginBottom: 24,
  },
  subcategoryTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 8,
  },
  storyCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    alignItems: "center",
    width: '100%',
  },
  storyCardImage: {
    width: 110,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  storyCardTitle: {
    color: "#fdfdfeff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    flexShrink: 1,
  },
  storyCardAuthor: {
    color: "#a49e9eff",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
    flexShrink: 1,
  },
  playButtonContainer: {
    alignItems: "center",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9ff1ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9ff1ff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 4,
  },
  playButtonText: {
    color: "#f7f7faff",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#0d0b2f",
    fontSize: 16,
  },
  favoriteButton: {
    padding: 4,
  
  },
  playlistButton: {
    padding: 4,
  
  },

    // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d0b2f',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#cfd3ff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: 8,
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  playlistCount: {
    color: '#9ff1ff',
    fontSize: 12,
  },
  newPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9ff1ff',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  newPlaylistText: {
    color: '#0d0b2f',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
});

// --- Focus Component ---
function FocusUI() {
  const [duration, setDuration] = useState(300); // default 5 minutes (300 seconds)
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [breathText, setBreathText] = useState("Inhale"); // dynamic text
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // format time (mm:ss)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // handle timer countdown
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  // handle duration change
  const handleSetDuration = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // --- Breathing Animation ---
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {

    if (!isRunning) return;
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathingLoop.start();

    let inhale = true;

    // Update text every 4 seconds
    const textInterval = setInterval(() => {
      inhale = !inhale;
      setBreathText(inhale ? "Inhale" : "Exhale");
    }, 4000);

    return () => {
      breathingLoop.stop();
      clearInterval(textInterval);
    };
  }, [isRunning, scaleAnim]);

  return (
    <>
      <Text style={styles.helper}>Sync Your Heart To Your Breath</Text>

      <View style={focusStyles.container}>


        {/* Timer Display */}
        <Text style={focusStyles.timerText}>{formatTime(timeLeft)}</Text>

        {/* Play / Pause Button */}
        <TouchableOpacity
          style={focusStyles.playPauseBtn}
          onPress={() => setIsRunning((prev) => !prev)}
        >
          <Ionicons
            name={isRunning ? "stop-circle-outline" : "hourglass-outline"}
            size={40}
            color="#0d0b2f"
          />

        </TouchableOpacity>

        {/* Duration Presets */}
        <View style={focusStyles.presetContainer}>
          <TouchableOpacity
            style={focusStyles.presetBtn}
            onPress={() => handleSetDuration(60)}
          >
            <Text style={focusStyles.presetText}>1m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={focusStyles.presetBtn}
            onPress={() => handleSetDuration(300)}
          >
            <Text style={focusStyles.presetText}>5m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={focusStyles.presetBtn}
            onPress={() => handleSetDuration(600)}
          >
            <Text style={focusStyles.presetText}>10m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={focusStyles.presetBtn}
            onPress={() => setCustomModalVisible(true)}
          >
            <Text style={focusStyles.presetText}>Custom</Text>
          </TouchableOpacity>

          {/* Custom Duration Modal */}
          <Modal
            visible={customModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCustomModalVisible(false)}
          >
            <View style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)"
            }}>
              <View style={{
                backgroundColor: "#090227ff",
                padding: 24,
                borderRadius: 20,
                width: 320,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 10
              }}>
                <Text style={{
                  color: "#fff",
                  fontSize: 18,
                  marginBottom: 12
                }}>Enter duration</Text>

                <TextInput
                  value={customInput}
                  onChangeText={setCustomInput}
                  keyboardType="numeric"
                  placeholder="Minutes"
                  placeholderTextColor="#ccc"

                  style={{
                    padding: 10,
                    color: "#fff",
                    textAlign: "center",
                    marginBottom: 20,
                    borderBottomWidth: 1,   // <-- underline only
                    borderBottomColor: "#fff", // underline color
                  }}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: "#f7f7f7ff",
                    paddingVertical: 10,
                    paddingHorizontal: 40,
                    borderRadius: 14,
                    marginBottom: 8,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    const seconds = parseInt(customInput) * 60;
                    if (!isNaN(seconds) && seconds > 0) {
                      handleSetDuration(seconds);
                      setCustomModalVisible(false);
                      setCustomInput("");
                    } else {
                      alert("Please enter a valid number!");
                    }
                  }}
                >
                  <Text style={{ color: "#0d0b2f", fontWeight: "700", fontSize: 16 }}>Set</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => setCustomModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* Breathing Guide */}
        <Animated.View style={[focusStyles.breathCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={focusStyles.breathText}>{breathText}</Text>
        </Animated.View>

      </View>
    </>
  );
}

// --- Focus Styles ---
const focusStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  timerText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: -40
  },

  playPauseBtn: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#9ff1ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    marginTop: 20,
  },

  presetContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
    width: "100%",
    paddingHorizontal: 40,
    marginTop: 12
  },

  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  presetText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },

  breathCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    marginTop: 20
  },

  breathText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

});


export default function MeditationListScreen({ navigation }: any) {
  const [active, setActive] = useState<string>(CATEGORIES[0].key);
  const subcategories = useMemo(
    () => CATEGORIES.find(c => c.key === active)?.subcategories ?? [],
    [active]
  );

  const favoritesData = useFavorites();

  return (
    <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.header}> Meditation </Text>
      </View>

      {/* Horizontally Scrollable Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {/* Stress */}
          <TouchableOpacity 
            style={[
              styles.lottieTabItem, 
              active === "stress" && styles.lottieTabItemActive
            ]} 
            onPress={() => setActive("stress")}
          >
            <LottieView
              source={require("../../assets/animation/Guitarist.json")}
              autoPlay={active === "stress"}
              loop={active === "stress"}
              style={{ width: 60, height: 60 }}
            />
            <Text style={[styles.tabText, active === "stress" && styles.tabTextActive]}>Music</Text>
          </TouchableOpacity>

          {/* Sleep */}
          <TouchableOpacity 
            style={[
              styles.lottieTabItem, 
              active === "sleep" && styles.lottieTabItemActive
            ]} 
            onPress={() => setActive("sleep")}
          >
            <LottieView
              source={require("../../assets/animation/Book.json")}
              autoPlay={active === "sleep"}
              loop={active === "sleep"}
              style={{ width: 60, height: 60 }}
            />
            <Text style={[styles.tabText, active === "sleep" && styles.tabTextActive]}>SleepTales</Text>
          </TouchableOpacity>

          {/* Focus */}
          <TouchableOpacity 
            style={[
              styles.lottieTabItem, 
              active === "focus" && styles.lottieTabItemActive
            ]} 
            onPress={() => setActive("focus")}
          >
            <LottieView
              source={require("../../assets/animation/Sloth meditate.json")}
              autoPlay={active === "focus"}
              loop={active === "focus"}
              style={{ width: 60, height: 60 }}
            />
            <Text style={[styles.tabText, active === "focus" && styles.tabTextActive]}>Breath</Text>
          </TouchableOpacity>

          {/* Playlist */}
          <TouchableOpacity 
            style={[
              styles.lottieTabItem, 
              active === "playlist" && styles.lottieTabItemActive
            ]} 
            onPress={() => setActive("playlist")}
          >
            <LottieView
              source={require("../../assets/animation/Playlist.json")}
              autoPlay={active === "playlist"}
              loop={active === "playlist"}
              style={{ width: 60, height: 60 }}
            />
            <Text style={[styles.tabText, active === "playlist" && styles.tabTextActive]}>Playlist</Text>
          </TouchableOpacity>

          {/* Favourites */}
          <TouchableOpacity 
            style={[
              styles.lottieTabItem, 
              active === "favorites" && styles.lottieTabItemActive
            ]} 
            onPress={() => setActive("favorites")}
          >
            <LottieView
              source={require("../../assets/animation/Favourite Animation.json")}
              autoPlay={active === "favorites"}
              loop={active === "favorites"}
              style={{ width: 60, height: 60 }}
            />
            <Text style={[styles.tabText, active === "favorites" && styles.tabTextActive]}>Favourites</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content Area */}
      <View style={styles.tracksContainer}>
        {active === "stress" && <StressUI subcategories={subcategories} navigation={navigation} favoritesData={favoritesData} />}
        {active === "sleep" && <SleepUI favoritesData={favoritesData}/>}
        {active === "focus" && <FocusUI />}
        {active === "favorites" && <FavoritesUI favoritesData={favoritesData} />}
        {active === "playlist" && <PlaylistsUI />}
      </View>
    </LinearGradient>
  );
}

// --- Common Styles ---
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
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginLeft: 6,
  },
  // New container for the horizontal tabs
  tabsContainer: {
    height: 120, // Fixed height for the tab bar
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  lottieTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginBottom: 8
  },
  lottieTabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  lottieTabItemActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  tabChip: {
    paddingHorizontal: 32,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    height: 40,
    flexDirection: "row",
    marginTop: 10,
  },
  tabChipActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "transparent",
  },
  tabText: {
    color: "#cfd3ff",
    fontSize: 14,
    marginTop: 4,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  helper: {
    color: "#E6E8FF",
    opacity: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
    textAlign: "center",
    fontSize: 20,
  },
  tracksContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 20, // Adjusted this value
    marginBottom: 40
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
});




