import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { db } from "utils/firebaseConfig";

export default function Playlist() {
  const router = useRouter();
  const [songs, setSongs] = useState<any[]>([]);
  const userId = "demoUser"; // TODO: replace with auth.uid

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "Playlists", userId, "playlists", "default");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSongs(snap.data().songs || []);
        } else {
          setSongs([]);
        }
      } catch (e) {
        Alert.alert("Error", "Could not load playlist");
      }
    })();
  }, []);

  return (
    <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={{ flex: 1, paddingTop: 50 }}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={{ paddingLeft: 20, marginBottom: 10 }}>
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>

      <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
        My Playlist 🎶
      </Text>

      <ScrollView style={{ marginTop: 20, paddingHorizontal: 20 }}>
        {songs.map((s, i) => (
          <View key={i} style={{ padding: 14, backgroundColor: "#1c1c3c", borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ color: "white", fontSize: 16 }}>{s.name}</Text>
            <Text style={{ color: "#aaa" }}>{s.mood}</Text>
          </View>
        ))}

        {songs.length === 0 && (
          <Text style={{ color: "#aaa", textAlign: "center", marginTop: 40 }}>
            Playlist is empty.
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
