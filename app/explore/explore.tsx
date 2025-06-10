import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, Text } from 'react-native';
import styles from './explorestyles';


export default function explore() {
  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
       <Image source={require('../../assets/images/bg.png')} style={styles.bgImage} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>...</Text>

      </ScrollView>
    </LinearGradient>
  );
}
