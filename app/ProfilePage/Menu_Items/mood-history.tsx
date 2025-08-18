import React from 'react';
import { ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import MoodHistoryComponent from '../../moodtrends/mood_trends/mood_trends';

const MoodHistory = () => {
  const dark = useColorScheme() === 'dark'; // Detect system theme
  const router = useRouter();

  return (
    <>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={[styles.backText, { color: dark ? '#fff' : '#2f03cbff' }]}>← </Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: dark ? '#121212' : '#f8f9fa' }
        ]}
      >
        <MoodHistoryComponent />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,      // adjust for status bar / safe area
    left: 20,     // top-left corner
    zIndex: 10,
  },
  backText: {
    fontSize: 30 ,
    top: 20,
    fontWeight: 'bold',
  },
});

export default MoodHistory;
