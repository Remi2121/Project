import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

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

        <Ionicons
          name={icon}
          size={30}
          color="#007BFF"
          style={{ paddingBottom: 0 }}
        />
     
    );
  }

  return (
    <View style={styles.tabIconDefault}>
      <Ionicons
        name={icon}
        size={24}
        color="#000000"
        style={{ paddingBottom: 2 }}
      />
    </View>
  );
};

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarActiveTintColor: '#ff0000ff',
        tabBarInactiveTintColor: '#000000ff',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          position: 'absolute',
          top:760,     
          left: 16,                 
          right: 16,
          bottom: 16,               
          height: 100,
          paddingBottom: 6,
          paddingTop: 8,
          borderRadius: 20,          
          overflow: 'hidden',       
          backgroundColor: 'transparent',
          // shadow (iOS)
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          // elevation (Android)
          elevation: 8,
        },
        headerShown: false,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#ffffffff', '#ffffffff']}
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
      <Tabs.Screen name="camera" options={{ href: null }} />
      <Tabs.Screen name="audio" options={{ href: null }} />
      <Tabs.Screen name="cameraResult" options={{ href: null }} />
      <Tabs.Screen name="recommendList" options={{ href: null }} />
      <Tabs.Screen name="playlist" options={{ href: null }} />
      <Tabs.Screen name="mood_trends" options={{ href: null }} />
      <Tabs.Screen name="stressRelief" options={{ href: null }} />
      <Tabs.Screen name="Player" options={{ href: null }} />
      <Tabs.Screen name="talesPlayer" options={{ href: null }} />
      <Tabs.Screen name="playlistDetails" options={{ href: null }} />
      <Tabs.Screen name="microphoneResult" options={{ href: null }} />
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
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    overflow: 'hidden',
  },
  tabIconDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    borderRadius: 20,
  },
});
