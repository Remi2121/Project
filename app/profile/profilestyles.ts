import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
 gradient: { flex: 1 },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center'
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