import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "utils/firebaseConfig";
import { useSettings } from '../utilis/Settings';


export default function Favorites() {
    const { isDark } = useSettings();

  const router = useRouter();
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        Alert.alert("Login required", "Please sign in to view your favorites.");
        router.replace("/authpages/Login-page");
        return;
      }

      try {
        // ✅ Path: users/{uid}/favorites/{songId}
        const ref = collection(db, "users", u.uid, "favorites");
        const snap = await getDocs(ref);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSongs(list);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load favorites");
      }
    });
    return unsub;
  }, [router]);

  function openPlayer(track: any) {
    const name = track.name || track.id;
    const mood = track.mood || "neutral";
    router.push({
      pathname: "/explore/player",
      params: { path: `${mood}/${name}`, name, mood },
    });
  }

  return (
<LinearGradient
  colors={isDark ? ['#0b0b10', '#1a1620'] : ['#ffffffff', '#ebe0e0ff']}
  style={{ flex: 1, paddingTop: 50 }}
>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/explore")}
        style={{ paddingLeft: 20, marginBottom: 10 }}
      >
        <Ionicons name="arrow-back" size={28} color={isDark ? '#e6e6e6' : '#2a1faa'} />
      </TouchableOpacity>

      <Text style={{
  color: isDark ? '#fff' : '#2a1faa',
  fontSize: 22,
  fontWeight: "bold",
  textAlign: "center"
}}>Favorites ❤️</Text>

      <ScrollView style={{ marginTop: 20, paddingHorizontal: 20 }}>
        {songs.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => openPlayer(s)}>
            <View
              style={{
                padding: 14,
                backgroundColor: isDark ? '#3b3750' : '#64648eff',
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: isDark ? '#fff' : 'white', fontSize: 16 }}>
                {s.name || s.id}
              </Text>
              <Text style={{ color: isDark ? '#bbb' : '#aaa' }}>{s.mood || "—"}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {songs.length === 0 && (
          <Text
            style={{ color: "#2a1faa", textAlign: "center", marginTop: 40 }}
          >
            No favorites yet.
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
