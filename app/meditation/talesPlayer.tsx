import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
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

export default function TalesPlayer() {
    const { title, url, image, author, type } = useLocalSearchParams();
    
    const audioUrl = url as string;
    const imageUrl = image as string;
    const storyTitle = title as string;
    const storyAuthor = author as string;
    
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { addFavorite, removeFavorite, isFavorite } = useFavorites();

    // Generate a unique ID for this story
    const storyId = storyTitle + (storyAuthor || '');

    const handleFavorite = () => {
        const favorite: Favorite = {
            id: storyId,
            title: storyTitle,
            type: 'sleep-story',
            url: audioUrl,
            image: { uri: imageUrl },
            author: storyAuthor,
        };

        if (isFavorite(storyId)) {
            removeFavorite(storyId);
        } else {
            addFavorite(favorite);
        }
    };

    // Decode the URL
    const decodedUrl = audioUrl ? decodeURIComponent(audioUrl) : null;

    // Improved stopAudio function with better error handling
    const stopAudio = async () => {
        if (sound) {
            try {
                // Check if sound is loaded before trying to stop it
                const status = await sound.getStatusAsync();
                
                if (status.isLoaded) {
                    await sound.stopAsync();
                    await sound.unloadAsync();
                }
                
                setSound(null);
                setIsPlaying(false);
                setPosition(0);
            } catch (error) {
                // If there's an error, just unload and reset state
                console.log("Error stopping audio, forcing cleanup:", error);
                try {
                    await sound.unloadAsync();
                } catch (unloadError) {
                    console.log("Unload also failed, continuing...");
                }
                setSound(null);
                setIsPlaying(false);
                setPosition(0);
            }
        } else {
            // No sound instance, just reset state
            setIsPlaying(false);
            setPosition(0);
        }
    };

    // Stop audio when screen loses focus
    useFocusEffect(
        React.useCallback(() => {
            return () => {
                stopAudio();
            };
        }, [sound]) // Add sound as dependency
    );

    useEffect(() => {
        loadAudio();
        
        return () => {
            stopAudio();
        };
    }, [decodedUrl]);

    const loadAudio = async () => {
        if (!decodedUrl) {
            setError("No audio URL provided");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            // Clean up any existing sound first
            await stopAudio();

            // Create new sound
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: decodedUrl },
                { 
                    shouldPlay: false,
                    // Add more configuration for better stability
                    isMuted: false,
                    volume: 1.0,
                    rate: 1.0,
                    shouldCorrectPitch: false
                }
            );
            
            setSound(newSound);
            setIsPlaying(false);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded) {
                    setPosition(status.positionMillis);
                    setDuration(status.durationMillis || 1);
                    setIsPlaying(status.isPlaying);
                    
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setPosition(0); // Reset to beginning when finished
                    }
                }
                
                if (status.error) {
                    console.error("Playback error:", status.error);
                    setError("Playback error occurred");
                }
            });

        } catch (error) {
            console.error("Error loading audio:", error);
            setError("Failed to load audio. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlay = async () => {
        if (!sound) return;

        try {
            const status = await sound.getStatusAsync();
            
            if (!status.isLoaded) {
                setError("Audio not loaded properly");
                return;
            }

            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                await sound.playAsync();
            }
        } catch (error) {
            console.error("Error toggling playback:", error);
            setError("Playback error");
        }
    };

    const handleSeek = async (value: number) => {
        if (sound) {
            try {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    await sound.setPositionAsync(value);
                }
            } catch (error) {
                console.error("Error seeking:", error);
            }
        }
    };

    const formatTime = (ms: number) => {
        if (!ms || ms < 0) return "0:00";
        
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const goBack = async () => {
        await stopAudio();
        router.back();
    };

    // Retry loading audio if there was an error
    const retryLoad = async () => {
        setError(null);
        await loadAudio();
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
                        name={isFavorite(storyId) ? "heart" : "heart-outline"} 
                        size={28} 
                        color={isFavorite(storyId) ? "#ff6b6b" : "#fff"} 
                    />
                </TouchableOpacity>
            </View>

            {/* Error Message with Retry */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Artwork */}
            {imageUrl && (
                <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.artwork} 
                    defaultSource={require('../../assets/images/Sleep-PNG-Clipart.png')}
                    onError={() => console.log("Image failed to load")}
                />
            )}

            {/* Title and Author */}
            <Text style={styles.title}>{storyTitle || "Unknown Title"}</Text>
            {storyAuthor && (
                <Text style={styles.author}>By: {storyAuthor}</Text>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f8f9faff" />
                    <Text style={styles.loadingText}>Loading audio...</Text>
                </View>
            )}

            {/* Progress Slider - Only show when audio is loaded */}
            {sound && !isLoading && !error && (
                <>
                    <Slider
                        style={{ width: "80%", height: 40 }}
                        minimumValue={0}
                        maximumValue={duration}
                        value={position}
                        onSlidingComplete={handleSeek}
                        minimumTrackTintColor="#9ff1ff"
                        maximumTrackTintColor="#aaa"
                        thumbTintColor="#9ff1ff"
                        disabled={!sound}
                    />
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(position)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </>
            )}

            {/* Play/Pause Button */}
            <TouchableOpacity 
                style={[
                    styles.playBtn, 
                    (!sound || isLoading || error) && styles.playBtnDisabled
                ]} 
                onPress={togglePlay}
                disabled={!sound || isLoading || !!error}
            >
                <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={40}
                    color="#0d0b2f"
                />
            </TouchableOpacity>

            {/* Stop Button */}
            {sound && !isLoading && (
                <TouchableOpacity 
                    style={styles.stopBtn}
                    onPress={stopAudio}
                    disabled={!sound}
                >
                    
                </TouchableOpacity>
            )}
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
    errorContainer: {
        backgroundColor: "#ff6b6b",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: "center",
    },
    errorText: {
        color: "#fff",
        textAlign: "center",
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 5,
    },
    retryText: {
        color: "#ff6b6b",
        fontWeight: "bold",
    },
    artwork: {
        width: 300,
        height: 300,
        borderRadius: 20,
        marginBottom: 20,
        marginTop: 40, // Added margin to account for header
    },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 10,
        textAlign: "center",
        paddingHorizontal: 20,
    },
    author: {
        color: "#cfd3ff",
        fontSize: 16,
        marginBottom: 30,
        textAlign: "center",
    },
    loadingContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    loadingText: {
        color: "white",
        fontSize: 16,
        marginTop: 10,
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#9ff1ff",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
    },
    playBtnDisabled: {
        opacity: 0.5,
    },
    stopBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    stopText: {
        color: "#fff",
        marginLeft: 5,
        fontWeight: "600",
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
        marginTop: 10,
        marginBottom: 20,
    },
    timeText: {
        color: "#fff",
        fontSize: 14,
    },
});