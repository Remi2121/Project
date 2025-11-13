import { useRouter } from 'expo-router';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { auth } from '../../utils/firebaseConfig';
import styles from './authstyles';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Track auth state but DON'T auto-redirect;
  // we show choices if already logged in.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  const onLoginPress = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert(
        'Success',
        'Logged in successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert('Login failed', error?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const onUseDifferentAccount = async () => {
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
      setCurrentUser(null);
      Alert.alert('Signed out', 'You can now log in with a different account.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not sign out');
    }
  };

  // If already signed in, show choices: continue or switch account
  if (currentUser) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animatable.Text animation="fadeInDown" duration={1000} style={styles.title}>
          You’re already signed in
        </Animatable.Text>

        <Animatable.View animation="fadeInUp" delay={200} duration={800} style={{ width: '100%', alignItems: 'center' }}>
          <Text style={[styles.linkText, { marginBottom: 10, textAlign: 'center' }]}>
            {currentUser.displayName ? `${currentUser.displayName}\n` : ''}
            {currentUser.email}
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={400} duration={800} style={{ width: '100%' }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.buttonText}>
              Continue to app
            </Animatable.Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={600} duration={800} style={{ width: '100%' }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#555' }]}
            onPress={onUseDifferentAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Use a different account</Text>
          </TouchableOpacity>
        </Animatable.View>
      </KeyboardAvoidingView>
    );
  }

  // Otherwise, show the normal login form
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)')}
        style={{
          position: 'absolute',
          top: 60,
          left: 20,
          zIndex: 10,
        }}
      >
        <Text style={{ fontSize: 30, color: '#fff', fontWeight: 'bold' }}>← </Text>
      </TouchableOpacity>

      <Animatable.Text animation="fadeInDown" duration={1200} style={styles.title}>
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
          autoCorrect={false}
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
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={onLoginPress}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.buttonText}>
            {submitting ? 'Logging in…' : 'Login'}
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
