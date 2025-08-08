import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface MoodData {
  mood: string;
  percentage: number;
}

interface MoodDayData {
  date: string;
  moods: MoodData[];
}

const getAbbreviatedDayOfWeek = (dateString: string): string => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateString);
  return daysOfWeek[date.getDay()];
};

const getLast7Dates = (): string[] => {
  const today = new Date();
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    result.push(date.toISOString().split('T')[0]);
  }
  return result;
};

export default function MoodTrendsComponent() {
  const router = useRouter();  // Hook to handle navigation
  const moodData: MoodDayData[] = [
    { date: '2025-08-01', moods: [{ mood: '😢', percentage: 20 }] },
    { date: '2025-08-02', moods: [{ mood: '😐', percentage: 40 }] },
    { date: '2025-08-03', moods: [{ mood: '😊', percentage: 60 }] },
    { date: '2025-08-04', moods: [{ mood: '😊', percentage: 60 }] },
    { date: '2025-08-05', moods: [{ mood: '😐', percentage: 50 }] },
    { date: '2025-08-06', moods: [{ mood: '😐', percentage: 55 }] },
    { date: '2025-08-07', moods: [{ mood: '😊', percentage: 80 }] },
  ];

  const last7Dates = getLast7Dates();

  const filteredData = last7Dates.map(date => {
    const dayData = moodData.find(item => item.date === date);
    return {
      date,
      moods: dayData ? dayData.moods : [],
    };
  });

  const calculateAveragePercentage = (moods: MoodData[]): number => {
    if (moods.length === 0) return 0;
    const total = moods.reduce((sum, m) => sum + m.percentage, 0);
    return total / moods.length;
  };

  const chartData = filteredData.map(item => {
    const avg = calculateAveragePercentage(item.moods);
    const emoji = item.moods.map(m => m.mood).join(' ') || '';
    return {
      value: avg,
      label: getAbbreviatedDayOfWeek(item.date),
      customDataPoint: (pointIndex: number, point: any) => (
        <View
          style={{
            position: 'absolute',
            top: point.y - 35,
            left: point.x - 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </View>
      ),
    };
  });

  const buttons = [
    { label: 'Add Entry', icon: '✏️', onPress: () => router.push({ pathname: '/(tabs)/journal' }) },
    { label: 'Statistics', icon: '📊', onPress: () => router.push({ pathname: '../../journal/journal.tsx'  }) },
    { label: 'History', icon: '🕒', onPress: () => router.push({ pathname: '/moodtrends/history'  }) },
    { label: 'Predict', icon: '🔍', onPress: () => router.push({ pathname: '../../journal/journal.tsx'  }) },
  ];

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.heading}>Mood Trends</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            thickness={3}
            color="#00e0ff"
            curved={true}
            hideRules
            hideAxesAndRules={true}
            yAxisTextStyle={{ color: 'transparent' }}
            xAxisLabelTextStyle={{ color: 'white', fontSize: 12 }}
            dataPointsColor="#00e0ff"
            dataPointsRadius={4}
            spacing={40}
            maxValue={100}
          />
        </View>

        {/* View your mood trends text */}
        <View style={styles.moodTextContainer}>
          <Text style={styles.moodText}>
            View your mood trends and insights
          </Text>
        </View>

        {/* 📦 Button Row */}
        <View style={styles.buttonRow}>
          {buttons.map((btn, index) => (
            <TouchableOpacity key={index} style={styles.button} onPress={btn.onPress}>
              <View style={styles.buttonContent}>
                <Text style={styles.emojiText}>{btn.icon}</Text>
                <Text style={styles.buttonText}>{btn.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  chartContainer: {
    backgroundColor: '#040429',
    height: 250,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  heading: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  button: {
    backgroundColor: '#040429',
    height: 130,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '47%',
    justifyContent: 'center',  
    alignItems: 'center',     
  },

  buttonContent: {
    alignItems: 'center',  // Center content inside the button
  },

  emojiText: {
    fontSize: 40, // Emoji size
    marginBottom: 10,  // Adds space between emoji and text
  },

  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },

  // New styles for "View your mood trends and insights" text
  moodTextContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  moodText: {
    color: 'white',
    fontSize: 18,
  },
});
