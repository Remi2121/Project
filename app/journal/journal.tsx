// app/journal/index.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from 'utils/firebaseConfig';

// theme
import { useSettings } from '../utilis/Settings';
import { getJournalStyles } from './journalstyles';

const moods = ['😄', '😀', '😊', '😍', '😔', '😢', '😭', '😠', '😤', '😡', '😱', '😨', '😳', '😐', '🤔', '🥱', '😴', '🥳'];

export default function JournalScreen() {
  const router = useRouter();

  // theme hook (must be inside component)
  const { isDark } = useSettings();
  const styles = getJournalStyles(isDark);

  const [selectedMood, setSelectedMood] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEntryFocused, setIsEntryFocused] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // ====== Highlight helper (unchanged) ======
  const highlightText = (textVal: string, queryText: string) => {
    if (!queryText) return <Text style={{ color: isDark ? '#e6e6e6' : '#2a1faa' }}>{textVal}</Text>;
    try {
      const regex = new RegExp(`(${queryText})`, 'gi');
      const parts = textVal.split(regex);
      return (
        <Text style={{ color: isDark ? '#e6e6e6' : '#000' }}>
          {parts.map((part, index) => {
            if (part.toLowerCase() === queryText.toLowerCase()) {
              return (
                <Text
                  key={index}
                  style={{
                    backgroundColor: part.match(/[\u{1F600}-\u{1F64F}]/u) ? '#ffdd55' : 'yellow',
                    color: '#000',
                    fontWeight: 'bold',
                    borderRadius: 4,
                    paddingHorizontal: 2,
                  }}
                >
                  {part}
                </Text>
              );
            }
            return <Text key={index}>{part}</Text>;
          })}
        </Text>
      );
    } catch {
      return <Text style={{ color: isDark ? '#e6e6e6' : '#000' }}>{textVal}</Text>;
    }
  };

  // ====== Helpers to build per-user paths ======
  const getUserCollRef = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not signed in');
    return collection(db, 'users', uid, 'journalEntries');
  };
  const getUserDocRef = (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not signed in');
    return doc(db, 'users', uid, 'journalEntries', id);
  };

  // ====== Load entries (only for logged-in user) ======
  const loadEntries = async () => {
    try {
      if (!auth.currentUser) {
        router.replace('/authpages/Login-page');
        return;
      }
      const qRef = query(getUserCollRef(), orderBy('date', 'desc'));
      const snapshot = await getDocs(qRef);
      const entries = snapshot.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          mood: data.mood,
          text: data.text,
          time: data.time,
          date: data?.date?.toDate ? data.date.toDate() : new Date(data.date),
          edited: data.edited || false,
        };
      });
      setJournalEntries(entries);
    } catch (error) {
      console.error('Error loading Firestore entries:', error);
    }
  };

  const saveEntriesToStorage = async (entries: any[]) => {
    try {
      await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  };

  useEffect(() => {
    saveEntriesToStorage(journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        // Not logged in → go to login
        router.replace('/authpages/Login-page');
      } else {
        loadEntries();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Save (create/update) per-user ======
  const handleSave = async () => {
    if (!selectedMood || !text.trim()) {
      Alert.alert('Please select a mood and enter some text.');
      return;
    }
    if (!auth.currentUser) {
      router.replace('/authpages/Login-page');
      return;
    }

    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const formattedClock = timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedTime = `${formattedDate} ${formattedClock}`;

    const entryData = {
      time: String(formattedTime),
      mood: String(selectedMood),
      text: String(text),
      date: timestamp,      // you can also use serverTimestamp() if preferred
      edited: isEditing ? true : false,
    };

    try {
      if (isEditing && editingId) {
        await updateDoc(getUserDocRef(editingId), entryData);
        const updated = journalEntries.map(entry =>
          entry.id === editingId ? { id: editingId, ...entryData } : entry
        );
        setJournalEntries(updated);
        setIsEditing(false);
        setEditingId(null);
      } else {
        const docRef = await addDoc(getUserCollRef(), entryData);
        setJournalEntries([{ id: docRef.id, ...entryData }, ...journalEntries]);
      }
      setText('');
      setSelectedMood('');
    } catch (error: any) {
      Alert.alert('Cloud save error', error?.message ?? String(error));
    }
  };

  // ====== Delete per-user ======
  const handleDelete = async (id: string) => {
    if (typeof id !== 'string' || !id.trim()) {
      Alert.alert('Invalid document ID.');
      return;
    }
    if (!auth.currentUser) {
      router.replace('/authpages/Login-page');
      return;
    }
    try {
      await deleteDoc(getUserDocRef(id));
      setJournalEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Failed to delete entry.');
    }
  };

  // ====== Filter + Search (unchanged) ======
  const filteredEntries = journalEntries.filter(entry => {
    const matchDate =
      !filterDate || new Date(entry.date).toDateString() === filterDate.toDateString();
    const matchSearch =
      !searchQuery ||
      entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.mood.includes(searchQuery);
    return matchDate && matchSearch;
  });

  return (
    <LinearGradient colors={isDark ? ['#0b0b10', '#121018'] : ['#ffffffff', '#ffffffff']} style={styles.container}>
      <ScrollView contentContainerStyle={[ { paddingBottom: 140 }]} keyboardShouldPersistTaps="handled">
        {/*Header*/}
        <View style={styles.headerBar}>
          <Text style={styles.header}>📝 Mood Journal</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={24} color={isDark ? '#0015ffff' : '#fff'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>
          {auth.currentUser?.displayName ? `Hey ${auth.currentUser.displayName}!` : 'Hey User!'} How are you feeling?
        </Text>

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
          style={[
            styles.input,
            isEntryFocused && { borderColor: isDark ? '#6f6cff' : '#0712e9ff', borderWidth: 1 }
          ]}
          placeholder="What's on your mind?"
          placeholderTextColor={isDark ? '#9a9a9a' : '#0026ffff'}
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsEntryFocused(true)}
          onBlur={() => setIsEntryFocused(false)}
        />

        <TouchableOpacity
          style={[styles.saveButton, (!text.trim() || !selectedMood) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!text.trim() || !selectedMood}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="save-outline" size={18} color={isDark ? '#000' : '#000000ff'} style={{ marginRight: 6 }} />
            <Text style={styles.saveText}> Save Entry</Text>
          </View>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 10 }]}
            onPress={() => {
              setIsEditing(false);
              setEditingId(null);
              setText('');
              setSelectedMood('');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              if (selectedDate) setFilterDate(selectedDate);
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
              <Text style={styles.saveText}>Clear Date Filter</Text>
            </View>
          </TouchableOpacity>
        )}

        {journalEntries.length > 0 && (
          <>
            <Text style={styles.subHeader}>─────── Past Journals ─────── </Text>

            <TextInput
              style={[
                styles.input,
                { marginBottom: 18 },
                isSearchFocused && { borderColor: isDark ? '#8f7fff' : '#3f34c0', borderWidth: 1 }
              ]}
              placeholder="Search your past entries..."
              placeholderTextColor={isDark ? '#9a9a9a' : '#162ceeff'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />

            {filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.entryTime}>
                      <Ionicons name="calendar-outline" size={14} color={isDark ? '#b9b9ff' : '#061efcff'} style={{ marginRight: 4 }} /> {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.entryTime}>
                      <Ionicons name="time-outline" size={14} color={isDark ? '#b9b9ff' : '#061efcff'} style={{ marginRight: 4 }} /> {new Date(entry.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      style={{ marginRight: 16  }}
                      onPress={() => {
                        setIsEditing(true);
                        setEditingId(entry.id);
                        setText(entry.text);
                        setSelectedMood(entry.mood);
                      }}
                    >
                      <Ionicons name="pencil-outline" size={20} color={isDark ? '#dcdcdc' : '#061efcff'} />
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
                      <Ionicons name="trash-outline" size={20} color={isDark ? '#dcdcdc' : '#061efcff'} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.entryMood}>{highlightText(entry.mood, searchQuery)}</Text>
                <View>
                  {highlightText(entry.text, searchQuery)}
                  {entry.edited && <Text style={styles.editedLabel}>Edited...</Text>}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
