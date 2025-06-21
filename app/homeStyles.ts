import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  icon: {
    position: 'relative', 
    top: 40,              
    left: 10,             
    width: 160,            
    height: 160,
    borderRadius: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  BigText: {
    fontSize: 50,
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  HomefirstContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  Homefirst: {
    width: 300,
    height: 300,
  },
});

export default styles;
