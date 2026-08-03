import { Image, Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LessonActionBar } from '../../../components/LessonActionBar';
import { LessonScaffold } from '../../../components/LessonScaffold';
import { LoadingState } from '../../../components/LoadingState';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import type { LessonDefinition, LessonId } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { lessonIllustrationForSkill } from '../coaching/LessonIllustration';
import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { lessonDifficultyLabels, lessonLibraryErrorMessage, skillLabel } from './lessonLibraryPresentation';
import { LessonLibraryError } from './LessonLibraryError';
import type { LessonLibraryService } from './LessonLibraryService';
import type { LessonLibraryItem } from './lessonLibraryTypes';
import { LessonStateBadge } from './LessonStateBadge';

type LessonSummaryScreenViewProps = {
  lessonId: LessonId;
  lessonDefinition: LessonDefinition | null;
  dogName: string | null;
  service: LessonLibraryService;
  loading: boolean;
  error: unknown | null;
  onRetry: () => void;
  onBack: () => void;
  onStart: () => void;
};

const fallbackEquipment = Object.freeze(['Small rewards your dog enjoys']);

export function LessonSummaryScreenView({ lessonId, lessonDefinition, dogName, service, loading, error, onRetry, onBack, onStart }: LessonSummaryScreenViewProps): React.JSX.Element {
  let lesson: LessonLibraryItem | null = null;
  let derivedError = error;
  if (!loading && !derivedError) {
    try {
      lesson = service.getLessonSummary(lessonId);
    } catch (cause) {
      derivedError = cause;
    }
  }

  if (loading) return <AppScreen scroll={false}><LoadingState message="Loading lesson…" /></AppScreen>;
  if (derivedError) {
    const invalidLesson = derivedError instanceof LessonLibraryError && derivedError.code === 'LESSON_NOT_FOUND';
    return <AppScreen>
      <Text style={styles.eyebrowDark}>GET READY</Text>
      <ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={invalidLesson ? onBack : onRetry} actionTitle={invalidLesson ? 'Back to Lesson Library' : 'Try again'} />
      <SecondaryTextButton title="Back" onPress={onBack} />
    </AppScreen>;
  }

  if (!lesson) return <AppScreen><ErrorState message="This lesson could not be displayed." onRetry={onBack} actionTitle="Back to Lesson Library" /></AppScreen>;

  const definitionMatches = lessonDefinition?.id === lesson.id;
  const equipment = lessonDefinition && lessonDefinition.equipment.length > 0
    ? lessonDefinition.equipment
    : fallbackEquipment;
  const illustrationLabel = lessonDefinition
    ? lessonIllustrationForSkill(lessonDefinition.skill).accessibilityLabel
    : undefined;
  const canStart = lesson.state !== 'LOCKED' && definitionMatches;

  return <LessonScaffold
    footer={<LessonActionBar
      back={{ label: 'Back', onPress: onBack }}
      forward={canStart ? { label: 'Next', onPress: onStart } : undefined}
    />}
  >
    <Text style={styles.eyebrowDark}>GET READY</Text>

    <View style={styles.libraryLessonTopRow}>
      <Text style={styles.librarySkillLabel}>{skillLabel(lesson.skill)}</Text>
      <LessonStateBadge state={lesson.state} />
    </View>
    <Text accessibilityRole="header" style={styles.pageTitle}>{lesson.title}</Text>
    {lessonDefinition ? <Text style={styles.body}>{lessonDefinition.goal}</Text> : <Text style={styles.body}>{lesson.description}</Text>}
    <View style={styles.libraryMetadataRow}>
      <Text style={styles.libraryMetadataText}>{lessonDifficultyLabels[lesson.difficulty]}</Text>
      <Text style={styles.libraryMetadataDot}>•</Text>
      <Text style={styles.libraryMetadataText}>{lesson.estimatedMinutes} minutes</Text>
    </View>

    {definitionMatches && illustrationLabel ? (
      <View style={[styles.lessonIllustrationCard, styles.getReadyImageCard]}>
        <View style={styles.lessonIllustrationFrame}>
          <Image
            accessible
            accessibilityLabel={illustrationLabel}
            accessibilityRole="image"
            resizeMode="contain"
            source={getLessonImageSource(lesson.id, lessonDefinition?.skill ?? null)}
            style={styles.lessonIllustration}
          />
        </View>
      </View>
    ) : null}

    {lesson.state === 'LOCKED' ? (
      <View accessible accessibilityLabel={`Locked. ${lesson.lock.reason}`} style={styles.librarySummaryLockCard}>
        <Text style={styles.libraryLockLabel}>WHY THIS IS LOCKED</Text>
        <Text style={styles.librarySummaryLockReason}>{lesson.lock.reason}</Text>
        {lesson.lock.missingPrerequisiteNames.length > 0 ? <Text style={styles.librarySummarySupportText}>Required first: {lesson.lock.missingPrerequisiteNames.join(', ')}</Text> : null}
      </View>
    ) : (
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Before we start</Text>
        <Text style={styles.body}>Have everything within reach and choose a calm, safe place to practise.</Text>
        <View style={styles.coachingListCard}>
          {equipment.map((item, index) => (
            <View key={`${lesson.id}-equipment-${index}`} style={styles.coachingListRow}>
              <Text accessible={false} style={styles.coachingBullet}>✓</Text>
              <Text style={styles.coachingListText}>{item}</Text>
            </View>
          ))}
          <View style={styles.coachingListRow}>
            <Text accessible={false} style={styles.coachingBullet}>✓</Text>
            <Text style={styles.coachingListText}>About {lesson.estimatedMinutes} minutes of relaxed practice time</Text>
          </View>
        </View>
      </View>
    )}
  </LessonScaffold>;
}
