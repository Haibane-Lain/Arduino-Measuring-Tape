import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { DistanceGauge } from '@/components/DistanceGauge';
import { StatusBadge } from '@/components/StatusBadge';
import { MAX_RANGE_CM } from '@/config';
import { useAppState } from '@/state/AppState';
import { colors, spacing, typography } from '@/theme';
import { formatClock } from '@/utils/time';
import { toDisplayDistance } from '@/utils/units';

/** Main screen: the live distance, its gauge and the range status. */
export default function DistanceScreen() {
  const { current, settings, connection } = useAppState();

  const valueCm = current?.valueCm ?? 0;
  const { text, suffix } = toDisplayDistance(valueCm, settings.units);
  const withinRange = valueCm >= settings.alertThresholdCm;
  const updatedAt = current ? formatClock(current.timestamp) : '--:--:--';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader
        icon="bluetooth"
        title="Distance"
        connected={connection === 'connected'}
      />

      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{text}</Text>
          <Text style={styles.unit}>{suffix}</Text>
        </View>
        <Text style={styles.caption}>CURRENT DISTANCE</Text>

        <View style={styles.gauge}>
          <DistanceGauge value={valueCm} max={MAX_RANGE_CM} />
        </View>

        <StatusBadge safe={withinRange} />
        <Text style={styles.updated}>Last updated: {updatedAt}</Text>
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
    textTransform: 'uppercase',
  },
  gauge: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  updated: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
