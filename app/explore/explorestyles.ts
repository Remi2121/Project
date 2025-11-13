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
    marginTop: 10,
    color: 'black',
  },

  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },

  logo: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
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

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    backgroundColor: 'black',
    borderRadius: 20,  
  },

 
  searchResultsContainer: {
    marginTop: 20,
    justifyContent: 'center',
  },

  searchResultsHeader: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },

  playlistCard: {
    padding: 15,
    marginVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 20,
  },

  playlistImageLarge: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 15,
  },

  playlistNameLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },

  playlistTapText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },

  suggestionsHeader: {
    color: 'white',
    fontSize: 22,
    marginTop: 30,
    fontWeight: 'bold',
  },

  moodSectionContainer: {
    marginTop: 25,
  },

moodSectionTitle: {
  color: 'white',
  fontSize: 26,   
  fontWeight: '700',
  marginBottom: 12,
  
},

  suggestionsScrollView: {
    paddingLeft: 0,
  },

  
playlistCardSmall: {
  width: 250,     
  height: 250,
  marginRight: 18,
  borderRadius: 12,
  padding: 12,
  justifyContent: 'center',
  alignItems: 'center',
},


playlistImageSmall: {
  width: 200,     
  height: 200,    
  borderRadius: 10,
  marginBottom: 10,
  resizeMode: 'cover',
},

playlistNameSmall: {
  fontSize: 14,
  color: 'white',
  textAlign: 'center',  
  height: 40,           
},

});

export default styles;
