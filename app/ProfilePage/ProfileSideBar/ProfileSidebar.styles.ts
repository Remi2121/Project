// ProfileSidebar.styles.ts
import { Dimensions, StyleSheet } from 'react-native';
const { width } = Dimensions.get('window');

export const getSidebarStyles = (dark: boolean) => {
  const BG = dark ? '#0b0b10' : '#ffffff';
  const CARD = dark ? '#151520' : '#ffffff';
  const TEXT = dark ? '#e6e6e6' : '#0d1228';
  const BORDER = dark ? '#3b3b5a' : 'rgba(42,26,170,0.08)';
  const BLUE = dark ? '#6f6cff' : '#2a1faa';
  const ICON = dark ? '#e6e6e6' : '#2a1faa';
  const MENU_BG = dark ? '#1b1b25' : '#ffffff';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: BG,
    },

    fullscreenOverlay: {
      flex: 1,
      flexDirection: 'row-reverse',
    },

    backdrop: {
      width: width * 0.25,
      backgroundColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.06)',
    },

    sidebar: {
      width: width * 0.75,
      backgroundColor: CARD,
      paddingTop: 60,
      paddingHorizontal: 20,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      borderLeftWidth: 1,
      borderLeftColor: BORDER,
    },

    closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      padding: 8,
      zIndex: 10,
    },

    closeIcon: {
      color: ICON,
      fontSize: 26,
    },

    tooltipContainer: {
      alignSelf: 'center',
      backgroundColor: dark ? '#232338' : '#f3f3ff',
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: BORDER,
    },

    tooltipText: {
      color: TEXT,
      fontSize: 15,
      fontStyle: 'italic',
      fontWeight: '500',
    },

    tooltipInput: {
      backgroundColor: dark ? '#2b2b36' : '#ffffff',
      color: dark ? '#e6e6e6' : '#000',
      paddingHorizontal: 6,
      borderRadius: 6,
    },

    tooltipPointer: {
      width: 0,
      height: 0,
      alignSelf: 'center',
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: dark ? '#232338' : '#f3f3ff',
      marginTop: 2,
    },

    profileHeader: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 30,
    },

    avatarWrapper: {
      position: 'relative',
      marginBottom: 10,
    },

    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: BLUE,
      backgroundColor: dark ? '#1c1c29' : '#f6f7fb',
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarIcon: {
      color: BLUE,
    },

    addButton: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: BLUE,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#ffffff',
    },

    name: {
      color: TEXT,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },

    emailText: {
      color: dark ? '#bbbbbb' : '#6b7280',
      fontSize: 12,
      textAlign: 'center',
    },

    menuItem: {
      marginVertical: 10,
      backgroundColor: MENU_BG,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 2,
      borderColor: BLUE,
    },

    menuText: {
      color: TEXT,
      fontSize: 17,
      fontWeight: '600',
    },

    iconButton: {
      position: 'absolute',
      top: 40,
      left: 10,
      padding: 10,
      backgroundColor: CARD,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: BORDER,
    },
  });

  return {
    ...styles,
    menuIconColor: ICON, // <-- THIS IS USED IN THE COMPONENT
  };
};
