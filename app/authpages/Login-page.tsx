import { useRouter } from 'expo-router';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { auth } from '../../utils/firebaseConfig';

// theme
import { useSettings } from '../utilis/Settings';
import { getAuthStyles } from './authstyles';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isDark } = useSettings();
  const styles = getAuthStyles(isDark);

  // Track auth state (NO auto redirect)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // LOGIN
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

  // SIGN OUT (if already logged in)
  const onUseDifferentAccount = async () => {
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
      setCurrentUser(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not sign out');
    }
  };

  // ================= ALREADY LOGGED IN =================
  if (currentUser) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animatable.Text animation="fadeInDown" style={styles.title}>
          You’re already signed in
        </Animatable.Text>

        <Text style={styles.subtitle}>
          {currentUser.displayName ?? ''}
          {'\n'}
          {currentUser.email}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.primaryButtonText}>Continue to app</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#555', marginTop: 15 }]}
          onPress={onUseDifferentAccount}
        >
          <Text style={styles.primaryButtonText}>Use different account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  // ================= LOGIN UI =================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* TOP ICON */}
      <Animatable.View animation="fadeInDown" style={styles.iconWrapper}>
        <Text style={styles.lockIcon}>🔒</Text>
      </Animatable.View>

      {/* TITLE */}
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Welcome back
      </Animatable.Text>
      <Text style={styles.subtitle}>You've been missed!</Text>

      {/* EMAIL */}
      <Animatable.View animation="fadeInUp" delay={200} style={styles.inputWrapper}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Animatable.View>

      {/* PASSWORD */}
      <Animatable.View animation="fadeInUp" delay={350} style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animatable.View>

      {/* FORGOT */}
      <TouchableOpacity style={styles.forgotWrapper}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* LOGIN BUTTON */}
      <Animatable.View animation="fadeInUp" delay={500} style={{ width: '100%' }}>
        <TouchableOpacity
          style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
          onPress={onLoginPress}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </Animatable.View>

      {/* REGISTER */}
      <View style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>Not a member? </Text>
        <TouchableOpacity onPress={() => router.push('/authpages/Singup-page')}>
          <Text style={styles.registerText}>Register now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
