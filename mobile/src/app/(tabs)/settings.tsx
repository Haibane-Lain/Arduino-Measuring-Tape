import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { Divider, SectionCard } from '@/components/SectionCard';
import { SelectRow } from '@/components/SelectRow';
import { ThresholdRow } from '@/components/ThresholdRow';
import { ALERT_SOUNDS, DISTANCE_UNITS } from '@/services/device';
import { useAppState } from '@/state/AppState';
import { colors, spacing, typography } from '@/theme';

/** Third tab: device connection, units, alert rules and history management. */
export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    clearHistory,
    connection,
    connectionError,
    connectedDevice,
    openDeviceModal,
    disconnectDevice,
  } = useAppState();

  const confirmClear = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Remove every stored measurement?')) {
        clearHistory();
      }
      return;
    }

    Alert.alert('Clear history', 'Remove every stored measurement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  const connectionLabel =
    connection === 'connected'
      ? 'Connected'
      : connection === 'scanning'
        ? 'Scanning'
        : connection === 'connecting'
          ? 'Connecting'
          : connection === 'reconnecting'
            ? 'Reconnecting'
            : connection === 'bluetooth-off'
              ? 'Bluetooth off'
              : connection === 'unavailable'
                ? 'Unavailable'
                : 'Offline';

  const connectionColor =
    connection === 'connected'
      ? colors.success
      : connection === 'connecting' || connection === 'reconnecting' || connection === 'scanning'
        ? colors.warning
        : connection === 'unavailable'
          ? colors.textMuted
          : colors.danger;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader
        icon="cog"
        title="Settings"
        status={connection}
        onPressStatus={openDeviceModal}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard>
          <View style={styles.deviceHeader}>
            <View>
              <Text style={styles.label}>Device</Text>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: connectionColor }]} />
                <Text style={[styles.statusText, { color: connectionColor }]}>
                  {connectionLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.deviceName} numberOfLines={1}>
              {connectedDevice?.name ?? 'No device selected'}
            </Text>
          </View>

          {connectionError ? (
            <Text style={styles.error} numberOfLines={3}>
              {connectionError}
            </Text>
          ) : null}

          <View style={styles.deviceAction}>
            <ActionButton
              label={connection === 'connected' ? 'Disconnect' : 'Scan for devices'}
              icon={connection === 'connected' ? 'bluetooth-off' : 'bluetooth'}
              variant="outline"
              onPress={() => {
                if (connection === 'connected') {
                  void disconnectDevice();
                } else {
                  openDeviceModal();
                }
              }}
            />
          </View>
        </SectionCard>

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

        <Text style={styles.savedHint}>Changes are saved automatically.</Text>

        <View style={styles.actions}>
          <ActionButton
            label="Clear History"
            icon="delete-outline"
            variant="outline"
            onPress={confirmClear}
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
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    ...typography.meta,
    fontWeight: '600',
  },
  deviceName: {
    ...typography.meta,
    color: colors.textMuted,
    maxWidth: 160,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  error: {
    ...typography.meta,
    color: colors.danger,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  deviceAction: {
    paddingVertical: spacing.lg,
  },
  savedHint: {
    ...typography.meta,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
});
