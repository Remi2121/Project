import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "utils/firebaseConfig";
import { useSettings } from '../utilis/Settings';

export default function Playlist() {
  const router = useRouter();
  const [songs, setSongs] = useState<any[]>([]);
  const { isDark } = useSettings();

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          Alert.alert("Login required", "Please sign in to view your playlist.");
          router.replace("/authpages/Login-page");
          return;
        }

        // ✅ User-based path: users/{uid}/playlists/default
        const ref = doc(db, "users", uid, "playlists", "default");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setSongs(snap.data().songs || []);
        } else {
          setSongs([]);
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load playlist");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient
  colors={isDark ? ['#0b0b10', '#121018'] : ['#ffffffff', '#ffffffff']}
  style={{ flex: 1, paddingTop: 50 }}
>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/explore")}
        style={{ paddingLeft: 20, marginBottom: 10 }}
      >
        <Ionicons name="arrow-back" size={28} color={isDark ? '#e6e6e6' : '#2a1faa'} />
      </TouchableOpacity>

      <Text style={{ color: isDark ? '#fff' : '#2a1faa', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>
        My Playlist 🎶
      </Text>

      <ScrollView style={{ marginTop: 20, paddingHorizontal: 20 }}>
        {songs.map((s, i) => (
          <View
            key={i}
            style={{
              padding: 14,
              backgroundColor: isDark ? '#2f2d45' : '#494994ff',
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: isDark ? '#fff' : 'white', fontSize: 16 }}>{s.name}</Text>
            <Text style={{ color: isDark ? '#bbb' : '#aaa' }}>{s.mood}</Text>
          </View>
        ))}

        {songs.length === 0 && (
          <Text style={{ color: "#2a1faa", textAlign: "center", marginTop: 40 }}>
            Playlist is empty.
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
