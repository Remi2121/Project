import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
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

export default styles;