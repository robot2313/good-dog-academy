import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { SecondaryTextButton } from '../components/SecondaryTextButton';
import {
  formatHistoryLocalDate,
  formatHistorySkill,
  formatRatingBand,
  historyOutcomeLabel,
} from '../features/progress/history/TrainingSessionCard';
import { TrainingHistoryError } from '../features/progress/history/TrainingHistoryError';
import { useTrainingHistory } from '../features/progress/history/useTrainingHistory';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export function SessionDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { entry, loading, error, retry } = useTrainingHistory(
    route.params.sessionId,
  );

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.historyStateScreen}>
          <SecondaryTextButton title="Back to history" onPress={navigation.goBack} />
          <LoadingState message="Loading session details…" />
        </View>
      </AppScreen>
    );
  }

  if (error || !entry) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.historyStateScreen}>
          <SecondaryTextButton title="Back to history" onPress={navigation.goBack} />
          <ErrorState
            message={detailErrorMessage(error)}
            onRetry={retry}
          />
        </View>
      </AppScreen>
    );
  }

  const skillLabel = formatHistorySkill(entry.skill);
  const outcomeLabel = historyOutcomeLabel(entry.outcome);
  const ratingLabel = formatRatingBand(entry.ratingBand);
  const notes = entry.notes.trim();

  return (
    <AppScreen>
      <SecondaryTextButton title="Back to history" onPress={navigation.goBack} />
      <Text style={styles.eyebrowDark}>SESSION DETAIL</Text>
      <Text accessibilityRole="header" style={styles.pageTitle}>{entry.lessonTitle}</Text>
      {!entry.lessonAvailable ? (
        <View accessible accessibilityRole="alert" style={styles.historyMissingLessonNotice}>
          <Text style={styles.historyMissingLessonTitle}>Unknown lesson</Text>
          <Text style={styles.historyDetailSupportingText}>
            This saved session belongs to a lesson that is no longer in the current catalogue.
          </Text>
        </View>
      ) : null}
      <View style={styles.historyDetailCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Session summary</Text>
        {detailRow('Skill', skillLabel)}
        {detailRow('Completed', formatHistoryLocalDate(entry.localDate))}
        {detailRow('Duration', `${entry.durationMinutes} min`)}
        {detailRow('Outcome', outcomeLabel)}
        {detailRow('Rating range', ratingLabel)}
      </View>
      <View style={styles.historyDetailCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Session notes</Text>
        <Text style={notes ? styles.body : styles.historyDetailSupportingText}>
          {notes || 'No notes were recorded for this session.'}
        </Text>
      </View>
    </AppScreen>
  );
}

function detailRow(label: string, value: string): React.JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={styles.historyDetailRow}
    >
      <Text style={styles.historyDetailLabel}>{label}</Text>
      <Text style={styles.historyDetailValue}>{value}</Text>
    </View>
  );
}

function detailErrorMessage(error: TrainingHistoryError | null): string {
  if (error?.code === 'SESSION_NOT_FOUND') {
    return 'This session is not available for the selected dog.';
  }
  if (error?.code === 'CORRUPT_STORED_DATA') {
    return 'This session could not be read safely. Your saved history was not changed.';
  }
  return 'Session details could not be loaded. Please try again.';
}
