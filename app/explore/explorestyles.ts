// app/explore/explorestyles.ts
import { StyleSheet } from 'react-native';

const BLUE = '#2a1faa';   // main blue

// ---------- Original static styles (default export) ----------
// Keeps your current component working without any changes.
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: 'white',   // FULL WHITE
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 140,
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

// ---------- New: function-based themed styles ----------
// Use this later to enable dark-mode. It does NOT break the default export.
const getExploreStyles = (dark: boolean) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
      backgroundColor: dark ? '#07070a' : 'white',
    },

    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 140,
    },

    headerinput: {
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'left',
      marginTop: 10,
      color: dark ? '#e6e6e6' : BLUE,
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
      borderColor: dark ? '#4b4b6b' : BLUE,
      borderRadius: 15,
      paddingHorizontal: 10,
      backgroundColor: dark ? '#0f0f16' : 'transparent',
    },

    input: {
      flex: 1,
      padding: 10,
      color: dark ? '#fff' : BLUE,
      fontSize: 16,
    },

    /** SEARCH RESULTS */
    searchResultsContainer: {
      marginTop: 25,
    },

    searchResultsHeader: {
      color: dark ? '#f0f0f0' : BLUE,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 10,
    },

    playlistCard: {
      padding: 12,
      marginVertical: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: dark ? '#3a3560' : BLUE,
      backgroundColor: dark ? '#121023' : '#EAF2FF',
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
      color: dark ? '#ffffff' : 'black',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    playlistTapText: {
      color: dark ? '#cfcfcf' : 'black',
      opacity: 0.7,
      marginBottom: 8,
    },

    /** SUGGESTIONS TITLE */
    suggestionsHeader: {
      color: dark ? '#f0f0f0' : BLUE,
      fontSize: 24,
      marginTop: 35,
      fontWeight: 'bold',
    },

    /** EACH MOOD SECTION */
    moodSectionContainer: {
      marginTop: 25,
    },

    moodSectionTitle: {
      color: dark ? '#e6e6e6' : BLUE,
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
      borderColor: dark ? '#3a3560' : BLUE,
      backgroundColor: dark ? '#121023' : '#EAF2FF',
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
      color: dark ? '#fff' : 'black',
      textAlign: 'center',
      height: 40,
      fontWeight: '600',
    },
  });

export default styles;
export { getExploreStyles };

