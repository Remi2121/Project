import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import highlate from '../../assets/images/highlate.png';

// Icon and label mappings
const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  chatbot: 'chatbubble-ellipses',
  profile: 'person-circle',
  journal: 'book',
  explore: 'musical-notes',
};

const labelMap: Record<string, string> = {
  index: 'Home',
  chatbot: 'Chatbot',
  profile: 'Profile',
  journal: 'Journal',
  explore: 'Explore',
};

// Custom tab icon with highlight background
type TabIconProps = {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};

const TabIcon = ({ focused, icon }: TabIconProps) => {
  if (focused) {
    return (
      <ImageBackground
        source={highlate}
        style={styles.tabIconContainer}
        resizeMode="stretch"
      >
        <Ionicons name={icon} size={24} color="#ffffff" />
      </ImageBackground>
    );
  }
  return (
    <View style={styles.tabIconDefault}>
      <Ionicons name={icon} size={24} color="#A8B5DB" />
    </View>
  );
};

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#cccccc',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          height: 100,
          paddingBottom: 5,
          paddingTop: 12,
        },
        headerShown: false,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#0d0b2f', '#2a1faa']}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarIcon: ({ focused }:{focused:boolean}) => (
          <TabIcon focused={focused} icon={iconMap[route.name] ?? 'apps'} />
        ),
        tabBarLabel: labelMap[route.name] ?? route.name,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="chatbot" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="profile" />

      {/* Hidden Screens */}
      <Tabs.Screen name="detect-options" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    flexDirection: 'row',
    width: '100%',
    flex: 1,
    minWidth: 100,
    minHeight: 80,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    overflow: 'hidden',
  },
  tabIconDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    borderRadius: 32,
  },
});
