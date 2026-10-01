import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { DistanceUnit, Measurement } from '@/services/device';
import { colors, gradients, spacing, typography } from '@/theme';
import { formatHistoryStamp } from '@/utils/time';
import { toDisplayDistance } from '@/utils/units';

type Props = {
  measurement: Measurement;
  /** Unit the value should be rendered in. */
  unit: DistanceUnit;
};

/** One row in the measurement history list. */
export function HistoryRow({ measurement, unit }: Props) {
  const { text, suffix } = toDisplayDistance(measurement.valueCm, unit);

  return (
    <View style={styles.row}>
      <Svg width={4} height={30}>
        <Defs>
          <LinearGradient id="historyBar" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradients.historyBar[0]} />
            <Stop offset="1" stopColor={gradients.historyBar[1]} />
          </LinearGradient>
        </Defs>
        <Rect width={4} height={30} rx={2} fill="url(#historyBar)" />
      </Svg>

      <Text style={styles.value}>
        {text} <Text style={styles.unit}>{suffix}</Text>
      </Text>

      <Text style={styles.time}>{formatHistoryStamp(measurement.timestamp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  value: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  unit: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  time: {
    ...typography.meta,
    color: colors.textMuted,
  },
});
