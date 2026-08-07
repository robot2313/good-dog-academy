import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { IdentityHeader } from '../components/IdentityHeader';
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
import { referenceScreenStyles, referenceStyles } from '../theme/referenceStyles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export function SessionDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { entry, loading, error, retry } = useTrainingHistory(route.params.sessionId);

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 8, gap: 14 }}>
          <SecondaryTextButton title="Back to history" onPress={navigation.goBack} />
          <LoadingState message="Loading session details…" />
        </View>
      </AppScreen>
    );
  }

  if (error || !entry) {
    return (
      <AppScreen scroll={false}>
        <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 8, gap: 14 }}>
          <SecondaryTextButton title="Back to history" onPress={navigation.goBack} />
          <ErrorState message={detailErrorMessage(error)} onRetry={retry} />
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
      <IdentityHeader />
      <SecondaryTextButton title="Back to history" onPress={navigation.goBack} />

      <View style={referenceScreenStyles.pageHeader}>
        <Text style={referenceStyles.cardKicker}>SESSION DETAIL</Text>
        <Text accessibilityRole="header" style={referenceScreenStyles.pageTitle}>{entry.lessonTitle}</Text>
      </View>

      {!entry.lessonAvailable ? (
        <View accessible accessibilityRole="alert" style={referenceScreenStyles.noticeWarn}>
          <Text style={referenceScreenStyles.noticeWarnTitle}>Unknown lesson</Text>
          <Text style={referenceScreenStyles.noticeWarnBody}>
            This saved session belongs to a lesson that is no longer in the current catalogue.
          </Text>
        </View>
      ) : null}

      <View style={referenceScreenStyles.card}>
        <Text accessibilityRole="header" style={referenceScreenStyles.blockTitle}>Session summary</Text>
        {detailRow('Skill', skillLabel)}
        {detailRow('Completed', formatHistoryLocalDate(entry.localDate))}
        {detailRow('Duration', `${entry.durationMinutes} min`)}
        {detailRow('Outcome', outcomeLabel)}
        {detailRow('Rating range', ratingLabel, true)}
      </View>

      <View style={referenceScreenStyles.card}>
        <Text accessibilityRole="header" style={referenceScreenStyles.blockTitle}>Session notes</Text>
        <Text style={referenceScreenStyles.blockIntro}>
          {notes || 'No notes were recorded for this session.'}
        </Text>
      </View>
    </AppScreen>
  );
}

function detailRow(label: string, value: string, last = false): React.JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[referenceScreenStyles.dataRow, last && referenceScreenStyles.dataRowLast]}
    >
      <Text style={referenceScreenStyles.dataLabel}>{label}</Text>
      <Text style={referenceScreenStyles.dataValue}>{value}</Text>
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
