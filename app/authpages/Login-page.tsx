import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
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
import { useSettings } from '../utilis/Settings';
import { getAuthStyles } from './authstyles';

WebBrowser.maybeCompleteAuthSession();

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useSettings();
  const styles = getAuthStyles(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ GOOGLE AUTH (Expo Go – CORRECT SETUP)
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId:
    '1020654886415-c95h2mv7ieth3ub37mrje959efqtcnro.apps.googleusercontent.com',

  iosClientId:
    '1020654886415-fg9nfodahpf65frdhf83vlk3f44ri9oc.apps.googleusercontent.com',

  webClientId:
    '1020654886415-c95h2mv7ieth3ub37mrje959efqtcnro.apps.googleusercontent.com',
});


  // 🔁 Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // 🔐 Handle Google login response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      if (!id_token) {
        Alert.alert('Google login failed', 'No ID token received');
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => {
          router.replace('/(tabs)');
        })
        .catch((err) => {
          Alert.alert('Google login failed', err.message);
        });
    }
  }, [response, router]);

  // 📧 Email / Password login
  const onLoginPress = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login failed', error?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  // 🚪 Sign out
  const onUseDifferentAccount = async () => {
    await signOut(auth);
    setEmail('');
    setPassword('');
    setCurrentUser(null);
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
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Welcome back
      </Animatable.Text>

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

      <TouchableOpacity
        style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
        onPress={onLoginPress}
        disabled={submitting}
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <View style={styles.orWrapper}>
        <View style={styles.line} />
        <Text style={styles.orText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialWrapper}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Ionicons name="logo-google" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>Not a member? </Text>
        <TouchableOpacity onPress={() => router.push('/authpages/Singup-page')}>
          <Text style={styles.registerText}>Register now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
