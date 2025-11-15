// app/homestyles.tsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  // Top Navigation Bar
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 26,
    paddingBottom: 10,
    backgroundColor: '#2a1faa',
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
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 1, 
  },
  
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom:5
  },
  
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  greeting: {
    color: '#2a1faa',
    fontSize: 30,
    fontWeight: '600',
  },
  username: {
    color: '#2a1faa',
    fontSize: 20,
    marginBottom: 6,
  },
  subtitle: {
    color: '#2a1faa',
    fontSize: 20,
    marginBottom: 30,
  },
  mainButton: {
    backgroundColor: '#2a1faa',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
     scrollContainer: {
    flexGrow: 1,
    paddingBottom: 140,
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
    backgroundColor: '#1f1b5a',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  tileText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
});

export default styles;