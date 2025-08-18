import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import styles from './authstyles';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../../utils/firebaseConfig.js';
import * as Animatable from 'react-native-animatable';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSignupPress = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        createdAt: new Date(),
      });

      Alert.alert('Account created!');
      router.push('./authpages/login-page');
    } catch (error: any) {
      Alert.alert('Signup failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animatable.Text 
        animation="fadeInDown" 
        duration={1200} 
        style={styles.title}
      >
        Create Your Account
      </Animatable.Text>

      
      <Animatable.View animation="fadeInUp" delay={400} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Email"
          style={[styles.input, { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#555"
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Password"
          style={[styles.input, { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 }]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#555"
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={800} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Confirm Password"
          style={[styles.input, { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 }]}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#555"
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={1000} duration={1000} style={{ width: '100%' }}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onSignupPress}
          activeOpacity={0.8}
        >
          <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.buttonText}>
            Sign Up
          </Animatable.Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={1200} duration={1000}>
        <TouchableOpacity onPress={() => router.push('/authpages/Login-page')}>
          <Text style={[styles.linkText, { marginTop: 15 }]}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}
