import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { DistanceGauge } from '@/components/DistanceGauge';
import { StatusBadge, type StatusTone } from '@/components/StatusBadge';
import { MAX_RANGE_CM } from '@/config';
import { useAppState } from '@/state/AppState';
import { colors, spacing, typography } from '@/theme';
import { formatClock } from '@/utils/time';
import { toDisplayDistance, UNIT_SUFFIX } from '@/utils/units';

/** Main screen: the most recent measurement, its gauge and the link status. */
export default function DistanceScreen() {
  const {
    current,
    readingState,
    settings,
    connection,
    connectedDevice,
    openDeviceModal,
  } = useAppState();

  const display = current
    ? toDisplayDistance(current.valueCm, settings.units)
    : { text: '--', suffix: UNIT_SUFFIX[settings.units] };
  const maxDisplay = toDisplayDistance(MAX_RANGE_CM, settings.units);
  const updatedAt = current ? formatClock(current.timestamp) : null;

  let caption = 'PRESS THE BUTTON ON THE TAPE';
  let tone: StatusTone = 'neutral';
  let badgeLabel = 'Waiting for measurement';
  let badgeIcon: 'progress-clock' | 'alert-circle' | 'checkbox-marked-circle' | undefined;

  if (readingState === 'no-echo') {
    caption = 'NO ECHO — AIM AT A SURFACE';
    tone = 'warning';
    badgeLabel = 'No echo';
    badgeIcon = 'alert-circle';
  } else if (current) {
    caption = 'LAST MEASUREMENT';
    const withinRange = current.valueCm >= settings.alertThresholdCm;
    tone = withinRange ? 'success' : 'warning';
    badgeLabel = withinRange ? 'Within safe range' : 'Below alert threshold';
    badgeIcon = withinRange ? 'checkbox-marked-circle' : 'alert-circle';
  } else if (connection !== 'connected') {
    caption = 'CONNECT THE TAPE TO START';
    badgeLabel = 'No device connected';
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader
        icon="bluetooth"
        title="Distance"
        status={connection}
        onPressStatus={openDeviceModal}
      />

      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{display.text}</Text>
          <Text style={styles.unit}>{display.suffix}</Text>
        </View>
        <Text style={styles.caption}>{caption}</Text>

        <View style={styles.gauge}>
          <DistanceGauge value={current?.valueCm ?? 0} max={MAX_RANGE_CM} />
          <View style={styles.gaugeLabels}>
            <Text style={styles.gaugeLabel}>0</Text>
            <Text style={styles.gaugeLabel}>
              {maxDisplay.text} {maxDisplay.suffix}
            </Text>
          </View>
        </View>

        <StatusBadge tone={tone} label={badgeLabel} icon={badgeIcon} />

        {updatedAt ? <Text style={styles.updated}>Last updated: {updatedAt}</Text> : null}
        {connectedDevice ? (
          <Text style={styles.deviceName}>{connectedDevice.name ?? 'DistanceMeter'}</Text>
        ) : null}

        {connection !== 'connected' ? (
          <View style={styles.connect}>
            <ActionButton
              label="Connect device"
              icon="bluetooth-connect"
              variant="outline"
              onPress={openDeviceModal}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  value: {
    ...typography.value,
    color: colors.accentText,
    lineHeight: typography.value.fontSize * 1.05,
  },
  unit: {
    ...typography.valueUnit,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  gauge: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  gaugeLabels: {
    width: 240,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  gaugeLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  updated: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  deviceName: {
    ...typography.meta,
    color: colors.textMuted,
  },
  connect: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
