import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '@/state/AppState';
import { colors } from '@/theme';

/**
 * Root layout: wires the safe-area provider, the (mock) app state and the
 * status bar around a headerless stack that hosts the tab navigator.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
