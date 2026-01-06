// Signup.tsx

import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
import { auth, db } from '../../utils/firebaseConfig';

// 🌙 Theme
import { useSettings } from '../utilis/Settings';
import { getAuthStyles } from './authstyles';

WebBrowser.maybeCompleteAuthSession();

const TABS_HOME = '/(tabs)';

export default function Signup() {
  const router = useRouter();
  const { isDark } = useSettings();
  const styles = getAuthStyles(isDark);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ✅ Google Auth (same as Login page)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      '1020654886415-c95h2mv7ieth3ub37mrje959efqtcnro.apps.googleusercontent.com',
    iosClientId:
      '1020654886415-fg9nfodahpf65frdhf83vlk3f44ri9oc.apps.googleusercontent.com',
    androidClientId:
      '1020654886415-og0tb3ins8k0lh9o845lsh96futpgpnb.apps.googleusercontent.com',
  });

  // 🔁 Handle Google signup / login
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      if (!id_token) {
        Alert.alert('Google signup failed');
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(async ({ user }) => {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);

          // 🆕 Create Firestore doc only first time
          if (!snap.exists()) {
            await setDoc(ref, {
              uid: user.uid,
              username: user.displayName ?? 'Google User',
              email: user.email,
              createdAt: serverTimestamp(),
              provider: 'google',
            });
          }

          router.replace(TABS_HOME);
        })
        .catch((err) => {
          Alert.alert('Google signup failed', err.message);
        });
    }
  }, [response, router]);

  // 📧 Email / Password signup
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

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(user, { displayName: username });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username,
        email: user.email,
        createdAt: serverTimestamp(),
        provider: 'password',
      });

      router.replace(TABS_HOME);
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
      {/* TITLE */}
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Create Your Account
      </Animatable.Text>

      {/* USERNAME */}
      <Animatable.View animation="fadeInUp" delay={200} style={styles.inputWrapper}>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
        />
      </Animatable.View>

      {/* EMAIL */}
      <Animatable.View animation="fadeInUp" delay={350} style={styles.inputWrapper}>
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
      <Animatable.View animation="fadeInUp" delay={500} style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animatable.View>

      {/* CONFIRM PASSWORD */}
      <Animatable.View animation="fadeInUp" delay={650} style={styles.inputWrapper}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </Animatable.View>

      {/* SIGN UP BUTTON */}
      <Animatable.View animation="fadeInUp" delay={800} style={{ width: '100%' }}>
        <TouchableOpacity
          style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
          onPress={onSignupPress}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Creating…' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </Animatable.View>

      {/* OR */}
      <View style={styles.orWrapper}>
        <View style={styles.line} />
        <Text style={styles.orText}>or sign up with</Text>
        <View style={styles.line} />
      </View>

      {/* SOCIAL SIGNUP (GOOGLE + APPLE) */}
      <View style={styles.socialWrapper}>
        {/* GOOGLE */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Ionicons name="logo-google" size={22} color="#000" />
        </TouchableOpacity>

        {/* APPLE / iCLOUD */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() =>
            Alert.alert(
              'Coming soon',
              'Apple Sign-In will be available soon 🍎'
            )
          }
        >
          <Ionicons name="logo-apple" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* LOGIN LINK */}
      <View style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>Already have an account? </Text>
        <TouchableOpacity
          onPress={() => router.replace('/authpages/Login-page')}
        >
          <Text style={styles.registerText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
