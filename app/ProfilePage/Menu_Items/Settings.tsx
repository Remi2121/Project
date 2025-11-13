// app/ProfilePage/Menu_Items/Settings.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSettings } from '../../utilis/Settings';

export default function SettingsScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const {
    notificationsEnabled,
    toggleNotifications,
    vibrationEnabled,
    toggleVibration,
    darkMode,
    toggleDarkMode,
    selectedLanguage,
    setLanguage,
    autoTrackMood,
    toggleAutoTrackMood,
    reminderTime,
    setReminderTime,
    handleLogout,
    resetSettings,
    isDark,
    t,
    biometricEnabled,
    toggleBiometric,
    user,
  } = useSettings();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const styles = getStyles(isDark);

  const confirmLogout = () => {
    Alert.alert(
      t.confirmLogout || 'Logout',
      t.areYouSureLogout || 'Are you sure you want to logout?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        { text: t.logout || 'Logout', onPress: handleLogout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack('../ProfileSideBar/ProfileSidebar.tsx')}>
          <Ionicons name="arrow-back" size={26} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t.settings}</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileBox}>
        {user?.profileImage && (
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
        )}
      </View>

      {/* Theme Preview + Toggle Button */}
      <View style={[styles.themePreviewBox, { backgroundColor: darkMode ? '#333' : '#eee' }]}>
        <Text style={{ color: darkMode ? '#fff' : '#000' }}>
          {t.themePreview || 'Theme Preview'}
        </Text>

        <TouchableOpacity
          onPress={toggleDarkMode}
          style={{
            marginTop: 10,
            backgroundColor: darkMode ? '#444' : '#ddd',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: darkMode ? 'white' : 'black' }}>
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* General */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.general}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{t.enableNotifications}</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t.vibration}</Text>
          <Switch value={vibrationEnabled} onValueChange={toggleVibration} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t.darkMode}</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t.autoMoodTracking}</Text>
          <Switch value={autoTrackMood} onValueChange={toggleAutoTrackMood} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t.useBiometric || 'Biometric Login'}</Text>
          <Switch value={biometricEnabled} onValueChange={toggleBiometric} />
        </View>

        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.row}>
          <Text style={styles.label}>
            {t.reminderTime}: {reminderTime}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            mode="time"
            value={new Date()}
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                const hours = selectedDate.getHours().toString().padStart(2, '0');
                const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                setReminderTime(`${hours}:${minutes}`);
              }
            }}
          />
        )}
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.language}</Text>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={setLanguage}
          style={styles.picker}
          dropdownIconColor={isDark ? 'white' : 'black'}
        >
          <Picker.Item label="🇬🇧 English" value="en" />
          <Picker.Item label="🇮🇳 தமிழ்" value="ta" />
          <Picker.Item label="🇱🇰 සිංහල" value="si" />
        </Picker>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.account}</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>{t.editProfile}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>{t.changePassword}</Text>
        </TouchableOpacity>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.app}</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>{t.privacyPolicy}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>{t.termsOfService}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={resetSettings}>
          <Text style={[styles.label, { color: 'orange' }]}>{t.resetDefaults}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={confirmLogout}>
          <Text style={[styles.label, { color: 'red' }]}>{t.logout}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: dark ? '#121212' : '#f8f9fa',
      flexGrow: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      marginTop: 40,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: dark ? 'white' : 'black',
    },
    profileBox: {
      alignItems: 'center',
      marginBottom: 20,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 8,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: dark ? '#fff' : '#000',
    },
    themePreviewBox: {
      padding: 10,
      borderRadius: 8,
      marginVertical: 10,
      alignItems: 'center',
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: dark ? '#dddddd' : '#333',
      marginBottom: 10,
    },
    row: {
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomColor: dark ? '#444' : '#ccc',
      borderBottomWidth: 1,
    },
    label: {
      fontSize: 16,
      color: dark ? '#fff' : '#000',
    },
    picker: {
      color: dark ? 'white' : 'black',
      backgroundColor: dark ? '#2e2e2e' : '#ffffff',
      marginTop: 8,
      borderRadius: 6,
      minWidth: 120,
    },
  });
