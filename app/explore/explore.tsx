import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import type { UnknownOutputParams } from 'expo-router';
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

type Props = {
  routeParams?: UnknownOutputParams;
};

const Explore: React.FC<Props> = ({ routeParams }) => {

  const [playlistData, setPlaylistData] = useState<{
    playlists: {
      playlist_url: string;
      playlist_name: string;
      playlist_image: string;
      tracks: any[];
    }[];
  } | null>(null);

  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const moods = ['sad', 'happy', 'angry', 'depression'];

  const moodEmojis: Record<string, string> = {
    sad: '😢',
    happy: '😊',
    angry: '😠',
    depression: '😞',
  };

  const moodParam = typeof routeParams?.mood === 'string' ? routeParams.mood : '';

  const fetchPlaylists = async () => {
    if (!mood.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get('http://192.168.239.146:5000/playlist', {
        params: { mood },
      });

      if (response.data && response.data.playlists) {
        setPlaylistData(response.data);
      } else {
        setPlaylistData(null);
        Alert.alert('No Results', 'No playlists found for this mood.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch playlists.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlaylist = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error(err);
      Alert.alert('Error', 'Failed to open Spotify.');
    });
  };

  const fetchPlaylistsByParam = async (moodValue: string) => {
    if (!moodValue.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get('http://192.168.239.146:5000/playlist', {
        params: { mood: moodValue },
      });

      if (response.data && response.data.playlists) {
        setPlaylistData(response.data);
      } else {
        setPlaylistData(null);
        Alert.alert('No Results', 'No playlists found for this mood.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch playlists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moodParam) {
      setMood(moodParam);
      fetchPlaylistsByParam(moodParam); // 💡 Use directly instead of waiting for state update
    }
  }, [moodParam]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        const results = await Promise.all(
          moods.map(async (moodType) => {
            const res = await axios.get('http://192.168.239.146:5000/playlist', {
              params: { mood: moodType },
            });
            return { moodType, playlists: res.data.playlists || [] };
          })
        );

        const map: Record<string, any[]> = {};
        results.forEach(({ moodType, playlists }) => {
          map[moodType] = playlists;
        });
        setSuggestions(map);
      } catch (err) {
        console.error('Suggestions fetch failed', err);
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
                    colors={['#0d0b2f', '#2a5faa']}
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
                      colors={['#0d0b2f', '#2a5faa']}
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
};

export default Explore;
