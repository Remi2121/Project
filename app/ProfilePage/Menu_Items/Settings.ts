// app/ProfilePage/Menu_Items/Settings.ts
import { useState } from 'react';
import { useColorScheme } from 'react-native';

export const useSettings = () => {
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [autoTrackMood, setAutoTrackMood] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta' | 'si'>('en');
  const [reminderTime, setReminderTime] = useState('08:00');

  const toggleNotifications = () => setNotificationsEnabled((prev) => !prev);
  const toggleVibration = () => setVibrationEnabled((prev) => !prev);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleAutoTrackMood = () => setAutoTrackMood((prev) => !prev);
  const setLanguage = (lang: 'en' | 'ta' | 'si') => setSelectedLanguage(lang);
  const resetSettings = () => {
    setNotificationsEnabled(true);
    setVibrationEnabled(false);
    setDarkMode(false);
    setAutoTrackMood(true);
    setSelectedLanguage('en');
    setReminderTime('08:00');
  };
  const handleLogout = () => {
    console.log('Logout triggered');
  };

  const translations = {
    en: {
      settings: 'Settings',
      general: 'General',
      enableNotifications: 'Enable Notifications',
      vibration: 'Vibration',
      darkMode: 'Dark Mode',
      autoMoodTracking: 'Auto Mood Tracking',
      reminderTime: 'Reminder Time',
      language: 'Language',
      account: 'Account',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      app: 'App',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms & Conditions',
      resetDefaults: 'Reset to Defaults',
      logout: 'Logout',
      back: 'Back',
    },
    ta: {
      settings: 'அமைப்புகள்',
      general: 'பொது',
      enableNotifications: 'அறிவிப்புகளை இயக்கு',
      vibration: 'ஒலி மற்றும் அதிர்வுகள்',
      darkMode: 'இருண்ட மோடு',
      autoMoodTracking: 'தானாக உணர்வு கண்காணிப்பு',
      reminderTime: 'நினைவூட்டு நேரம்',
      language: 'மொழி',
      account: 'கணக்கு',
      editProfile: 'சுயவிவரத்தைத் திருத்து',
      changePassword: 'கடவுச்சொல்லை மாற்று',
      app: 'யாப்பு',
      privacyPolicy: 'கோப்புரிமைக் கொள்கை',
      termsOfService: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
      resetDefaults: 'இயல்புகளுக்கு மீட்டமைக்கவும்',
      logout: 'வெளியேறு',
      back: 'பின்செல்',
    },
    si: {
      settings: 'සැකසුම්',
      general: 'සාමාන්‍ය',
      enableNotifications: 'දැනුම්දීම් සක්‍රීය කරන්න',
      vibration: 'දැඩි හඬ සහ කැපී පෙනෙන ආඥා',
      darkMode: 'අඳුරු මෝඩය',
      autoMoodTracking: 'ස්වයංක්‍රීය හැඟීම් නිරීක්ෂණය',
      reminderTime: 'ස्मරණ කාලය',
      language: 'භාෂාව',
      account: 'ගිණුම',
      editProfile: 'පැතිකඩ සකසන්න',
      changePassword: 'මුරපදය වෙනස් කරන්න',
      app: 'යෙදුම',
      privacyPolicy: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය',
      termsOfService: 'අවශ්‍යතා සහ කොන්දේසි',
      resetDefaults: 'පෙරනිමි අගයන්ට ආපසු යවන්න',
      logout: 'පිටවීම',
      back: 'ආපසු යන්න',
    },
  };

  return {
    notificationsEnabled,
    toggleNotifications,
    vibrationEnabled,
    toggleVibration,
    darkMode,
    toggleDarkMode,
    autoTrackMood,
    toggleAutoTrackMood,
    selectedLanguage,
    setLanguage,
    reminderTime,
    setReminderTime,
    resetSettings,
    handleLogout,
    isDark: darkMode,
    t: translations[selectedLanguage],
  };
};
