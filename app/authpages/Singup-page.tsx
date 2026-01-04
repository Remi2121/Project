import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
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

// theme
import { useSettings } from '../utilis/Settings';
import { getAuthStyles } from './authstyles';

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

  // SIGNUP LOGIC (UNCHANGED)
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
      });

      Alert.alert(
        'Success',
        'Account created successfully!',
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
      {/* TOP ICON */}
      <Animatable.View animation="fadeInDown" style={styles.iconWrapper}>
        <Text style={styles.lockIcon}>📝</Text>
      </Animatable.View>

      {/* TITLE */}
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Create Account
      </Animatable.Text>
      <Text style={styles.subtitle}>Start your journey with Moodify</Text>

      {/* USERNAME */}
      <Animatable.View animation="fadeInUp" delay={150} style={styles.inputWrapper}>
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
      <Animatable.View animation="fadeInUp" delay={300} style={styles.inputWrapper}>
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
      <Animatable.View animation="fadeInUp" delay={450} style={styles.inputWrapper}>
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
      <Animatable.View animation="fadeInUp" delay={600} style={styles.inputWrapper}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          style={styles.inputModern}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </Animatable.View>

      {/* SIGNUP BUTTON */}
      <Animatable.View animation="fadeInUp" delay={750} style={{ width: '100%' }}>
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

      {/* LOGIN LINK */}
      <View style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/authpages/Login-page')}>
          <Text style={styles.registerText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
