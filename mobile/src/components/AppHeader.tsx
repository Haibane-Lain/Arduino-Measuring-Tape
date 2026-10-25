import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/iconName';
import type { ConnectionState } from '@/services/device';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  icon: IconName;
  title: string;
  status: ConnectionState;
  onPressStatus?: () => void;
};

const STATUS: Record<ConnectionState, { label: string; color: string }> = {
  connected: { label: 'Connected', color: colors.success },
  connecting: { label: 'Connecting', color: colors.warning },
  reconnecting: { label: 'Reconnecting', color: colors.warning },
  scanning: { label: 'Scanning', color: colors.warning },
  disconnected: { label: 'Offline', color: colors.danger },
  'bluetooth-off': { label: 'Bluetooth off', color: colors.danger },
  unavailable: { label: 'Unavailable', color: colors.textMuted },
};

/**
 * Top app bar: leading section icon + title on the left, live link status on
 * the right. Pressing the status opens the device connection sheet.
 */
export function AppHeader({ icon, title, status, onPressStatus }: Props) {
  const meta = STATUS[status];

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.accentBright} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <Pressable
        onPress={onPressStatus}
        disabled={!onPressStatus}
        accessibilityRole={onPressStatus ? 'button' : undefined}
        accessibilityLabel={`Bluetooth status: ${meta.label}`}
        style={({ pressed }) => [styles.status, pressed && styles.pressed]}
      >
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        <Text style={styles.statusText} numberOfLines={1}>
          {meta.label}
        </Text>
        {onPressStatus ? (
          <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
        ) : null}
      </Pressable>
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
    flexShrink: 1,
  },
  title: {
    ...typography.headerTitle,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    maxWidth: '55%',
  },
  pressed: {
    opacity: 0.65,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  statusText: {
    ...typography.meta,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
