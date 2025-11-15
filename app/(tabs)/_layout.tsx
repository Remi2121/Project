// app/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSettings } from '../utilis/Settings'; // adjust path if needed

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

// Custom tab icon with optional highlight background
type TabIconProps = {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
};

const TabIcon: React.FC<TabIconProps> = ({ focused, icon, color, size = 24 }) => {
  if (focused) {
    return (
      <View style={styles.focusedIconWrap}>
        <Ionicons name={icon} size={30} color={color} style={{ paddingBottom: 0 }} />
      </View>
    );
  }
  return (
    <View style={styles.tabIconDefault}>
      <Ionicons name={icon} size={size} color={color} style={{ paddingBottom: 2 }} />
    </View>
  );
};

export default function Layout() {
  const { isDark } = useSettings();

  // Theme-aware values
  const ACTIVE = isDark ? '#9aa3ff' : '#1e46bdff';
  const INACTIVE = isDark ? '#9aa3ff66' : '#052278ff';
  const TAB_BAR_BG = isDark ? 'rgba(18,16,28,0.7)' : 'transparent';
  const LABEL_COLOR = isDark ? '#e6e6e6' : '#052278ff';

  // <-- important: use readonly tuple (as const) so LinearGradient typings are satisfied
  const TAB_BG_GRADIENT = isDark
    ? (['#0b0b10ff', '#121018ff'] as const)
    : (['#ffffffff', '#f9f9f9ff'] as const);

  return (
    <Tabs
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 12, color: LABEL_COLOR },
        tabBarStyle: {
          position: 'absolute',
          top: 760, // keep your layout — consider making responsive later
          left: 16,
          right: 16,
          bottom: 16,
          height: 100,
          paddingBottom: 6,
          paddingTop: 8,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: TAB_BAR_BG,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        },
        headerShown: false,
        tabBarBackground: () => (
          // colors prop now receives a readonly tuple -> no TS error
          <LinearGradient colors={TAB_BG_GRADIENT} style={StyleSheet.absoluteFill} />
        ),
        tabBarIcon: ({ focused }: { focused: boolean }) => {
          const iconName = iconMap[route.name] ?? 'apps';
          const resolvedColor = focused ? ACTIVE : INACTIVE;
          return <TabIcon focused={focused} icon={iconName} color={resolvedColor} />;
        },
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
  focusedIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  tabIconDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    borderRadius: 20,
  },
});
