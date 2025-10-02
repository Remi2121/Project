import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { db } from 'utils/firebaseConfig';
import styles from './history_styles';

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
  timestamp: any; // Firestore Timestamp | number | string
};

/** Utils */
const tsToDate = (ts: any): Date => {
  if (!ts) return new Date(NaN);
  // Firestore Timestamp
  if (typeof ts === 'object' && typeof ts.toDate === 'function') return ts.toDate();
  // numeric epoch (s/ms)
  if (typeof ts === 'number') return new Date(ts < 2e12 ? ts * 1000 : ts);
  // ISO/string
  return new Date(ts);
};

const History: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const [activeSection, setActiveSection] = useState<'history' | 'moods'>('history');

  /** Fetch journal entries */
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // If you later add a createdAt Timestamp, you can orderBy('createdAt','desc')
        const q = query(collection(db, 'journalEntries'));
        const snap = await getDocs(q);
        const entries: JournalEntry[] = [];
        snap.forEach((d) => entries.push({ id: d.id, ...(d.data() as Omit<JournalEntry, 'id'>) }));
        setJournalEntries(entries);
      } catch (error: any) {
        alert(`Error loading journal entries: ${error?.message || error}`);
      }
    };
    fetchEntries();
  }, []);

  /** Fetch mood entries */
  useEffect(() => {
    const fetchMoodEntries = async () => {
      try {
        const q = query(collection(db, 'moods'));
        const snap = await getDocs(q);
        const items: MoodEntry[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<MoodEntry, 'id'>) }));
        setMoodEntries(items);
      } catch (error: any) {
        alert(`Error loading mood entries: ${error?.message || error}`);
      }
    };
    fetchMoodEntries();
  }, []);

  /** Create or update entry */
  const handleSave = async () => {
    try {
      const updatedEntry: Omit<JournalEntry, 'id'> = {
        text,
        mood: selectedMood,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        edited: isEditing,
      };

      if (isEditing && editingId) {
        const ref = doc(db, 'journalEntries', editingId);
        await updateDoc(ref, updatedEntry as any);
        setJournalEntries((prev) => prev.map((e) => (e.id === editingId ? { id: editingId, ...updatedEntry } : e)));
        setIsEditing(false);
        setEditingId(null);
      } else {
        const ref = await addDoc(collection(db, 'journalEntries'), updatedEntry as any);
        setJournalEntries((prev) => [{ id: ref.id, ...updatedEntry }, ...prev]);
      }

      setText('');
      setSelectedMood('');
    } catch (error: any) {
      alert(`Error saving to cloud: ${error?.message || error}`);
    }
  };

  /** Delete */
  const handleDelete = async (id: string) => {
    if (!id?.trim()) {
      alert('Invalid document ID.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'journalEntries', id));
      setJournalEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      alert('Failed to delete entry.');
    }
  };

  /** Filter by a chosen date (if provided) */
  const filteredEntries = useMemo(() => {
    if (!filterDate) return journalEntries;
    const key = filterDate.toDateString();
    return journalEntries.filter((e) => new Date(e.date).toDateString() === key);
  }, [filterDate, journalEntries]);

  const getMoodEmoji = (mood: string): string => {
    switch (mood?.toLowerCase?.() || '') {
      case 'happy':
        return '😄';
      case 'sad':
        return '😢';
      case 'angry':
        return '😠';
      case 'excited':
        return '🤩';
      case 'tired':
        return '😴';
      case 'sorrow':
        return '😔';
      case 'calm':
        return '😌';
      case 'anxious':
        return '😰';
      default:
        return '🙂';
    }
  };

  return (
    <LinearGradient colors={["#1f1b5a", "#3f34c0"]} style={styles.container}>
              <TouchableOpacity
          onPress={() => router.replace("/(tabs)/mood_trends")}
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
            {moodEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryTime}>{tsToDate(entry.timestamp).toLocaleString()}</Text>

                <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={styles.moodEmojiOnly}>{getMoodEmoji(entry.mood)}</Text>
                  <Text style={styles.moodLabel}>{entry.mood}</Text>
                </View>

                {typeof entry.confidence !== 'undefined' && (
                  <Text style={styles.entryText}>Confidence: {entry.confidence}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default History;