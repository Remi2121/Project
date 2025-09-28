import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";


export default function Player() {
    const { title, url, image } = useLocalSearchParams();
    const parsedUrl = url ? JSON.parse(url as string) : null;
    const parsedImage = image ? JSON.parse(image as string) : null;
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0); // ms
    const [duration, setDuration] = useState(1); // ms

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
      {image && <Image source={parsedImage} style={styles.artwork} />}
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

      {/* Play / Pause */}
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
  artwork: {
    width: 350,
    height: 300,
    borderRadius: 20,
    marginBottom: 30,
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
