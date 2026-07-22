import { Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import type { LessonId } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { lessonDifficultyLabels, lessonLibraryErrorMessage, skillLabel } from './lessonLibraryPresentation';
import { LessonLibraryError } from './LessonLibraryError';
import type { LessonLibraryService } from './LessonLibraryService';
import type { LessonLibraryItem } from './lessonLibraryTypes';
import { LessonStateBadge } from './LessonStateBadge';

type LessonSummaryScreenViewProps = {
  lessonId: LessonId;
  dogName: string | null;
  service: LessonLibraryService;
  loading: boolean;
  error: unknown | null;
  onRetry: () => void;
  onBack: () => void;
};

export function LessonSummaryScreenView({ lessonId, dogName, service, loading, error, onRetry, onBack }: LessonSummaryScreenViewProps): React.JSX.Element {
  let lesson: LessonLibraryItem | null = null;
  let derivedError = error;
  if (!loading && !derivedError) {
    try {
      lesson = service.getLessonSummary(lessonId);
    } catch (cause) {
      derivedError = cause;
    }
  }

  if (loading) return <AppScreen scroll={false}><LoadingState message="Loading lesson summary…" /></AppScreen>;
  if (derivedError) {
    const invalidLesson = derivedError instanceof LessonLibraryError && derivedError.code === 'LESSON_NOT_FOUND';
    return <AppScreen>
      <SecondaryTextButton title="Back" onPress={onBack} />
      <Text style={styles.eyebrowDark}>LESSON SUMMARY</Text>
      <ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={invalidLesson ? onBack : onRetry} actionTitle={invalidLesson ? 'Back to Lesson Library' : 'Try again'} />
    </AppScreen>;
  }

  if (!lesson) return <AppScreen><ErrorState message="This lesson could not be displayed." onRetry={onBack} actionTitle="Back to Lesson Library" /></AppScreen>;

  return <AppScreen>
    <SecondaryTextButton title="Back" onPress={onBack} />
    <Text style={styles.eyebrowDark}>LESSON SUMMARY</Text>
    <Text style={styles.libraryDogContext}>Lesson access and progress for <Text style={styles.libraryDogName}>{dogName ?? 'your dog'}</Text>.</Text>
    <View style={styles.librarySummaryHero}>
      <View style={styles.libraryLessonTopRow}>
        <Text style={styles.librarySkillLabel}>{skillLabel(lesson.skill)}</Text>
        <LessonStateBadge state={lesson.state} />
      </View>
      <Text style={styles.pageTitle}>{lesson.title}</Text>
      <Text style={styles.body}>{lesson.description}</Text>
      <View style={styles.libraryMetadataRow}>
        <Text style={styles.libraryMetadataText}>{lessonDifficultyLabels[lesson.difficulty]}</Text>
        <Text style={styles.libraryMetadataDot}>•</Text>
        <Text style={styles.libraryMetadataText}>{lesson.estimatedMinutes} minutes</Text>
      </View>
    </View>
    {lesson.state === 'LOCKED' ? <View accessible accessibilityLabel={`Locked. ${lesson.lock.reason}`} style={styles.librarySummaryLockCard}>
      <Text style={styles.libraryLockLabel}>WHY THIS IS LOCKED</Text>
      <Text style={styles.librarySummaryLockReason}>{lesson.lock.reason}</Text>
      {lesson.lock.missingPrerequisiteNames.length > 0 ? <Text style={styles.librarySummarySupportText}>Required first: {lesson.lock.missingPrerequisiteNames.join(', ')}</Text> : null}
    </View> : <View style={styles.librarySummaryNotice}>
      <Text style={styles.librarySummaryNoticeTitle}>Summary only</Text>
      <Text style={styles.librarySummarySupportText}>Full lesson details and training controls are intentionally deferred to Milestone 7.4.</Text>
    </View>}
  </AppScreen>;
}
