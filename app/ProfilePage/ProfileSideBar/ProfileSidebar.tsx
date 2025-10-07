// ✅ ProfileSidebar.tsx — signup name + per-user photo (with fallback icon)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import styles from './ProfileSidebar.styles';

// 🔐 Firebase
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../../utils/firebaseConfig';

// 📷 Image picker
import * as ImagePicker from 'expo-image-picker';

const menuItems = ['Mood History.', 'Favorites', 'Journal', 'Settings'] as const;
type MenuItem = typeof menuItems[number];

function nameFromEmail(email?: string | null) {
  if (!email) return '';
  const local = email.split('@')[0] ?? '';
  if (!local) return '';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export default function ProfileSidebar() {
  const [menuVisible, setMenuVisible] = useState(true);
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('Share a note.....');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // profile state from Firestore (preferred)
  const [profileName, setProfileName] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const router = useRouter();

  // ---- Load auth + profile doc
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoadingUser(false);

      if (!user) {
        setProfileName('');
        setPhotoURL(null);
        return;
      }

      try {
        // prefer Firestore profile first
        const pref = doc(db, 'profiles', user.uid);
        const snap = await getDoc(pref);

        if (snap.exists()) {
          const data = snap.data() as { name?: string; photoURL?: string | null };
          const name =
            (data.name && data.name.trim()) ||
            user.displayName ||
            nameFromEmail(user.email);
          setProfileName(name);
          setPhotoURL(data.photoURL ?? user.photoURL ?? null);
        } else {
          // if no profile doc yet, bootstrap one from auth
          const bootstrapName = user.displayName || nameFromEmail(user.email) || '';
          const bootstrapPhoto = user.photoURL ?? null;
          await setDoc(pref, {
            uid: user.uid,
            email: user.email || '',
            name: bootstrapName,
            photoURL: bootstrapPhoto,
            createdAt: Date.now(),
          }, { merge: true });

          setProfileName(bootstrapName);
          setPhotoURL(bootstrapPhoto);
        }
      } catch (e) {
        console.warn('Failed to load profile:', e);
        // still show something reasonable
        setProfileName(user.displayName || nameFromEmail(user.email) || '');
        setPhotoURL(user.photoURL ?? null);
      }
    });
    return () => unsub();
  }, []);

  // ---- Pick + upload avatar
  const onEditPhoto = async () => {
    if (!currentUser) {
      Alert.alert('Please sign in to update your photo.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photos to set an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled) return;

    try {
      setSavingPhoto(true);
      const asset = result.assets[0];
      const res = await fetch(asset.uri);
      const blob = await res.blob();

      const safeEmail = (currentUser.email || currentUser.uid).replace(/[^\w.-]/g, '_');
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${safeEmail}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // update Auth + Firestore
      await updateProfile(currentUser, { photoURL: url });

      const pref = doc(db, 'profiles', currentUser.uid);
      await setDoc(pref, { photoURL: url }, { merge: true });

      setPhotoURL(url);
      Alert.alert('Updated', 'Your profile photo was updated.');
    } catch (e) {
      console.error('Upload failed:', e);
      Alert.alert('Error', 'Could not upload photo. Please try again.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleNavigation = (label: MenuItem) => {
    switch (label) {
      case 'Mood History.':
        router.push('../ProfilePage/Menu_Items/mood-history');
        break;
      case 'Favorites':
        router.push('../ProfilePage/Menu_Items/favorites');
        break;
      case 'Journal':
        router.push('../ProfilePage/Menu_Items/moodjournal');
        break;
      case 'Settings':
        router.push('../ProfilePage/Menu_Items/Settings');
        break;
    }
  };

  // UI fields
  const userEmail = currentUser?.email ?? '';
  // 🔒 Name priority: Firestore.name (the one you saved at signup) → Auth.displayName → email-derived
  const userName = (profileName || '').trim() || '';

  return (
    <View style={styles.container}>
      {menuVisible ? (
        <View style={styles.fullscreenOverlay}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            entering={SlideInLeft.duration(800)}
            exiting={SlideOutLeft.duration(800)}
            style={styles.sidebar}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Ionicons name="close" style={styles.closeIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tooltipContainer}
              onPress={() => setIsEditingTooltip(true)}
              activeOpacity={0.8}
            >
              {isEditingTooltip ? (
                <TextInput
                  value={tooltipText}
                  onChangeText={setTooltipText}
                  onBlur={() => setIsEditingTooltip(false)}
                  style={[
                    styles.tooltipText,
                    { backgroundColor: 'white', color: 'black', paddingHorizontal: 6 },
                  ]}
                  autoFocus
                />
              ) : (
                <Text style={styles.tooltipText}>{tooltipText}</Text>
              )}
              <View style={styles.tooltipPointer} />
            </TouchableOpacity>

            <View style={styles.profileHeader}>
              <View style={styles.avatarWrapper}>
                {/* If photo set -> show it, else show human icon */}
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
                    ]}
                  >
                    <Ionicons name="person-circle" size={64} color="white" />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={onEditPhoto}
                  disabled={savingPhoto || loadingUser || !currentUser}
                >
                  {savingPhoto ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="add" size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Header text: only show email/name if logged in */}
              {loadingUser ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator />
                  <Text style={styles.name}>Loading…</Text>
                </View>
              ) : currentUser ? (
                <View style={{ maxWidth: '100%' }}>
                  {!!userName && (
                    <Text style={styles.name} numberOfLines={1}>
                      {userName}
                    </Text>
                  )}
                  {!!userEmail && (
                    <Text style={[styles.name, { opacity: 0.75, fontSize: 12 }]} numberOfLines={1}>
                      {userEmail}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.name} numberOfLines={1}>
                  Guest
                </Text>
              )}
            </View>

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.menuItem}
                onPress={() => {
                  handleNavigation(item);
                  setTimeout(() => setMenuVisible(false), 200);
                }}
              >
                <Text style={styles.menuText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
