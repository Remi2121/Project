import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    position: 'relative',
  },

  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '50%',
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  headerinput: {
    fontSize: 20,
    textAlign: 'left',
    color: 'lightblue',
    marginTop: 10,
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

  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    color: 'white',
    marginRight: 20,
  },

  moodText: {
    fontSize: 20,
    color: 'white',
    marginTop: 8,
  },

  moodItem: {
    marginBottom: 20,
    
  },

  squareRow: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },

  squareBox: {
    width: 80,
    height: 80,
    backgroundColor: 'blue',
    margin: 3,
    borderRadius: 5,
  },
});


export default styles;