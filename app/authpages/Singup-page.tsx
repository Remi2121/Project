// Signup.tsx
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { auth, db } from '../../utils/firebaseConfig';

// 🌙 Theme
import { useSettings } from '../utilis/Settings';
import { getAuthStyles } from './authstyles';

WebBrowser.maybeCompleteAuthSession();

const TABS_HOME = '/(tabs)';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { isDark } = useSettings();
  const styles = getAuthStyles(isDark);

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

  // ================= SIGNUP UI =================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animatable.Text animation="fadeInDown" duration={1200} style={styles.title}>
        Create Your Account
      </Animatable.Text>
      <Text style={styles.subtitle}>Start your journey with Moodify</Text>

      <Animatable.View animation="fadeInUp" delay={200} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400} duration={1000} style={{ width: '100%' }}>
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

      <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={800} duration={1000} style={{ width: '100%' }}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={1000} duration={1000} style={{ width: '100%' }}>
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

      <Animatable.View animation="fadeInUp" delay={1200} duration={1000}>
        <TouchableOpacity onPress={() => router.replace('/authpages/Login-page')}>
          <Text style={[styles.linkText, { marginTop: 15 }]}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
