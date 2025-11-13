import { StyleSheet } from 'react-native';

const BLUE = '#2a1faa';   // main blue

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: 'white',   // FULL WHITE
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  headerinput: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
    marginTop: 10,
    color: BLUE,
  },

  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },

  logo: {
    width: 100,
    height: 100,
  },

  textContainer: {
    marginLeft: 20,
    marginTop: 20,
  },

  /** INPUT BOX BLUE THEME */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BLUE,

    borderRadius: 15,
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    padding: 10,
    color: BLUE,
    fontSize: 16,
  },

  /** SEARCH RESULTS */
  searchResultsContainer: {
    marginTop: 25,
  },

  searchResultsHeader: {
    color: BLUE,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  playlistCard: {
    padding: 12,
    marginVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BLUE,
    backgroundColor: '#EAF2FF', // soft blue background
    alignItems: 'center',
    marginRight: 20,
  },

  playlistImageLarge: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },

  playlistNameLarge: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  playlistTapText: {
    color: 'black',
    opacity: 0.7,
    marginBottom: 8,
  },

  /** SUGGESTIONS TITLE */
  suggestionsHeader: {
    color: BLUE,
    fontSize: 24,
    marginTop: 35,
    fontWeight: 'bold',
  },

  /** EACH MOOD SECTION */
  moodSectionContainer: {
    marginTop: 25,
  },

  moodSectionTitle: {
    color: BLUE,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },

  suggestionsScrollView: {
    paddingLeft: 0,
  },

  /** SUGGESTION CARDS */
  playlistCardSmall: {
    width: 200,
    height: 230,
    marginRight: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BLUE,
    backgroundColor: '#EAF2FF',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  playlistImageSmall: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
  },

  playlistNameSmall: {
    fontSize: 15,
    color: 'black',
    textAlign: 'center',
    height: 40,
    fontWeight: '600',
  },
});

export default styles;
