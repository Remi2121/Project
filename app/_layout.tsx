// app/_layout.tsx
import * as WebBrowser from 'expo-web-browser';
WebBrowser.maybeCompleteAuthSession();

import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './utilis/themecontext';
// 🔥 settings context
import { SettingsProvider } from './utilis/Settings';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Global settings (dark mode, language, etc.) */}
      <SettingsProvider>
        {/* Old ThemeProvider – still kept, if you use useThemeContext anywhere */}
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
