// Login.tsx
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
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
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';



// theme
import { useSettings } from '../utilis/Settings';
import { getAuthStyles } from './authstyles';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
WebBrowser.maybeCompleteAuthSession();


export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isDark } = useSettings();
  const styles = getAuthStyles(isDark);
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId:
    '1020654886415-c95h2mv7ieth3ub37mrje959efqtcnro.apps.googleusercontent.com',

  iosClientId:
    '1020654886415-fg9nfodahpf65frdhf83vlk3f44ri9oc.apps.googleusercontent.com',

  
    androidClientId:
      '1020654886415-og0tb3ins8k0lh9o845lsh96futpgpnb.apps.googleusercontent.com',

  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'exp',
  }),
});






  // Track auth state (NO auto redirect) 1020654886415-og0tb3ins8k0lh9o845lsh96futpgpnb.apps.googleusercontent.com
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


      {/* OR CONTINUE WITH */}
<View style={styles.orWrapper}>
  <View style={styles.line} />
  <Text style={styles.orText}>or continue with</Text>
  <View style={styles.line} />
</View>

{/* SOCIAL LOGIN */}
<View style={styles.socialWrapper}>
  {/* GOOGLE */}
<TouchableOpacity
  style={styles.socialButton}
  onPress={() => promptAsync()}
  disabled={!request}
>
  <Ionicons name="logo-google" size={22} color="#000" />
</TouchableOpacity>



  {/* APPLE */}
  <TouchableOpacity style={styles.socialButton}>
    <Ionicons name="logo-apple" size={24} color="#000" />
  </TouchableOpacity>
</View>


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