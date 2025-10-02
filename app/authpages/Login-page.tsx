import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import styles from './authstyles';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../../utils/firebaseConfig';
import * as Animatable from 'react-native-animatable';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLoginPress = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Logged in!');
      //router.push('/dashboard');
    } catch (error: any) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Back Button */}
      <TouchableOpacity 
    onPress={() => router.push('../homescreen/homescreen')} 
    style={{
      position: 'absolute',
      top: 60, // adjust for status bar / safe area
      left: 20,
      zIndex: 10,
    }}
  >
    <Text style={{ fontSize: 30, color: '#fff', fontWeight: 'bold' }}>← </Text>
  </TouchableOpacity>


      <Animatable.Text 
        animation="fadeInDown" 
        duration={1200} 
        style={styles.title}
      >
        Welcome Back!
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={200} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Email"
          style={[styles.input, { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 }]}
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Password"
          style={[styles.input, { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 }]}
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={{ width: '100%' }}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onLoginPress}
          activeOpacity={0.8}
        >
          <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.buttonText}>
            Login
          </Animatable.Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={800} duration={1000}>
        <TouchableOpacity onPress={() => router.push('/authpages/Singup-page')}>
          <Text style={[styles.linkText, { marginTop: 15 }]}>Create Account? Click here</Text>
        </TouchableOpacity>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}
