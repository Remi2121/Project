//playlist.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

type Playlist = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  external_url: string;
};

const BACKEND_URL = 'http://192.168.8.100:8000';// Replace with your actual IP

export default function RecommendList() {
  const { mood } = useLocalSearchParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const moodStr = Array.isArray(mood) ? mood[0] : mood;
  const lowerMood = moodStr?.toLowerCase(); // Ensure lowercase for FastAPI
  useEffect(() => {
    if (!lowerMood) return;
    console.log('📡 Fetching playlists for:', lowerMood);

    axios.get(`${BACKEND_URL}/playlists/${lowerMood}`)
      .then(res => {
        console.log('✅ Received playlists:', res.data);
        setPlaylists(res.data.playlists);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Axios error:',err);
        
        setLoading(false);
      });
  }, [lowerMood]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 100 }} size="large" color="#2a1faa" />;
  }

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      <Text style={styles.header}>Playlists for {moodStr}</Text>
      {playlists.length === 0 ? (
  <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 20 }}>
    No playlists found for this mood 😕
  </Text>
) :(
      <FlatList<Playlist>
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.external_url)}>
            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#0d0b2f',
    paddingTop:60
},
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 50,
    textAlign:'center'
},
  card: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    backgroundColor: '#1e1b47', 
    borderRadius: 10, 
    padding: 10 
},
  image: { 
    width: 80, 
    height: 80, 
    borderRadius: 8 
},
  details: { 
    flex: 1, 
    marginLeft: 12 
},
  name: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
},
  desc: { 
    fontSize: 14, 
    color: '#ccc' 
},
});
