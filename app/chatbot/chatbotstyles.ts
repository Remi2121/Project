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
    color: 'white',
    borderColor: 'white'
  },
  tips: {
    marginTop: 20,
    fontSize: 18,
    color: 'white',
    textAlign: 'justify'
  },
  header:{
    fontSize: 20,
    textAlign: 'center',
    color: 'lightblue',
    marginBottom: 20
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '50%',
  }
});

export default styles;