import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  greeting: {
    color: '#060606ff',
    fontSize: 40,
    fontWeight: '600',
  },
  username: {
    color: '#030303ff',
    fontSize: 30,
    marginBottom: 6,
  },
  subtitle: {
    color: '#101011ff',
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