// ✅ Cleaned & Fixed Full ProfileSidebar.tsx with Navigation
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import styles from './ProfileSidebar.styles';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';


const menuItems = ['Mood History', 'Favorites', 'Journal', 'Settings'] as const;

type MenuItem = typeof menuItems[number];

export default function ProfileSidebar() {
  const [menuVisible, setMenuVisible] = useState(true);
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('Share a note.....');

  const userEmail = 'dhanoshiganratnarajah2001@gmail.com';
  const router = useRouter();

  // Debugging router object
  console.log('Router object:', router);

  const handleNavigation = (label: MenuItem) => {
  console.log('Navigating to:', label);
  switch (label) {
    case 'Mood History':
      router.push('./ProfilePage/Menu_Items/mood-history');
      break;
    case 'Favorites':
       router.push('./ProfilePage/Menu_Items/Favorites');
      break;
    case 'Journal':
      router.push('./ProfilePage/Menu_Items/Journal');
      break;
    case 'Settings':
      router.push('./ProfilePage/Menu_Items/Settings');
      break;
    default:
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
                    {
                      backgroundColor: 'white',
                      color: 'black',
                      paddingHorizontal: 6,
                    },
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
                <Image
                  source={{ uri: 'https://via.placeholder.com/150' }}
                  style={styles.avatar}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => console.log('Edit photo')}
                >
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {userEmail}
              </Text>
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
