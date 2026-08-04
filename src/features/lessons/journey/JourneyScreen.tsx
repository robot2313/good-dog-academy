import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { styles } from '../../../theme/styles';
import { colorTokens } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../types/navigation';
import { useLessonLibraryData } from '../library/LessonLibraryContext';
import { lessonLibraryErrorMessage, skillLabel } from '../library/lessonLibraryPresentation';
import { LessonLibraryService } from '../library/LessonLibraryService';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';

type Props = CompositeScreenProps<
  NativeStackScreenProps<RootStackParamList, 'Journey'>,
  NativeStackScreenProps<RootStackParamList>
>;

type JourneyMarker = 'completed' | 'current' | 'upcoming';

export function JourneyScreen({ navigation }: Props): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords, loading, error, retry } = useLessonLibraryData();
  const selectedDogId = selectedDog?.id ?? null;
  const service = useMemo(
    () => new LessonLibraryService(catalogue, selectedDogId, progressRecords),
    [catalogue, progressRecords, selectedDogId],
  );

  let lessons: readonly LessonLibraryItem[] | null = null;
  let derivedError: unknown | null = error;
  if (!loading && !derivedError) {
    try {
      lessons = service.getAllLessons();
    } catch (cause) {
      derivedError = cause;
    }
  }

  if (loading) return <AppScreen scroll={false}><LoadingState message="Building your training journey…" /></AppScreen>;
  if (derivedError || !lessons) {
    return <AppScreen>
      <SecondaryTextButton title="Back" onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrowDark}>YOUR JOURNEY</Text>
      <ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={retry} />
    </AppScreen>;
  }

  const completedCount = lessons.filter((lesson) => lesson.state === 'COMPLETED').length;
  const currentId = lessons.find(
    (lesson) => lesson.state === 'IN_PROGRESS' || lesson.state === 'AVAILABLE',
  )?.id ?? null;
  const groups = service.getGroupedLessons(lessons);

  const markerFor = (lesson: LessonLibraryItem): JourneyMarker => {
    if (lesson.state === 'COMPLETED') return 'completed';
    if (lesson.id === currentId) return 'current';
    return 'upcoming';
  };

  return <AppScreen>
    <SecondaryTextButton title="Back" onPress={() => navigation.goBack()} />
    <Text style={styles.eyebrowDark}>YOUR JOURNEY</Text>
    <Text accessibilityRole="header" style={styles.pageTitle}>Your journey so far</Text>
    <Text style={styles.journeyProgressText}>
      {completedCount} of {lessons.length} lessons complete
    </Text>
    <Text style={styles.journeyIntro}>
      Follow the path from where you started. Tap any lesson to open it.
    </Text>

    {groups.map((group) => (
      <View key={group.skill} style={styles.journeyGroup}>
        <Text accessibilityRole="header" style={styles.journeyGroupTitle}>{skillLabel(group.skill)}</Text>
        {group.lessons.map((lesson, index) => {
          const marker = markerFor(lesson);
          const isLast = index === group.lessons.length - 1;
          const stateLabel = lesson.state === 'COMPLETED'
            ? 'Complete'
            : lesson.state === 'LOCKED'
              ? 'Upcoming'
              : marker === 'current'
                ? 'Next up'
                : 'Available';
          const stateColor = lesson.state === 'COMPLETED'
            ? colorTokens.brand.primary
            : marker === 'current'
              ? colorTokens.text.primary
              : colorTokens.text.disabled;
          return (
            <View key={lesson.id} style={styles.journeyNode}>
              <View style={styles.journeyRail}>
                <View style={[
                  styles.journeyMarker,
                  marker === 'completed' && styles.journeyMarkerCompleted,
                  marker === 'current' && styles.journeyMarkerCurrent,
                  marker === 'upcoming' && styles.journeyMarkerUpcoming,
                ]}>
                  <Text accessible={false} style={[
                    styles.journeyMarkerText,
                    marker === 'completed' && styles.journeyMarkerTextCompleted,
                    marker === 'current' && styles.journeyMarkerTextCurrent,
                    marker === 'upcoming' && styles.journeyMarkerTextUpcoming,
                  ]}>
                    {marker === 'completed' ? '✓' : marker === 'current' ? '●' : '○'}
                  </Text>
                </View>
                {!isLast ? <View style={styles.journeyConnector} /> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${lesson.title}. ${stateLabel}. Open lesson`}
                onPress={() => navigation.navigate('LessonSummary', { lessonId: lesson.id })}
                style={({ pressed }) => [
                  styles.journeyCard,
                  marker === 'current' && styles.journeyCardCurrent,
                  marker === 'upcoming' && styles.journeyCardUpcoming,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.journeyCardTitle}>{lesson.title}</Text>
                <Text style={styles.journeyCardMeta}>{lesson.estimatedMinutes} minutes · Level {lesson.difficulty}</Text>
                <Text style={[styles.journeyCardStateText, { color: stateColor }]}>{stateLabel}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    ))}
  </AppScreen>;
}
