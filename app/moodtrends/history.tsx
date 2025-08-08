import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from 'utils/firebaseConfig'; // Ensure correct Firebase config path

const JournalApp = () => {
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);

  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  // State for tracking the visible section
  const [activeSection, setActiveSection] = useState<'history' | 'moods'>('history');

  // Fetch journal entries from Firestore
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'journalEntries'));
        const entries: any[] = [];
        querySnapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() });
        });
        setJournalEntries(entries);
      } catch (error: any) {
        alert(`Error loading journal entries: ${error.message || error}`);
      }
    };
    fetchEntries();
  }, []);

  // Fetch mood entries from Firestore
  useEffect(() => {
    const fetchMoodEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'moods'));
        const moodData: any[] = [];
        querySnapshot.forEach((doc) => {
          moodData.push({ id: doc.id, ...doc.data() });
        });
        setMoodEntries(moodData);
      } catch (error: any) {
        alert(`Error loading mood entries: ${error.message || error}`);
      }
    };
    fetchMoodEntries();
  }, []);

  const handleSave = async () => {
    try {
      const updatedEntry = {
        text: text,
        mood: selectedMood,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
      };

      if (isEditing && editingId) {
        const entryRef = doc(db, 'journalEntries', editingId);
        await updateDoc(entryRef, updatedEntry);

        const updated = journalEntries.map(entry =>
          entry.id === editingId ? { id: editingId, ...updatedEntry } : entry
        );
        setJournalEntries(updated);
        setIsEditing(false);
        setEditingId(null);
      } else {
        const docRef = await addDoc(collection(db, 'journalEntries'), updatedEntry);
        setJournalEntries([{ id: docRef.id, ...updatedEntry }, ...journalEntries]);
      }

      setText('');
      setSelectedMood('');
    } catch (error: any) {
      alert(`Error saving to cloud: ${error.message || error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof id !== 'string' || !id.trim()) {
      alert("Invalid document ID.");
      return;
    }

    try {
      const entryRef = doc(db, 'journalEntries', id);
      await deleteDoc(entryRef);

      const updated = journalEntries.filter(entry => entry.id !== id);
      setJournalEntries(updated);
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry.");
    }
  };

  const filteredEntries = filterDate
    ? journalEntries.filter(entry =>
        new Date(entry.date).toDateString() === filterDate.toDateString()
      )
    : journalEntries;

  const getMoodEmoji = (mood: string): string => {
    switch (mood.toLowerCase()) {
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
    <LinearGradient colors={['#1f1b5a', '#3f34c0']} style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Mood History</Text>
        {/* Toggle buttons for "History Mood Journal" and "Mood Entries" */}
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

        {/* Conditionally render sections */}
        {activeSection === 'history' && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>History Mood Journal</Text>
            {filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryTime}>{entry.time}</Text>
                
                <Text style={styles.entryMood}>{entry.mood}</Text>
                <Text style={styles.entryText}>{entry.text}</Text>
                
              </View>
            ))}
          </View>
        )}

        {activeSection === 'moods' && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Mood Entries</Text>
            {moodEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryTime}>
                  {new Date(entry.timestamp).toLocaleString()}
                </Text>

               
                <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={styles.moodEmojiOnly}>{getMoodEmoji(entry.mood)}</Text>
                  <Text style={styles.moodLabel}>{entry.mood}</Text>
                </View>

                <Text style={styles.entryText}>Confidence: {entry.confidence}</Text>
              </View>
            ))}
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
    marginRight: 15,  // Added gap between edit and delete icons
  },
  deleteIcon: {
    marginLeft: 10,  // Optional, add a gap from the edit icon
  },
  editedLabel: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
});

export default JournalApp;
