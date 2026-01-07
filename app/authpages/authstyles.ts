import { StyleSheet } from 'react-native';

export const getAuthStyles = (isDark: boolean) =>
  StyleSheet.create({
    /* ================= CONTAINER ================= */
    container: {
      flex: 1,
      paddingHorizontal: 24,
      backgroundColor: isDark ? '#0b0b0b' : '#f6f7fb',
      justifyContent: 'center',
      alignItems: 'center',
    },

    orWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 22,
  width: '100%',
},

line: {
  flex: 1,
  height: 1,
  backgroundColor: '#d1d5db',
},

orText: {
  marginHorizontal: 10,
  color: '#6b7280',
  fontSize: 13,
},

socialWrapper: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 18,
  marginBottom: 10,
},

socialButton: {
  width: 54,
  height: 54,
  borderRadius: 14,
  backgroundColor: '#ffffff',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
},


    /* ================= HEADER ICON ================= */
    iconWrapper: {
      marginTop: 80,
      marginBottom: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    lockIcon: {
      fontSize: 34,
      backgroundColor: isDark ? '#1e1e1e' : '#e9ecf3',
      padding: 18,
      borderRadius: 50,
      overflow: 'hidden',
    },

    /* ================= TITLES ================= */
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#0f172a',
      marginBottom: 6,
      textAlign: 'center',
    },

    subtitle: {
      fontSize: 14,
      color: isDark ? '#b5b5b5' : '#6b7280',
      marginBottom: 30,
      textAlign: 'center',
    },

    /* ================= INPUTS ================= */
    inputWrapper: {
      width: '100%',
      marginBottom: 14,
    },

    inputModern: {
      backgroundColor: isDark ? '#1a1a1a' : '#eef1f7',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 16,
      fontSize: 16,
      color: isDark ? '#ffffff' : '#111827',
    },

    /* ================= FORGOT PASSWORD ================= */
    forgotWrapper: {
      width: '100%',
      alignItems: 'flex-end',
      marginBottom: 24,
    },

    forgotText: {
      fontSize: 13,
      color: isDark ? '#9ca3af' : '#6b7280',
    },

    /* ================= PRIMARY BUTTON ================= */
    primaryButton: {
      width: '100%',
      backgroundColor: '#0f172a',
      paddingVertical: 16,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },

    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    /* ================= BOTTOM TEXT ================= */
    bottomTextWrapper: {
      flexDirection: 'row',
      marginTop: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },

    bottomText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },

    registerText: {
      fontSize: 14,
      color: '#2563eb',
      fontWeight: '600',
    },

    /* ================= BACK ARROW (optional) ================= */
    backArrow: {
      fontSize: 22,
      color: isDark ? '#ffffff' : '#0f172a',
    },

    /* ================= LEGACY SUPPORT (SAFE KEEP) ================= */
    button: {
      backgroundColor: '#0f172a',
      paddingVertical: 15,
      borderRadius: 16,
      alignItems: 'center',
      width: '100%',
      marginTop: 10,
    },

    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },

    linkText: {
      color: '#2563eb',
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
  });
