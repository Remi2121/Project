import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Lottie from 'lottie-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import styles from '../explore/explorestyles';

export default function Explore() {
  const [mood, setMood] = useState('');

  const handleMicPress = () => {
    // TODO: integrate voice recognition here
    console.log('Voice input started...');
  };

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
      <Image source={require('../../assets/images/bg.png')} style={styles.bgImage} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Lottie 
            source={require('../../assets/animation/explorelogo.json')} 
            autoPlay 
            loop 
            style={styles.logo}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.headerinput}>Enter the Mood</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Describe your Mood..."
              placeholderTextColor="white"
              value={mood}
              onChangeText={setMood}
            />
            <TouchableOpacity onPress={handleMicPress} style={{ padding: 10 }}>
              <Ionicons name="mic" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.moodItem}>
            <Text style={styles.moodText}>Sad</Text>
            <View style={styles.squareRow}>
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
            
            </View>
          </View>

          <View style={styles.moodItem}>
            <Text style={styles.moodText}>Happy</Text>
            <View style={styles.squareRow}>
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              
            </View>
          </View>

          <View style={styles.moodItem}>
            <Text style={styles.moodText}>Loneliness</Text>
            <View style={styles.squareRow}>
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
              <View style={styles.squareBox} />
             
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

