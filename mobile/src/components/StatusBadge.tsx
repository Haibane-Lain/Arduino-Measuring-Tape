import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  safe: boolean;
  safeLabel?: string;
  warningLabel?: string;
};

/** Pill badge under the gauge: green when the reading is in range, amber when not. */
export function StatusBadge({
  safe,
  safeLabel = 'Within safe range',
  warningLabel = 'Below alert threshold',
}: Props) {
  const tint = safe ? colors.success : colors.warning;

  return (
    <View style={[styles.badge, { backgroundColor: safe ? colors.successSoft : colors.warningSoft }]}>
      <MaterialCommunityIcons
        name={safe ? 'checkbox-marked-circle' : 'alert-circle'}
        size={14}
        color={tint}
      />
      <Text style={[styles.label, { color: tint }]}>{safe ? safeLabel : warningLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  label: {
    ...typography.meta,
    fontWeight: '600',
  },
});
