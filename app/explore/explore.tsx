import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import Lottie from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../explore/explorestyles';

export default function Explore() {
  const [mood, setMood] = useState('');
  const [playlistData, setPlaylistData] = useState<{
    playlists: {
      playlist_url: string;
      playlist_name: string;
      playlist_image: string;
      tracks: any[];
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const moods = ['sad', 'happy', 'angry', 'depression'];
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Emoji mapping for moods
  const moodEmojis: Record<string, string> = {
    sad: '😢',
    happy: '😊',
    angry: '😠',
    depression: '😞',
  };

  // Fetch playlists based on user input mood
  const fetchPlaylists = async () => {
    if (!mood.trim()) {
      Alert.alert('Please enter a mood');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get('http://192.168.107.146:5000/playlist', {
        params: { mood },
      });
      setPlaylistData(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch playlists.');
    } finally {
      setLoading(false);
    }
  };

  // Open playlist URL in external app or browser
  const handleOpenPlaylist = (playlistUrl: string) => {
    Linking.openURL(playlistUrl).catch((err) => {
      console.error(err);
      Alert.alert('Error', 'Failed to open Spotify.');
    });
  };

  // Fetch suggestions for all moods in parallel on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);

        const results = await Promise.all(
          moods.map(async (moodType) => {
            const res = await axios.get('http://192.168.107.146:5000/playlist', {
              params: { mood: moodType },
            });
            return { moodType, playlists: res.data.playlists || [] };
          })
        );

        const suggestionsObj: Record<string, any[]> = {};
        results.forEach(({ moodType, playlists }) => {
          suggestionsObj[moodType] = playlists;
        });

        setSuggestions(suggestionsObj);
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
      <Image
        source={require('../../assets/images/bg.png')}
        style={styles.bgImage}
      />
      <View style={styles.logoContainer}>
        <Lottie
          source={require('../../assets/animation/explorelogo.json')}
          autoPlay
          loop
          style={styles.logo}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.textContainer}>
          <Text style={styles.headerinput}>Search Mood</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Describe your Mood..."
              placeholderTextColor="white"
              value={mood}
              onChangeText={setMood}
            />
            <TouchableOpacity onPress={fetchPlaylists} style={{ padding: 10 }}>
              <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator size="small" color="black" style={{ marginTop: 20 }} />
          )}

          {playlistData?.playlists && playlistData.playlists.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsHeader}>Search Results</Text>
              {playlistData.playlists.map((playlist, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleOpenPlaylist(playlist.playlist_url)}
                >
                  <LinearGradient
                    colors={['#0d0b2f', '#2a1faa']}
                    style={styles.playlistCard}
                  >
                    <Image
                      source={{ uri: playlist.playlist_image }}
                      style={styles.playlistImageLarge}
                    />
                    <Text style={styles.playlistNameLarge}>
                      {playlist.playlist_name}
                    </Text>
                    <Text style={styles.playlistTapText}>Tap to open in Spotify</Text>
                    <Ionicons name="open-outline" size={28} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.suggestionsHeader}>Suggestions</Text>

          {suggestionsLoading && (
            <ActivityIndicator size="small" color="white" style={{ marginTop: 10 }} />
          )}

          {moods.map((moodType) => (
            <View key={moodType} style={styles.moodSectionContainer}>
              <Text style={styles.moodSectionTitle}>
                {moodType.charAt(0).toUpperCase() + moodType.slice(1)} Songs {moodEmojis[moodType]}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestionsScrollView}
              >
                {suggestions[moodType]?.map((playlist, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleOpenPlaylist(playlist.playlist_url)}
                  >
                    <LinearGradient
                      colors={['#0d0b2f', '#2a1faa']}
                      style={styles.playlistCardSmall}
                    >
                      <Image
                        source={{ uri: playlist.playlist_image }}
                        style={styles.playlistImageSmall}
                      />
                      <Text style={styles.playlistNameSmall}>
                        {playlist.playlist_name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
