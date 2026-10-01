import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
  swatchColor?: string;
};

/** Settings row for the alert distance, with a colour swatch and `cm` suffix. */
export function ThresholdRow({ value, onChange, swatchColor = colors.textPrimary }: Props) {
  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 3);
    onChange(digits.length === 0 ? 0 : Number(digits));
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Alert threshold</Text>

      <View style={styles.valueWrap}>
        <TextInput
          style={styles.input}
          value={String(value)}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={3}
          selectionColor={colors.accentBright}
          accessibilityLabel="Alert threshold in centimetres"
        />
        <View style={[styles.swatch, { backgroundColor: swatchColor }]} />
        <Text style={styles.unit}>cm</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    ...typography.label,
    color: colors.textPrimary,
    minWidth: 32,
    paddingVertical: spacing.xs,
    textAlign: 'right',
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: radius.sm / 2,
  },
  unit: {
    ...typography.meta,
    color: colors.textSecondary,
  },
});
