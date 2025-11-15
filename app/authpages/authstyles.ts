// authstyles.ts
import { StyleSheet } from 'react-native';

export const getAuthStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? '#07070a' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },

    title: {
      fontSize: 32,
      color: dark ? '#e6e6e6' : '#2a1faa',
      fontWeight: 'bold',
      marginBottom: 30,
    },

    input: {
      width: '100%',
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
      fontSize: 16,
      backgroundColor: dark ? '#0f0f16' : '#ffffff',
      borderWidth: 2,
      borderColor: dark ? '#33324a' : '#072cffff',
      color: dark ? '#e6e6e6' : '#000',
    },

    button: {
      backgroundColor: dark ? '#6f6cff' : '#1515caff',
      padding: 15,
      borderRadius: 10,
      marginTop: 50,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },

    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },

    linkText: {
      color: dark ? '#9aa3ff' : '#2a1faa',
      textDecorationLine: 'underline',
      fontSize: 16,
      textAlign: 'center',
      fontWeight: 'bold',
    },

    backArrow: {
      fontSize: 30,
      color: dark ? '#ffffff' : '#1f1f41',
      fontWeight: 'bold',
    },

    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 20,
      backgroundColor: dark ? '#1a1a1a' : '#f5f5f5',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? '#333' : '#ddd',
    },

    googleTxt: {
      fontSize: 18,
      fontWeight: '600',
      color: dark ? '#e6e6e6' : '#333',
    },
  });  

// default export (for legacy imports)
export default getAuthStyles(false);
