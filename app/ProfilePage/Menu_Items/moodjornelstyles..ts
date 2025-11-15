// app/journal/journalstyles.ts
import { StyleSheet } from 'react-native';

const getJournalStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: dark ? '#07070a' : '#ffffff' },
    header: { color: dark ? '#e6e6e6' : '#2a1faa', fontSize: 26, textAlign: 'center', marginBottom: 9 },
    greeting: { color: dark ? '#dcdcdc' : '#2a1faa', fontSize: 16, marginBottom: 20 },
    moodScroll: { flexDirection: 'row', marginBottom: 16 },
    moodOption: { backgroundColor: dark ? '#3a3a4a' : '#6dacd5ff', padding: 12, borderRadius: 20, marginRight: 10 },
    selectedMood: { backgroundColor: dark ? '#6f6cff' : '#3f34c0' },
    moodEmoji: { fontSize: 26 },
    input: {
      backgroundColor: dark ? '#0f0f16' : '#ffffffff',
      color: dark ? '#e6e6e6' : '#2a1faa',
      borderRadius: 10,
      borderWidth: dark ? 1 : 3,
      borderColor: dark ? '#33324a' : '#2a1faa',
      padding: 16,
      textAlignVertical: 'top'
    },
    saveButton: { backgroundColor: dark ? '#6f6cff' : '#000dffff', padding: 14, marginTop: 16, borderRadius: 10, alignItems: 'center' },
    backButton: {
  position: 'absolute',
  top: 60,          
  left: 10,
  zIndex: 20,
  borderRadius: 100,
  padding: 8,
  backgroundColor: 'transparent',
},
backIcon: {
  color: dark ? '#9aa3ff' : '#2a1faa',
  fontSize: 32,
  fontWeight: '700',
},
headerBar: {
  flexDirection: 'row',
  justifyContent: 'center',   // 👈 Center title
  alignItems: 'center',
  marginTop: 5,
  marginBottom: 10,
},

    saveText: { color: dark ? '#000' : '#000000ff', fontSize: 16 },
    subHeader: { color: dark ? '#cfcfcf' : '#2a1faa', textAlign: 'center', marginVertical: 20 },
    entryCard: {
      backgroundColor: dark ? '#0f1016' : '#ffffffff',
      padding: 14,
      borderRadius: 12,
      marginBottom: 14,
      borderWidth: 2,
      borderColor: dark ? '#2e2b4a' : '#2a1faa'
    },
    entryTime: { color: dark ? '#b9b9ff' : '#061efcff', marginBottom: 4, fontSize: 12 },
    entryMood: { fontSize: 20, marginBottom: 4, color: dark ? '#e6e6e6' : '#2a1faa' },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    editedLabel: { color: dark ? '#b9b9ff' : '#061efcff', fontSize: 12, marginTop: 6, textAlign: 'right' },
  });

export { getJournalStyles };
export default getJournalStyles(false); // default export keeps previous import patterns from other files if used
