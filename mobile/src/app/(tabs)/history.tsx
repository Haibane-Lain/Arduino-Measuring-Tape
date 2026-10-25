import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { HistoryRow } from '@/components/HistoryRow';
import { Divider } from '@/components/SectionCard';
import { useAppState } from '@/state/AppState';
import { colors, spacing, typography } from '@/theme';

/** Second tab: the recorded measurement log, newest first. */
export default function HistoryScreen() {
  const { measurements, settings, connection, openDeviceModal } = useAppState();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader
        icon="history"
        title="Measurement History"
        status={connection}
        onPressStatus={openDeviceModal}
      />

      <FlatList
        data={measurements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryRow measurement={item} unit={settings.units} />}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {connection === 'connected'
                ? 'No measurements yet. Press the button on the tape to record one.'
                : 'No measurements yet. Connect the tape, then press its button to record a reading.'}
            </Text>
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
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  connect: {
    alignSelf: 'stretch',
  },
});
