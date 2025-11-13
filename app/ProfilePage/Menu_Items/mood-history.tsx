import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  collection,
  getDocs,
  orderBy,
  query
} from 'firebase/firestore';
import { auth, db } from 'utils/firebaseConfig'; // ✅ import auth


/** Types */
type JournalEntry = {
  id: string;
  text: string;
  mood: string;
  time: string; // e.g. toLocaleTimeString()
  date: string; // e.g. toLocaleDateString()
  edited?: boolean;
};

type MoodEntry = {
  id: string;
  mood: string;
  confidence?: number;
  timestamp?: any;    // Firestore Timestamp | number | string (legacy name)
  createdAt?: any;    // Firestore Timestamp | number | string (newer name)
};

/** Utils */
const tsToDate = (ts: any): Date => {
  if (!ts) return new Date(NaN);
  if (typeof ts === 'object' && typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts === 'number') return new Date(ts < 2e12 ? ts * 1000 : ts);
  return new Date(ts);
};

/** 🔐 User-scoped helpers */
const requireUid = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('NOT_SIGNED_IN');
  return uid;
};
const userColl = (sub: 'journalEntries' | 'MoodHistory') =>
  collection(db, 'users', requireUid(), sub);


const History: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [filterDate] = useState<Date | null>(null);

  const [activeSection, setActiveSection] = useState<'history' | 'moods'>('history');

  /** 🔐 Guard: redirect to Login if not signed in; otherwise load data */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace('/authpages/Login-page');
        return;
      }
      await Promise.all([fetchJournalEntries(), fetchMoodEntries()]);
    });
    return unsub;
     
  }, []);

  /** Fetch journal entries (per user) */
  const fetchJournalEntries = async () => {
    try {
      const q = query(userColl('journalEntries')); // add orderBy if you add createdAt
      const snap = await getDocs(q);
      const entries: JournalEntry[] = [];
      snap.forEach((d) => entries.push({ id: d.id, ...(d.data() as Omit<JournalEntry, 'id'>) }));
      setJournalEntries(entries);
    } catch (error: any) {
      Alert.alert('Error', `Error loading journal entries: ${error?.message || error}`);
    }
  };

  /** Fetch mood entries (per user) */
  const fetchMoodEntries = async () => {
    try {
      // Prefer ordering by createdAt if present; fallback without orderBy
      let qRef: any;
      try {
        qRef = query(userColl('MoodHistory'), orderBy('createdAt', 'desc'));
      } catch {
        qRef = query(userColl('MoodHistory'));
      }
      const snap = await getDocs(qRef);
      const items: MoodEntry[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<MoodEntry, 'id'>) }));
      setMoodEntries(items);
    } catch (error: any) {
      Alert.alert('Error', `Error loading mood entries: ${error?.message || error}`);
    }
  };





  /** Filter by a chosen date (if provided) */
  const filteredEntries = useMemo(() => {
    if (!filterDate) return journalEntries;
    const key = filterDate.toDateString();
    return journalEntries.filter((e) => new Date(e.date).toDateString() === key);
  }, [filterDate, journalEntries]);

  const getMoodEmoji = (mood: string): string => {
    switch ((mood || '').toLowerCase()) {
      case 'happy': return '😄';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'excited': return '🤩';
      case 'tired': return '😴';
      case 'sorrow': return '😔';
      case 'calm': return '😌';
      case 'anxious': return '😰';
      default: return '🙂';
    }
  };

  return (
    <LinearGradient colors={["#1f1b5a", "#3f34c0"]} style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/profile")}
        style={styles.backButton}
        accessibilityLabel="Go to Home">
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <ScrollView>
        <Text style={styles.header}>Mood History</Text>

        {/* Toggle buttons */}
        <View style={styles.toggleButtonsContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, activeSection === 'history' && styles.activeButton]}
            onPress={() => setActiveSection('history')}
          >
            <Text style={styles.toggleButtonText}>History Mood Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeSection === 'moods' && styles.activeButton]}
            onPress={() => setActiveSection('moods')}
          >
            <Text style={styles.toggleButtonText}>Mood Entries</Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {activeSection === 'history' && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>History Mood Journal</Text>
            {filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryTime}>{entry.time}</Text>
                <Text style={styles.entryMood}>{entry.mood}</Text>
                <Text style={styles.entryText}>{entry.text}</Text>
                {entry.edited ? <Text style={styles.editedLabel}>edited</Text> : null}
              </View>
            ))}
          </View>
        )}

        {activeSection === 'moods' && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Mood Entries</Text>
            {moodEntries.map((entry) => {
              // support both 'createdAt' and legacy 'timestamp'
              const when = entry.createdAt ?? entry.timestamp;
              return (
                <View key={entry.id} style={styles.entryCard}>
                  <Text style={styles.entryTime}>{tsToDate(when).toLocaleString()}</Text>

                  <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={styles.moodEmojiOnly}>{getMoodEmoji(entry.mood)}</Text>
                    <Text style={styles.moodLabel}>{entry.mood}</Text>
                  </View>

                  {typeof entry.confidence !== 'undefined' && (
                    <Text style={styles.entryText}>Confidence: {entry.confidence}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  header: {
    fontSize: 25,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
  position: 'absolute',
  justifyContent: 'center',
  top: 50,   
  left: 15,
  zIndex: 10,
  borderRadius: 800,
  paddingVertical: 6,
  paddingHorizontal: 10,
},
backIcon: {
  color: 'white',
  fontSize: 30,
  fontWeight: '700',

},
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  toggleButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  toggleButton: {
    backgroundColor: '#1f1b5a',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#3f34c0',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  subHeader: {
    color: '#ccc',
    textAlign: 'center',
    marginVertical: 20,
  },
  entryCard: {
    backgroundColor: '#2a2566',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  entryTime: {
    color: '#aaa',
    marginBottom: 4,
    fontSize: 12,
  },
  entryMood: {
    fontSize: 20,
    marginBottom: 4,
    color: 'white',
  },
  entryText: {
    color: '#fff',
    fontSize: 15,
  },
  moodEmojiOnly: {
    fontSize: 28,
    color: '#fff',
  },
  moodLabel: {
    fontSize: 15,
    color: '#ccc',
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editIcon: {
    marginRight: 15,
  },
  deleteIcon: {
    marginLeft: 10,
  },
  editedLabel: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
});


export default History;