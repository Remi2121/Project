// recommendList.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../utilis/Settings'; // keep your original path

export default function Recommendation() {
  const { mood } = useLocalSearchParams();
  const router = useRouter();

  const { isDark } = useSettings() || { isDark: false }; // defensive fallback
  // debug: confirm isDark value in Metro / device logs
  useEffect(() => {
    // remove or comment out in production
    console.log('recommendList: isDark =', isDark);
  }, [isDark]);

  const palette = getPalette(isDark);
  const styles = getStyles(isDark);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.header, { color: palette.title }]}>
          You Seem {typeof mood === 'string' ? mood : '...'}...
        </Text>

        <Text style={[styles.description, { color: palette.subtitle }]}>
          Here are some suggestions to help you feel better.
        </Text>
        <Text style={[styles.description, { color: palette.subtitle }]}>
          Tap on any tile to explore more.
        </Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.tileBg, borderColor: palette.border }]}
            onPress={() =>
              router.push({ pathname: '/(tabs)/explore' as any, params: { mood } })
            }>
            <Ionicons name="play-circle" size={54} color={palette.icon} />
            <Text style={[styles.tileText, { color: palette.text }]}>Play Music</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.tileBg, borderColor: palette.border }]}
            onPress={() => router.push({ pathname: '/meditation/stressRelief' as any })}>
            <Text style={[styles.emoji, { color: palette.icon }]}>🧘</Text>
            <Text style={[styles.tileText, { color: palette.text }]}>Take Meditation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.tileBg, borderColor: palette.border }]}
            onPress={() => router.push({ pathname: '/journal/journal' as any })}>
            <Text style={[styles.emoji, { color: palette.icon }]}>📘</Text>
            <Text style={[styles.tileText, { color: palette.text }]}>Add to Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.tileBg, borderColor: palette.border }]}
            onPress={() => router.push({ pathname: '/(tabs)/mood_trends' as any })}>
            <Text style={[styles.emoji, { color: palette.icon }]}>📊</Text>
            <Text style={[styles.tileText, { color: palette.text }]}>Check Mood Trends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.tileBg, borderColor: palette.border }]}
            onPress={() =>
              router.push({ pathname: '/(tabs)/chatbot' as any, params: { topic: mood } })
            }>
            <Text style={[styles.emoji, { color: palette.icon }]}>💬</Text>
            <Text style={[styles.tileText, { color: palette.text }]}>Talk to Chatbot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.tileBg, borderColor: palette.border }]}
            onPress={() => router.push({ pathname: '/journal' as any })}>
            <Ionicons name="calendar-outline" size={54} color={palette.icon} />
            <Text style={[styles.tileText, { color: palette.text }]}>Mood Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* Stronger palette for visible dark mode */
const getPalette = (dark: boolean) => ({
  background: dark ? '#07070a' : '#ffffff',
  title: dark ? '#e6e6e6' : '#2a1faa',
  subtitle: dark ? '#cfcfe8' : '#2a1faa',
  // Made tileBg stronger so tile stands out on dark background
  tileBg: dark ? 'rgba(111,108,255,0.12)' : '#f2f2ff',
  // Slightly brighter border for dark
  border: dark ? '#6f6cff' : '#2a1faa',
  icon: dark ? '#e9e9ff' : '#2a1faa',
  text: dark ? '#e6e6e6' : '#2a1faa',
});

/* Static layout styles (theme-driven colors applied at runtime) */
const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 80,
      paddingHorizontal: 24,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 20,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 10,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    tile: {
      width: '48%',
      padding: 20,
      borderRadius: 15,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      // subtle elevation for light, glow for dark
      ...(dark
        ? { shadowColor: '#6f6cff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }
        : { elevation: 3 }),
    },
    icon: {
      fontSize: 70,
    },
    emoji: {
      fontSize: 60,
    },
    tileText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
    },
  });
