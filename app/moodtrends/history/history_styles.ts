import { StyleSheet } from 'react-native';

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

export default styles;