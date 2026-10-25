import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DeviceModal } from '@/components/DeviceModal';
import { AppStateProvider } from '@/state/AppState';
import { colors } from '@/theme';

/**
 * Root layout: safe-area provider, BLE/persisted app state, status bar and the
 * global device-connection sheet around a headerless stack.
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
        <DeviceModal />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
