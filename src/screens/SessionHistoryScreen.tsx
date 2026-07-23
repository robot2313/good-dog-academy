import { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryTextButton } from '../components/SecondaryTextButton';
import { TrainingHistoryError } from '../features/progress/history/TrainingHistoryError';
import { TrainingSessionCard } from '../features/progress/history/TrainingSessionCard';
import type { TrainingHistoryEntry } from '../features/progress/history/TrainingHistoryTypes';
import { useTrainingHistory } from '../features/progress/history/useTrainingHistory';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionHistory'>;

export function SessionHistoryScreen({ navigation }: Props): React.JSX.Element {
  const {
    page,
    loading,
    loadingMore,
    error,
    selectedDogName,
    retry,
    loadMore,
  } = useTrainingHistory();
  const openSession = useCallback((sessionId: string) => {
    navigation.navigate('SessionDetail', { sessionId });
  }, [navigation]);
  const renderSession = useCallback(({ item }: { item: TrainingHistoryEntry }) => (
    <View style={styles.historyCardSpacing}>
      <TrainingSessionCard
        entry={item}
        onPress={() => openSession(item.sessionId)}
      />
    </View>
  ), [openSession]);

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.historyStateScreen}>
          <SecondaryTextButton title="Back to Progress" onPress={navigation.goBack} />
          <LoadingState message="Loading training history…" />
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.historyStateScreen}>
          <SecondaryTextButton title="Back to Progress" onPress={navigation.goBack} />
          <ErrorState message={historyErrorMessage(error)} onRetry={retry} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <FlatList
        data={page?.entries ?? []}
        keyExtractor={(entry) => entry.sessionId}
        renderItem={renderSession}
        contentContainerStyle={styles.historyListContent}
        ListHeaderComponent={(
          <View style={styles.historyHeader}>
            <SecondaryTextButton title="Back to Progress" onPress={navigation.goBack} />
            <Text style={styles.eyebrowDark}>TRAINING JOURNAL</Text>
            <Text accessibilityRole="header" style={styles.pageTitle}>Training history</Text>
            <Text style={styles.historyDogContext}>
              {selectedDogName
                ? `${selectedDogName}'s completed guided sessions, newest first.`
                : 'Completed guided sessions, newest first.'}
            </Text>
          </View>
        )}
        ListEmptyComponent={(
          <View accessible style={styles.historyEmptyCard}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>No sessions yet</Text>
            <Text style={styles.body}>
              Complete a guided lesson and it will appear here.
            </Text>
          </View>
        )}
        ListFooterComponent={page?.hasMore ? (
          <View style={styles.historyListFooter}>
            <PrimaryButton
              title={loadingMore ? 'Loading more…' : 'Load more sessions'}
              accessibilityLabel="Load more training sessions"
              disabled={loadingMore}
              onPress={() => { void loadMore(); }}
            />
          </View>
        ) : null}
      />
    </AppScreen>
  );
}

function historyErrorMessage(error: TrainingHistoryError): string {
  if (error.code === 'CORRUPT_STORED_DATA') {
    return 'Training history could not be read safely. Your existing sessions were not changed.';
  }
  if (
    error.code === 'DOG_NOT_FOUND'
    || error.code === 'OWNER_NOT_FOUND'
    || error.code === 'DOG_OWNERSHIP_MISMATCH'
  ) {
    return 'Training history is not available for the selected dog.';
  }
  return 'Training history could not be loaded. Please try again.';
}
