import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type SectionCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Rounded surface container used to group settings rows. */
export function SectionCard({ children, style }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Hairline separator between rows inside a card. */
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
