import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { Divider, SectionCard } from '@/components/SectionCard';
import { SelectRow } from '@/components/SelectRow';
import { ThresholdRow } from '@/components/ThresholdRow';
import { ALERT_SOUNDS, DISTANCE_UNITS } from '@/services/device';
import { useAppState } from '@/state/AppState';
import { colors, spacing } from '@/theme';

/** Third tab: units, alert rules and history management. */
export default function SettingsScreen() {
  const { settings, updateSettings, clearHistory, connection } = useAppState();

  const confirmClear = () => {
    Alert.alert('Clear history', 'Remove every stored measurement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  const save = () => {
    Alert.alert('Settings saved', 'Your preferences have been stored on this device.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader
        icon="cog"
        title="Settings"
        connected={connection === 'connected'}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard>
          <SelectRow
            label="Units"
            value={settings.units}
            options={DISTANCE_UNITS}
            onChange={(units) => updateSettings({ units })}
          />
          <Divider />
          <ThresholdRow
            value={settings.alertThresholdCm}
            onChange={(alertThresholdCm) => updateSettings({ alertThresholdCm })}
          />
          <Divider />
          <SelectRow
            label="Alert sound"
            value={settings.alertSound}
            options={ALERT_SOUNDS}
            onChange={(alertSound) => updateSettings({ alertSound })}
          />
        </SectionCard>

        <View style={styles.actions}>
          <ActionButton
            label="Clear History"
            icon="delete-outline"
            variant="outline"
            onPress={confirmClear}
          />
          <ActionButton
            label="Save Settings"
            icon="content-save-outline"
            variant="solid"
            onPress={save}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
});
