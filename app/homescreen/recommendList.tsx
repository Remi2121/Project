// recommendList.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Recommendation() {
  const { mood } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>You Seem {typeof mood === 'string' ? mood : '...'}...</Text>
        <Text style={styles.description}>
          Here are some suggestions to help you feel better.
        </Text>
        <Text style={styles.description}>
          Tap on any tile to explore more.
        </Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.tile}
            onPress={() =>
              router.push({ pathname: '/(tabs)/explore' as any, params: { mood } })
            }>
            <Ionicons name="play-circle" style={styles.icon} />
            <Text style={styles.tileText}>Play Music</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push({ pathname: '/meditation/stressRelief' as any })}>
            <Text style={styles.emoji}>🧘</Text>
            <Text style={styles.tileText}>Take Meditation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push({ pathname: '/journal/journal' as any })}>
            <Text style={styles.emoji}>📘</Text>
            <Text style={styles.tileText}>Add to Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push({ pathname: '/(tabs)/mood_trends' as any })}>
            <Text style={styles.emoji}>📊</Text>
            <Text style={styles.tileText}>Check Mood Trends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() =>
              router.push({ pathname: '/(tabs)/chatbot' as any, params: { topic: mood } })
            }>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.tileText}>Talk to Chatbot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push({ pathname: '/journal' as any })}>
            <Ionicons name="calendar-outline" style={styles.icon} />
            <Text style={styles.tileText}>Mood Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const themeColor = '#2a1faa';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    color: themeColor,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  description: {
    color: themeColor,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tile: {
    backgroundColor: '#f2f2ff',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: themeColor,
  },
  icon: {
    fontSize: 70,
    color: themeColor,
  },
  emoji: {
    fontSize: 60,
    color: themeColor,
  },
  tileText: {
    color: themeColor,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
