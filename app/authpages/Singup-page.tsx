import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { auth, db } from '../../utils/firebaseConfig.js';
import styles from './authstyles';

const TABS_HOME = '/(tabs)'; 
// If you DON'T have app/(tabs)/index.tsx, use a concrete tab path, e.g.:
// const TABS_HOME = '/(tabs)/home';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSignupPress = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);

      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Optional: set displayName in Firebase Auth profile
      await updateProfile(user, { displayName: username });

      // Create user doc in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username,
        email: user.email,
        createdAt: serverTimestamp(),
      });

      // ✅ Show success popup → navigate AFTER OK
      Alert.alert(
        'Success',
        'Signup completed!',
        [{ text: 'OK', onPress: () => router.replace(TABS_HOME) }],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert('Signup failed', error?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animatable.Text animation="fadeInDown" duration={1200} style={styles.title}>
        Create Your Account
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={200} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Username"
          style={[styles.input, { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 }]}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
          placeholderTextColor="#555"
        />
      </Animatable.View>

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
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={onSignupPress}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.buttonText}>
            {submitting ? 'Creating…' : 'Sign Up'}
          </Animatable.Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={1200} duration={1000}>
        <TouchableOpacity onPress={() => router.replace('/authpages/Login-page')}>
          <Text style={[styles.linkText, { marginTop: 15 }]}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}
