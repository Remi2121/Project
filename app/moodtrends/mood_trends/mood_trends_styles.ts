import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  gradient: { flex: 1, backgroundColor: '#ffffff' },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 140,
    backgroundColor: '#ffffff',
  },

  backButton: {
    position: 'absolute',
    justifyContent: 'center',
    top: 40,
    left: 15,
    zIndex: 10,
    borderRadius: 800,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backIcon: {
    color: '#2a1faa',
    fontSize: 30,
    fontWeight: '700',
  },

  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  chartContainer: {
    borderWidth: 5,
    borderColor: '#2a1faa',
    height: 250,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2a1faa',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    borderWidth: 5,
    borderColor: '#2a1faa',
    height: 130,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '47%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  buttonContent: { alignItems: 'center' },
  emojiText: { fontSize: 40, marginBottom: 10 },
  buttonText: { color: '#2a1faa', fontSize: 18, textAlign: 'center' },

  moodTextContainer: { marginTop: 10, alignItems: 'center' },
  moodText: { color: '#2a1faa', fontSize: 16 },

  // keep week card styles if you add them later
});

export default styles;
