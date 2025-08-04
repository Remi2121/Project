// app/_layout.tsx
import { ThemeProvider } from './utilis/themecontext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
