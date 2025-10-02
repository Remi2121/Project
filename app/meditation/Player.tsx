import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import AsyncStorage from '@react-native-async-storage/async-storage';

type Favorite = {
  id: string;
  title: string;
  type: 'music' | 'sleep-story';
  file?: any;
  url?: string;
  image: any;
  author?: string;
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('@favorites');
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        setFavorites(parsedFavorites);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setIsLoaded(true);
    }
  };

  const saveFavorites = async (newFavorites: Favorite[]) => {
    try {
      await AsyncStorage.setItem('@favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && favorites.length >= 0) {
      saveFavorites(favorites);
    }
  }, [favorites, isLoaded]);

  const addFavorite = (item: Favorite) => {
    setFavorites(prev => {
      const exists = prev.find(fav => fav.id === item.id);
      if (exists) return prev;
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

  return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
};

export default function Player() {
    const { title, url, image } = useLocalSearchParams();
    const parsedUrl = url ? JSON.parse(url as string) : null;
    const parsedImage = image ? JSON.parse(image as string) : null;
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0); // ms
    const [duration, setDuration] = useState(1); // ms
    
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();

    // Generate a unique ID for this track
    const trackId = title as string;

    const handleFavorite = () => {
        const favorite: Favorite = {
            id: trackId,
            title: title as string,
            type: 'music',
            file: parsedUrl,
            image: parsedImage,
        };

        if (isFavorite(trackId)) {
            removeFavorite(trackId);
        } else {
            addFavorite(favorite);
        }
    };

    useEffect(() => {
        return () => {
        if (sound) {
            sound.unloadAsync(); // cleanup
        }
        };
    }, [sound]);

    const togglePlay = async () => {
        if (!sound && parsedUrl) {
        const { sound: newSound } = await Audio.Sound.createAsync(parsedUrl, {
            shouldPlay: true,
        });
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
        <View style={styles.container}>
        {/* Header with Back and Favorite Buttons */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.favoriteButton} onPress={handleFavorite}>
            <Ionicons 
                name={isFavorite(trackId) ? "heart" : "heart-outline"} 
                size={28} 
                color={isFavorite(trackId) ? "#ff6b6b" : "#fff"} 
            />
            </TouchableOpacity>
        </View>

        {/* Album Art and Title */}
        {parsedImage && <Image source={parsedImage} style={styles.artwork} />}
        <Text style={styles.title}>{title}</Text>

        {/* Progress Slider */}
        <Slider
            style={{ width: "80%", height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#9ff1ff"
            maximumTrackTintColor="#aaa"
            thumbTintColor="#9ff1ff"
        />
        <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Play / Pause Button */}
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
            <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={40}
            color="#0d0b2f"
            />
        </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d0b2f",
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
        marginTop: 40, // Added margin to account for header
    },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 30,
        textAlign: "center",
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#9ff1ff",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
        marginTop: 10,
    },
    timeText: {
        color: "#fff",
        fontSize: 14,
    },
});