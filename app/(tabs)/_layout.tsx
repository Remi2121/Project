import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import highlate from '../../assets/images/highlate.png'; // Corrected relative path

// Custom tab icon with highlight background
const TabIcon = ({ focused, icon }: any) => {
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
      screenOptions={({ route }) => ({
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
        tabBarIcon: ({ focused }) => {
          let iconName: string;

          switch (route.name) {
            case 'index':
              iconName = 'home';
              break;
            case 'chatbot':
              iconName = 'chatbubble-ellipses';
              break;
            case 'profile':
              iconName = 'person-circle';
              break;
            case 'journal':
              iconName = 'book';
              break;
            case 'explore':
              iconName = 'musical-notes';
              break;
            default:
              iconName = 'apps';
          }

          return <TabIcon focused={focused} icon={iconName} />;
        },
        tabBarLabel: route.name === 'index'
          ? 'Home'
          : route.name === 'explore'
          ? 'Explore'
          : route.name === 'chatbot'
          ? 'Chatbot'
          : route.name === 'journal'
          ? 'Journal'
          : route.name === 'profile'
          ? 'Profile'
          : route.name,
      })}
    >
      {/* Visible Tabs */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="chatbot" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="profile" />
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
