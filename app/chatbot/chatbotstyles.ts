import { StyleSheet } from 'react-native';

const baseBlue = '#2a1faa';

const staticStyles = StyleSheet.create({
 gradient: { flex: 1 },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center'
  },
  question: { 
    fontSize: 18, 
    marginBottom: 10, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderColor: '#2a1faa'
  },
  tips: {
    marginTop: 20,
    fontSize: 18,
    color: '#2a1faa',
    textAlign: 'justify'
  },
header: {
  fontSize: 20,
  textAlign: 'center',          
  textAlignVertical: 'center',  
  color: '#2a1faa',
  marginBottom: 20,
  backgroundColor: '#6a8fdeff',
  height: 40,
  borderRadius: 50,
},


});


const getChatbotStyles = (dark: boolean) =>
  StyleSheet.create({
    gradient: { flex: 1, backgroundColor: dark ? '#07070a' : '#ffffff' },
    scrollContainer: {
      padding: 20,
      paddingBottom: 40,
      flexGrow: 1,
      justifyContent: 'center'
    },
    question: {
      fontSize: 18,
      marginBottom: 10,
      fontWeight: 'bold',
      color: dark ? '#e6e6e6' : baseBlue
    },
    input: {
      borderWidth: 1,
      marginBottom: 10,
      padding: 10,
      borderColor: dark ? '#4b4b6b' : baseBlue,
      color: dark ? '#fff' : '#000',
      backgroundColor: dark ? '#0f0f16' : 'transparent',
      borderRadius: 8,
    },
    tips: {
      marginTop: 20,
      fontSize: 18,
      color: dark ? '#dcdcdc' : baseBlue,
      textAlign: 'justify'
    },
    header: {
      fontSize: 20,
      textAlign: 'center',
      textAlignVertical: 'center',
      color: dark ? '#e6e6e6' : baseBlue,
      marginBottom: 20,
      backgroundColor: dark ? '#2a1faa22' : '#6a8fdeff',
      height: 40,
      borderRadius: 50,
      overflow: 'hidden'
    },
  });

export default staticStyles;
export { getChatbotStyles };

