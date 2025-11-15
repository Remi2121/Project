// app/homestyles.tsx
import { StyleSheet } from 'react-native';

const getHomeStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? '#121212' : 'white',
    },
    scrollContainer: {
    flexGrow: 1,
    paddingBottom: 140,
  },
    // Top Navigation Bar
    navBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 26,
      paddingBottom: 10,
      backgroundColor: dark ? '#000000' : '#2a1faa',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      height: 80,
    },

    appNameContainer: {
      flex: 1,
      alignItems: 'flex-start',
    },

    appName: {
      color: dark ? '#ffffff' : 'white', // navBar la irukkura text, dark-la white dhaan
      fontSize: 30,
      fontWeight: 'bold',
      letterSpacing: 1,
    },

    loginButtonText: {
      color: dark ? '#ffffff' : 'white',
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 5,
    },

    content: {
      flex: 1,
      paddingTop: 20,
      paddingHorizontal: 24,
    },

    greeting: {
      color: dark ? '#ffffff' : '#2a1faa',
      fontSize: 30,
      fontWeight: '600',
      marginTop: 8,
    },

    username: {
      color: dark ? '#dddddd' : '#2a1faa',
      fontSize: 20,
      marginTop: 8,
    },

    subtitle: {
      color: dark ? '#bbbbbb' : '#2a1faa',
      fontSize: 20,
      marginBottom: 30,
      marginTop: 8,
    },

    mainButton: {
      backgroundColor: dark ? '#3e16b5ff' : '#2a1faa',
      padding: 24,
      borderRadius: 20,
      alignItems: 'center',
      marginBottom: 30,
      marginTop: 2,
    },

    mainText: {
      color: '#fff',
      fontSize: 18,
      marginTop: 10,
    },

    icon: {
      fontSize: 60,
      color: '#fff',
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    tile: {
      backgroundColor: dark ? '#2d2980ff' : '#1f1b5a',
      width: '48%',
      padding: 20,
      borderRadius: 15,
      alignItems: 'center',
      marginBottom: 20,
    },

    tileText: {
      color: '#fff',
      marginTop: 8,
      fontSize: 14,
    },
  });

export default getHomeStyles;
