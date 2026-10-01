import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/iconName';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  icon: IconName;
  title: string;
  connected?: boolean;
};

/**
 * Top app bar: leading section icon + title on the left, link status on the
 * right. Shared by all three screens so the chrome stays identical.
 */
export function AppHeader({ icon, title, connected = true }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.accentBright} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.status}>
        <View style={[styles.dot, connected ? styles.dotOnline : styles.dotOffline]} />
        <Text style={styles.statusText}>{connected ? 'Connected' : 'Offline'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.headerTitle,
    color: colors.textPrimary,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  dotOnline: {
    backgroundColor: colors.success,
  },
  dotOffline: {
    backgroundColor: colors.danger,
  },
  statusText: {
    ...typography.meta,
    color: colors.textSecondary,
  },
});
