// app/ProfilePage/Menu_Items/Settings.tsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSettings } from './Settings';

export default function SettingsScreen() {
  const navigation = useNavigation();
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
  } = useSettings();

  const styles = getStyles(isDark);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t.settings}</Text>
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
          <Text style={styles.label}>{t.reminderTime}</Text>
          <Picker
            selectedValue={reminderTime}
            onValueChange={setReminderTime}
            style={styles.picker}
            dropdownIconColor={isDark ? 'white' : 'black'}
          >
            <Picker.Item label="08:00 AM" value="08:00" />
            <Picker.Item label="12:00 PM" value="12:00" />
            <Picker.Item label="06:00 PM" value="18:00" />
            <Picker.Item label="09:00 PM" value="21:00" />
          </Picker>
        </View>
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
          <Picker.Item label="English" value="en" />
          <Picker.Item label="தமிழ்" value="ta" />
          <Picker.Item label="සිංහල" value="si" />
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

        <TouchableOpacity style={styles.row} onPress={handleLogout}>
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
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: dark ? 'white' : 'black',
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
  color: dark ? '#fff' : '#000', // pure white in dark mode, pure black in light mode
},

    picker: {
      color: dark ? 'white' : 'black',
      backgroundColor: dark ? '#2e2e2e' : '#ffffff',
      marginTop: 8,
      borderRadius: 6,
      minWidth: 120,
    },
  });
