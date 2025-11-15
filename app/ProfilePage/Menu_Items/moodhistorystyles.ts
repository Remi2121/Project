// app/moodtrends/history_styles.ts
import { StyleSheet } from 'react-native';

export const getHistoryStyles = (dark: boolean) => {
  const PRIMARY = dark ? '#9aa3ff' : '#2a1faa';
  const MUTED = dark ? '#b9b9ff' : '#3434e1ff';
  const CARD_BORDER = dark ? '#2e2b4a' : '#0509eeff';
  const BG = dark ? '#07070a' : '#ffffff';
  const PANEL = dark ? '#0f1016' : '#ffffff';
  const TEXT = dark ? '#e6e6e6' : '#222';

  return StyleSheet.create({
    gradient: { flex: 1, backgroundColor: BG },

    scrollContainer: {
      flexGrow: 1,
      backgroundColor: BG,
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
      paddingTop: 20,
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
      backgroundColor: PANEL,
      borderWidth: 2,
      borderColor: dark ? '#33324a' : '#0707ffff',
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
      color: dark ? '#dcdcff' : MUTED,
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
      borderColor: CARD_BORDER,
      borderRadius: 20,
      borderWidth: 2,
      padding: 14,
      marginBottom: 14,
      backgroundColor: PANEL,
      // subtle shadow
      shadowColor: dark ? '#000' : '#000',
      shadowOffset: { width: 0, height: dark ? 6 : 2 },
      shadowOpacity: dark ? 0.28 : 0.08,
      shadowRadius: dark ? 12 : 6,
      elevation: dark ? 8 : 3,
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
      color: TEXT,
      fontSize: 15,
    },
    moodEmojiOnly: {
      fontSize: 28,
      color: TEXT,
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
};

// default fallback for modules that import default
export default getHistoryStyles(false);
