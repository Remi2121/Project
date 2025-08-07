// app/_layout.tsx
import { Slot } from 'expo-router';
import { ThemeProvider } from './utilis/themecontext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
