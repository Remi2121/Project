// app/ProfilePage/Menu_Items/Settings.ts
import { useState } from 'react';
import { useColorScheme } from 'react-native';

export const useSettings = () => {
  const colorScheme = useColorScheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [autoTrackMood, setAutoTrackMood] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta' | 'si'>('en');
  const [reminderTime, setReminderTime] = useState('08:00');

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);
  const toggleVibration = () => setVibrationEnabled(prev => !prev);
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleAutoTrackMood = () => setAutoTrackMood(prev => !prev);
  const toggleBiometric = () => setBiometricEnabled(prev => !prev);

  const setLanguage = (lang: 'en' | 'ta' | 'si') => setSelectedLanguage(lang);

  const resetSettings = () => {
    setNotificationsEnabled(true);
    setVibrationEnabled(false);
    setDarkMode(false);
    setAutoTrackMood(true);
    setBiometricEnabled(false);
    setSelectedLanguage('en');
    setReminderTime('08:00');
  };

  const handleLogout = () => {
    console.log('Logout triggered');
  };

  const user = {
    //name: 'Kavisha',
    profileImage: 'https://placekitten.com/200/200', // you can use Firebase image here
  };

  const translations = {
    en: {
      settings: 'Settings',
      general: 'General',
      enableNotifications: 'Enable Notifications',
      vibration: 'Vibration',
      darkMode: 'Dark Mode',
      autoMoodTracking: 'Auto Mood Tracking',
      useBiometric: 'Biometric Login',
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
      confirmLogout: 'Confirm Logout',
      areYouSureLogout: 'Are you sure you want to logout?',
      cancel: 'Cancel',
      back: 'Back',
      themePreview: 'Theme Preview',
    },
    ta: {
      settings: 'அமைப்புகள்',
      general: 'பொது',
      enableNotifications: 'அறிவிப்புகளை இயக்கு',
      vibration: 'ஒலி மற்றும் அதிர்வுகள்',
      darkMode: 'இருண்ட மோடு',
      autoMoodTracking: 'தானாக உணர்வு கண்காணிப்பு',
      useBiometric: 'முகம்/விரல் உறுதி உள்நுழைவு',
      reminderTime: 'நினைவூட்டு நேரம்',
      language: 'மொழி',
      account: 'கணக்கு',
      editProfile: 'சுயவிவரத்தைத் திருத்து',
      changePassword: 'கடவுச்சொல்லை மாற்று',
      app: 'யாப்பு',
      privacyPolicy: 'தனியுரிமைக் கொள்கை',
      termsOfService: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
      resetDefaults: 'இயல்புகளுக்கு மீட்டமைக்கவும்',
      logout: 'வெளியேறு',
      confirmLogout: 'வெளியேறும் உறுதிப்பாடு',
      areYouSureLogout: 'நீங்கள் நிச்சயமாக வெளியேற விரும்புகிறீர்களா?',
      cancel: 'ரத்து செய்',
      back: 'பின்செல்',
      themePreview: 'தீம் முன்னோட்டம்',
    },
    si: {
      settings: 'සැකසුම්',
      general: 'සාමාන්‍ය',
      enableNotifications: 'දැනුම්දීම් සක්‍රීය කරන්න',
      vibration: 'අඳුරු හඬ සහ කම්පන',
      darkMode: 'අඳුරු මාදිලිය',
      autoMoodTracking: 'ස්වයංක්‍රීය හැඟීම් නිරීක්ෂණය',
      useBiometric: 'ජෛවmetric පිවිසුම',
      reminderTime: 'ස्मරණ කාලය',
      language: 'භාෂාව',
      account: 'ගිණුම',
      editProfile: 'පැතිකඩ සකසන්න',
      changePassword: 'මුරපදය වෙනස් කරන්න',
      app: 'යෙදුම',
      privacyPolicy: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය',
      termsOfService: 'සේවා නියමයන්',
      resetDefaults: 'පෙරනිමිවලට ආපසු යන්න',
      logout: 'පිටවීම',
      confirmLogout: 'ඉවත් වීම තහවුරු කරන්න',
      areYouSureLogout: 'ඔබට ඇත්තෙන්ම පිටවීමට අවශ්‍යද?',
      cancel: 'අවලංගු කරන්න',
      back: 'ආපසු යන්න',
      themePreview: 'තේමා පෙරදසුන',
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
    biometricEnabled,
    toggleBiometric,
    selectedLanguage,
    setLanguage,
    reminderTime,
    setReminderTime,
    resetSettings,
    handleLogout,
    isDark: darkMode,
    t: translations[selectedLanguage],
    user,
  };
};
