import { useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import type { DeviceInfo } from '@/services/device';
import { useAppState } from '@/state/AppState';
import { colors, radius, spacing, typography } from '@/theme';

function deviceName(device: DeviceInfo): string {
  return device.name?.trim() || 'Unnamed device';
}

function rssiLabel(rssi: number | null): string {
  return typeof rssi === 'number' ? `${rssi} dBm` : 'signal unknown';
}

/**
 * Bottom-sheet style connection UI. It scans when opened, lists nearby
 * DistanceMeter nodes and lets the user connect or disconnect.
 */
export function DeviceModal() {
  const {
    deviceModalOpen,
    closeDeviceModal,
    connection,
    connectionError,
    connectedDevice,
    devices,
    scanning,
    scanDevices,
    stopScan,
    connectDevice,
    disconnectDevice,
  } = useAppState();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!deviceModalOpen) {
      wasOpen.current = false;
      return;
    }

    // Start a scan only when the sheet opens. Connection-state changes while
    // it is open must not restart the scan (and must not loop on timeout).
    if (!wasOpen.current) {
      wasOpen.current = true;
      if (!['connected', 'connecting', 'reconnecting', 'scanning'].includes(connection)) {
        void scanDevices();
      }
    }
  }, [deviceModalOpen, connection, scanDevices]);

  const close = () => {
    closeDeviceModal();
  };

  const connecting = connection === 'connecting' || connection === 'reconnecting';
  const unsupported = connection === 'unavailable';
  const needsSettings = connection === 'bluetooth-off' || connectionError?.includes('permission');

  return (
    <Modal
      visible={deviceModalOpen}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable style={styles.scrim} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Connect device</Text>
              <Text style={styles.subtitle}>
                Power on the tape and press its button.
              </Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close device sheet"
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {connectedDevice ? (
            <View
              style={[
                styles.connectedCard,
                connection === 'reconnecting' && styles.connectedCardWarning,
              ]}
            >
              <View style={styles.connectedIcon}>
                <MaterialCommunityIcons
                  name="bluetooth-connect"
                  size={22}
                  color={connection === 'reconnecting' ? colors.warning : colors.success}
                />
              </View>
              <View style={styles.connectedText}>
                <Text style={styles.connectedName}>{deviceName(connectedDevice)}</Text>
                <Text
                  style={[
                    styles.connectedMeta,
                    connection === 'reconnecting' && styles.connectedMetaWarning,
                  ]}
                >
                  {connection === 'reconnecting'
                    ? 'Reconnecting…'
                    : `Connected · ${rssiLabel(connectedDevice.rssi)}`}
                </Text>
              </View>
            </View>
          ) : null}

          {connectionError ? (
            <View style={styles.errorCard}>
              <MaterialCommunityIcons name="alert-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{connectionError}</Text>
            </View>
          ) : null}

          {connecting && !connectedDevice ? (
            <View style={styles.connectingCard}>
              <ActivityIndicator size="small" color={colors.accentBright} />
              <View style={styles.connectedText}>
                <Text style={styles.connectedName}>
                  {connection === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}
                </Text>
                <Text style={styles.connectingMeta}>Keep the tape powered on and nearby.</Text>
              </View>
            </View>
          ) : null}

          {unsupported && !connectionError ? (
            <Text style={styles.helpText}>
              BLE is a native capability. Use `npx expo run:android` or an EAS development
              build — Expo Go and the browser cannot connect to the tape.
            </Text>
          ) : null}

          {!connectedDevice && !unsupported && !connecting ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby devices</Text>
                {scanning ? (
                  <View style={styles.scanningRow}>
                    <ActivityIndicator size="small" color={colors.accentBright} />
                    <Text style={styles.scanningText}>Scanning</Text>
                  </View>
                ) : null}
              </View>

              <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <MaterialCommunityIcons
                      name="bluetooth"
                      size={28}
                      color={colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>
                      {scanning ? 'Searching for the tape…' : 'No devices found'}
                    </Text>
                    <Text style={styles.emptyText}>
                      {scanning
                        ? 'Keep the tape powered on and nearby.'
                        : 'Make sure the tape is powered on, then scan again.'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <Pressable
                    disabled={connecting}
                    onPress={() => void connectDevice(item)}
                    style={({ pressed }) => [styles.deviceRow, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Connect to ${deviceName(item)}`}
                  >
                    <View style={styles.deviceIcon}>
                      <MaterialCommunityIcons
                        name="ruler"
                        size={20}
                        color={colors.accentBright}
                      />
                    </View>
                    <View style={styles.deviceText}>
                      <Text style={styles.deviceName}>{deviceName(item)}</Text>
                      <Text style={styles.deviceMeta}>{rssiLabel(item.rssi)}</Text>
                    </View>
                    {connecting ? (
                      <ActivityIndicator size="small" color={colors.accentBright} />
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textMuted}
                      />
                    )}
                  </Pressable>
                )}
              />

              <View style={styles.actions}>
                {needsSettings ? (
                  <ActionButton
                    label="Open Android settings"
                    icon="cog-outline"
                    variant="outline"
                    onPress={() => void Linking.openSettings()}
                  />
                ) : null}
                <ActionButton
                  label={scanning ? 'Scanning…' : 'Scan again'}
                  icon="bluetooth"
                  variant="outline"
                  onPress={() => {
                    if (scanning) {
                      void stopScan();
                    } else {
                      void scanDevices();
                    }
                  }}
                />

              </View>
            </>
          ) : null}

          {connectedDevice ? (
            <View style={styles.actions}>
              <ActionButton
                label="Disconnect"
                icon="bluetooth-off"
                variant="outline"
                onPress={() => void disconnectDevice()}
              />
            </View>
          ) : null}

          {connecting && !connectedDevice ? (
            <View style={styles.actions}>
              <ActionButton
                label="Cancel connection"
                icon="close-circle-outline"
                variant="outline"
                onPress={() => void disconnectDevice()}
              />
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  connectedCardWarning: {
    backgroundColor: colors.warningSoft,
  },
  connectedIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedText: {
    flex: 1,
  },
  connectedName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  connectedMeta: {
    ...typography.meta,
    color: colors.success,
    marginTop: 2,
  },
  connectedMetaWarning: {
    color: colors.warning,
  },
  connectingMeta: {
    ...typography.meta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  connectingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  errorText: {
    ...typography.meta,
    color: colors.danger,
    flex: 1,
    lineHeight: 18,
  },
  helpText: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanningText: {
    ...typography.meta,
    color: colors.accentBright,
  },
  list: {
    maxHeight: 290,
  },
  listContent: {
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.meta,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.65,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceText: {
    flex: 1,
  },
  deviceName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  deviceMeta: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
