import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  
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
  color: 'white',
  fontSize: 30,
  fontWeight: '700',

},

  container: { flex: 1, padding: 20 },
  chartContainer: {
    backgroundColor: '#040429',
    height: 250,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
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
  buttonContent: { alignItems: 'center' },
  emojiText: { fontSize: 40, marginBottom: 10 },
  buttonText: { color: 'white', fontSize: 18, textAlign: 'center' },

  moodTextContainer: { marginTop: 10, alignItems: 'center' },
  moodText: { color: 'white', fontSize: 16 },

  weekCard: {
    backgroundColor: '#040429',
    borderRadius: 20,
    padding: 14,
    marginTop: 10,
  },
  weekTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  weekLine: { color: 'white', fontSize: 15, marginTop: 6 },
  weekLineSmall: { color: '#cfd3ff', fontSize: 13, marginTop: 6 },
  weekBold: { fontWeight: '700', color: 'white' },
});

export default styles;
