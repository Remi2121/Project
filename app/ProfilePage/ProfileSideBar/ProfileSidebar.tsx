// ProfileSidebar.tsx
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

import { useSettings } from '../../utilis/Settings';
import { getSidebarStyles } from './ProfileSidebar.styles';



// Firebase
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../../utils/firebaseConfig';

// Image picker
import * as ImagePicker from 'expo-image-picker';

const menuItems = ['Mood History.', 'Favorites', 'Journal', 'Settings'] as const;
type MenuItem = typeof menuItems[number];

function nameFromEmail(email?: string | null) {
  if (!email) return '';
  const local = email.split('@')[0] ?? '';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export default function ProfileSidebar() {
  const { isDark } = useSettings();
  const styles = getSidebarStyles(isDark);

  const [menuVisible, setMenuVisible] = useState(true);
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('Share a note.....');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileName, setProfileName] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const router = useRouter();

  // Load profile
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
        const pref = doc(db, 'profiles', user.uid);
        const snap = await getDoc(pref);

        if (snap.exists()) {
          const data = snap.data() as { name?: string; photoURL?: string };
          const name = data.name || user.displayName || nameFromEmail(user.email);
          setProfileName(name);
          setPhotoURL(data.photoURL ?? null);
        } else {
          const name = user.displayName || nameFromEmail(user.email);
          const photo = user.photoURL ?? null;

          await setDoc(pref, {
            uid: user.uid,
            email: user.email,
            name,
            photoURL: photo,
            createdAt: Date.now(),
          });

          setProfileName(name);
          setPhotoURL(photo);
        }
      } catch {
        setProfileName(user?.displayName || nameFromEmail(user?.email) || '');
        setPhotoURL(user?.photoURL ?? null);
      }
    });
    return unsub;
  }, []);

  // Photo upload
  const onEditPhoto = async () => {
    if (!currentUser) {
      Alert.alert('Please sign in first');
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission required');
      return;
    }

    const pick = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (pick.canceled) return;

    try {
      setSavingPhoto(true);
      const asset = pick.assets[0];
      const res = await fetch(asset.uri);
      const blob = await res.blob();

      const refPath = `avatars/${currentUser.uid}.jpg`;
      const storageRef = ref(storage, refPath);
      await uploadBytes(storageRef, blob);
      const dl = await getDownloadURL(storageRef);

      await updateProfile(currentUser, { photoURL: dl });
      await setDoc(doc(db, 'profiles', currentUser.uid), { photoURL: dl }, { merge: true });

      setPhotoURL(dl);
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" style={styles.closeIcon} />
            </TouchableOpacity>

            {/* Tooltip */}
            <TouchableOpacity
              style={styles.tooltipContainer}
              onPress={() => setIsEditingTooltip(true)}
            >
              {isEditingTooltip ? (
                <TextInput
                  value={tooltipText}
                  onChangeText={setTooltipText}
                  onBlur={() => setIsEditingTooltip(false)}
                  style={styles.tooltipInput}
                  autoFocus
                />
              ) : (
                <Text style={styles.tooltipText}>{tooltipText}</Text>
              )}
              <View style={styles.tooltipPointer} />
            </TouchableOpacity>

            {/* Profile section */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrapper}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person-circle" size={64} style={styles.avatarIcon} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={onEditPhoto}
                  disabled={savingPhoto}
                >
                  {savingPhoto
                    ? <ActivityIndicator color="#fff" />
                    : <Ionicons name="add" size={18} color="#fff" />}
                </TouchableOpacity>
              </View>

              <Text style={styles.name}>{profileName || 'Guest'}</Text>
              {currentUser?.email && (
                <Text style={styles.emailText}>{currentUser.email}</Text>
              )}
            </View>

            {/* Menu buttons */}
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
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={32} color={styles.menuIconColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// // ✅ Cleaned & Fixed Full ProfileSidebar.tsx with Navigation
// import { Ionicons } from '@expo/vector-icons';
// import React, { useState } from 'react';
// import {
//   Image,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View,
// } from 'react-native';
// import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
// import styles from './ProfileSidebar.styles';
// import { useRouter } from 'expo-router';
// import { useNavigation } from 'expo-router';


// const menuItems = ['Mood History.', 'Favorites', 'Journal', 'Settings'] as const;

// type MenuItem = typeof menuItems[number];

// export default function ProfileSidebar() {
//   const [menuVisible, setMenuVisible] = useState(true);
//   const [isEditingTooltip, setIsEditingTooltip] = useState(false);
//   const [tooltipText, setTooltipText] = useState('Share a note.....');

//   const userEmail = 'dhanoshiganratnarajah2001@gmail.com';
//   const router = useRouter();

//   // Debugging router object
//   console.log('Router object:', router);

//   const handleNavigation = (label: MenuItem) => {
//   console.log('Navigating to:', label);
//   switch (label) {
//     case 'Mood History.':
//       router.push('./ProfilePage/Menu_Items/mood-history');
//       break;
//     case 'Favorites':
//        router.push('./ProfilePage/Menu_Items/Favorites');
//       break;
//     case 'Journal':
//       router.push('./ProfilePage/Menu_Items/Journal');
//       break;
//     case 'Settings':
//       router.push('../ProfilePage/Menu_Items/Settings');
//       break;
//     default:
//       break;
//   }
// };


//   return (
//     <View style={styles.container}>
//       {menuVisible ? (
//         <View style={styles.fullscreenOverlay}>
//           <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
//             <View style={styles.backdrop} />
//           </TouchableWithoutFeedback>

//           <Animated.View
//             entering={SlideInLeft.duration(800)}
//             exiting={SlideOutLeft.duration(800)}
//             style={styles.sidebar}
//           >
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => setMenuVisible(false)}
//             >
//               <Ionicons name="close" style={styles.closeIcon} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.tooltipContainer}
//               onPress={() => setIsEditingTooltip(true)}
//               activeOpacity={0.8}
//             >
//               {isEditingTooltip ? (
//                 <TextInput
//                   value={tooltipText}
//                   onChangeText={setTooltipText}
//                   onBlur={() => setIsEditingTooltip(false)}
//                   style={[
//                     styles.tooltipText,
//                     {
//                       backgroundColor: 'white',
//                       color: 'black',
//                       paddingHorizontal: 6,
//                     },
//                   ]}
//                   autoFocus
//                 />
//               ) : (
//                 <Text style={styles.tooltipText}>{tooltipText}</Text>
//               )}
//               <View style={styles.tooltipPointer} />
//             </TouchableOpacity>

//             <View style={styles.profileHeader}>
//               <View style={styles.avatarWrapper}>
//                 <Image
//                   source={{ uri: 'https://via.placeholder.com/150' }}
//                   style={styles.avatar}
//                 />
//                 <TouchableOpacity
//                   style={styles.addButton}
//                   onPress={() => console.log('Edit photo')}
//                 >
//                   <Ionicons name="add" size={18} color="white" />
//                 </TouchableOpacity>
//               </View>
//               <Text style={styles.name} numberOfLines={1}>
//                 {userEmail}
//               </Text>
//             </View>

//             {menuItems.map((item) => (
//               <TouchableOpacity
//                 key={item}
//                 style={styles.menuItem}
//                 onPress={() => {
//                   handleNavigation(item);
//                   setTimeout(() => setMenuVisible(false), 200);
//                 }}
//               >
//                 <Text style={styles.menuText}>{item}</Text>
//               </TouchableOpacity>
//             ))}
//           </Animated.View>
//         </View>
//       ) : (
//         <TouchableOpacity
//           style={styles.iconButton}
//           onPress={() => setMenuVisible(true)}
//         >
//           <Ionicons name="menu" size={32} color="white" />
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }
