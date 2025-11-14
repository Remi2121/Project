import { StyleSheet } from 'react-native';

const PRIMARY = '#2a1faa';
const MUTED = '#3434e1ff';
const CARD = '#0509eeff';

const styles = StyleSheet.create({
  gradient: { flex: 1, backgroundColor: '#ffffff' },

  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 140,
    paddingTop: 20,
  },

  topWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  header: {
    fontSize: 25,
    color: PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
    paddingTop:20
  },

  backButton: {
    position: 'absolute',
    justifyContent: 'center',
    top: 8,
    left: 10,
    zIndex: 10,
    borderRadius: 800,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backIcon: {
    color: PRIMARY,
    fontSize: 30,
    fontWeight: '700',
  },

  toggleButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  toggleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#0707ffff',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  toggleButtonText: {
    color: MUTED,
    fontSize: 16,
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  subHeader: {
    color: MUTED,
    textAlign: 'center',
    marginVertical: 4,
  },

  emptyText: {
    textAlign: 'center',
    color: MUTED,
    marginBottom: 12,
  },

  entryCard: {
    borderColor:CARD,
    borderRadius:30,
    borderWidth:3,
    padding: 14,
    marginBottom: 14,
    
  
  },
  entryTime: {
    color: MUTED,
    marginBottom: 6,
    fontSize: 12,
  },
  entryMood: {
    fontSize: 18,
    marginBottom: 6,
    color: PRIMARY,
    fontWeight: '700',
  },
  entryText: {
    color: '#222',
    fontSize: 15,
  },
  moodEmojiOnly: {
    fontSize: 28,
    color: '#222',
  },
  moodLabel: {
    fontSize: 15,
    color: MUTED,
  },
  editedLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },

  // icons / extras
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
});

export default styles;
