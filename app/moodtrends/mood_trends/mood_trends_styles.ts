// app/moodtrends/mood_trends_styles.ts
import { StyleSheet } from 'react-native';

export const getMoodTrendsStyles = (dark: boolean) => {
  const BG = dark ? '#07070a' : '#ffffff';
  const PANEL = dark ? '#0f1016' : '#ffffff';
  const BLUE = dark ? '#9aa3ff' : '#2a1faa';
  const TEXT = dark ? '#e6e6e6' : '#2a1faa';
  const BORDER = dark ? '#2e2b4a' : '#2a1faa';

  return StyleSheet.create({
    gradient: { flex: 1, backgroundColor: BG },

    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 140,
      backgroundColor: BG,
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
      color: TEXT,
      fontSize: 30,
      fontWeight: '700',
    },

    container: { flex: 1, padding: 20, backgroundColor: BG },
    chartContainer: {
      borderWidth: 3,
      borderColor: BORDER,
      height: 250,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      backgroundColor: PANEL,
      // subtle shadow for dark mode
      shadowColor: dark ? '#000' : '#000',
      shadowOffset: { width: 0, height: dark ? 6 : 2 },
      shadowOpacity: dark ? 0.35 : 0.08,
      shadowRadius: dark ? 12 : 6,
      elevation: dark ? 10 : 4,
    },
    heading: {
      fontSize: 20,
      fontWeight: 'bold',
      color: TEXT,
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
      borderWidth: 2,
      borderColor: BLUE,
      height: 130,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginBottom: 12,
      width: '47%',
      justifyContent: 'center',
      alignItems: 'center',
      // backgroundColor chosen at component time for better contrast
    },
    buttonContent: { alignItems: 'center' },
    emojiText: { fontSize: 40, marginBottom: 10 },
    buttonText: { color: BLUE, fontSize: 18, textAlign: 'center' },

    moodTextContainer: { marginTop: 10, alignItems: 'center' },
    moodText: { color: TEXT, fontSize: 16 },
  });
};

export default getMoodTrendsStyles(false);
