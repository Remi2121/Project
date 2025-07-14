import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from 'utils/firebaseConfig';


const moods = ['😄', '😀', '😊','😍', '😔', '😢', '😭', '😠', '😤', '😡', '😱', '😨', '😳', '😐', '🤔', '🥱', '😴', '🥳'];

export default function JournalScreen() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'journalEntries'));
      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          mood: data.mood,
          text: data.text,
          time: data.time,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          edited: data.edited || false,
        };
      });
      setJournalEntries(entries.reverse());
    } catch (error) {
      console.error("Error loading Firestore entries:", error);
    }
  };

  const saveEntriesToStorage = async (entries: any[]) => {
    try {
      await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
    } catch (error) {
      console.error("Error saving entries:", error);
    }
  };

  useEffect(() => {
    saveEntriesToStorage(journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSave = async () => {
    if (!selectedMood || !text.trim()) {
      alert('Please select a mood and enter some text.');
      return;
    }

    const timestamp = new Date();
    const formattedTime = timestamp.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    const updatedEntry = {
      time: String(formattedTime),
      mood: String(selectedMood),
      text: String(text),
      date: timestamp, 
      edited: false, // Default to false, will be set to true if edited later
    };

    //console.log('🛠️ Entry to be saved:', updatedEntry);

    try {
      if (isEditing && editingId) {
        const entryRef = doc(db, 'journalEntries', editingId);
        const updatedEntry = {
          time: formattedTime,
          mood: selectedMood,
          text,
          date: timestamp,
          edited: true,
        };
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
      //console.error('❌ Firebase error during save:', error);
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
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry.");
    }
  };


  const filteredEntries = filterDate
    ? journalEntries.filter(entry =>
      new Date(entry.date).toDateString() === filterDate.toDateString()
    )
    : journalEntries;


  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

        {/*Header*/}
        <View style={styles.headerBar}>
          <Text style={styles.header}>📝 Mood Journal</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Hey User! How are you feeling? </Text>

        {/* Mood Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
          {moods.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedMood(emoji)}
              style={[styles.moodOption, selectedMood === emoji && styles.selectedMood]}
            >
              <Text style={styles.moodEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text Area */}
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity
          style={[styles.saveButton, (!text.trim() || !selectedMood) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!text.trim() || !selectedMood}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.saveText}> Save Entry</Text>
          </View>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 10 }]} // similar style but red
            onPress={() => {
              setIsEditing(false);
              setEditingId(null);
              setText('');
              setSelectedMood('');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="close-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveText}>Cancel Edit</Text>
            </View>
          </TouchableOpacity>
        )}



        {/* Calendar */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFilterDate(selectedDate);
              }
            }}
          />
        )}

        {/* Clear Filter */}
        {filterDate && (
          <TouchableOpacity
            onPress={() => setFilterDate(null)}
            style={[styles.saveButton, { marginTop: 10 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="close-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveText}>Clear Date Filter</Text>
            </View>
          </TouchableOpacity>
        )}



        {journalEntries.length > 0 && (
          <>

            <Text style={styles.subHeader}>────────── Past Journals ──────────</Text>

            {filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTime}>{entry.time}</Text>

                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      style={{ marginRight: 16 }}
                      onPress={() => {
                        setIsEditing(true);
                        setEditingId(entry.id);
                        setText(entry.text);
                        setSelectedMood(entry.mood);
                      }}
                    >
                      <Ionicons name="pencil-outline" size={20} color="#aaa" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          'Delete Entry',
                          'Are you sure you want to delete this entry?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(entry.id) },
                          ]
                        )
                      }>
                      <Ionicons name="trash-outline" size={20} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.entryMood}>{entry.mood}</Text>
                <View>
                  <Text style={styles.entryText}>{entry.text}</Text>

                  {entry.edited && (
                    <Text style={styles.editedLabel}>Edited...</Text>
                  )}
                </View>

              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 8,
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  moodScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  moodOption: {
    backgroundColor: '#1f1b5a',
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedMood: {
    backgroundColor: '#3f34c0',
  },
  moodEmoji: {
    fontSize: 26,
  },
  input: {
    backgroundColor: '#1f1b5a',
    color: '#fff',
    borderRadius: 10,
    padding: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#5d4dfc',
    padding: 14,
    marginTop: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
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
  },
  entryText: {
    color: '#fff',
    fontSize: 14,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editedLabel: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },


});
