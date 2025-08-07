import React from 'react';
import { ScrollView, StyleSheet, useColorScheme } from 'react-native';
import MoodHistoryComponent from '../../moodtrends/mood_trends';

const MoodHistory = () => {
  const dark = useColorScheme() === 'dark'; // Detect system theme

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: dark ? '#121212' : '#f8f9fa' }]}>
      <MoodHistoryComponent />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
});

export default MoodHistory;
