import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { createLocalId } from '../../../utils/ids';
import { useLessonLibraryData } from '../library/LessonLibraryContext';
import { lessonLibraryErrorMessage } from '../library/lessonLibraryPresentation';
import { LessonLibraryService } from '../library/LessonLibraryService';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';
import { LessonSessionCompletionError } from '../progress';
import {
  createGuidedSessionNote,
  createGuidedSessionState,
  guidedSessionReducer,
} from './guidedSession';
import { LessonSessionScreenView } from './LessonSessionScreenView';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonSession'>;

type SessionIdentity = {
  readonly ownerId: string;
  readonly dogId: string;
};

export function LessonSessionScreen({ navigation, route }: Props): React.JSX.Element {
  const {
    catalogue,
    selectedDog,
    selectedOwnerId,
    progressRecords,
    loading,
    error,
    retry,
    completeLessonSession,
  } = useLessonLibraryData();
  const lesson = catalogue.findById(route.params.lessonId);
  const service = useMemo(
    () => new LessonLibraryService(catalogue, selectedDog?.id ?? null, progressRecords),
    [catalogue, progressRecords, selectedDog?.id],
  );
  const [state, dispatch] = useReducer(
    guidedSessionReducer,
    undefined,
    () => createGuidedSessionState(
      lesson?.estimatedMinutes ?? 1,
      createLocalId('training-session'),
    ),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const identity = useRef<SessionIdentity | null>(
    selectedDog && selectedOwnerId
      ? { ownerId: selectedOwnerId, dogId: selectedDog.id }
      : null,
  );
  if (!identity.current && selectedDog && selectedOwnerId) {
    identity.current = { ownerId: selectedOwnerId, dogId: selectedDog.id };
  }

  useEffect(() => {
    if (state.phase !== 'training' || !state.running) return undefined;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [state.phase, state.running]);

  let summary: LessonLibraryItem | null = null;
  let summaryError: unknown | null = error;
  if (!loading && !summaryError) {
    try {
      summary = service.getLessonSummary(route.params.lessonId);
    } catch (cause) {
      summaryError = cause;
    }
  }

  const cancel = () => {
    if (state.phase === 'saving' || state.phase === 'complete') return;
    dispatch({ type: 'cancel' });
    navigation.goBack();
  };

  const save = async () => {
    if (
      submissionInFlight.current
      || state.phase !== 'feedback'
      || state.selectedRating === null
      || state.startedAt === null
      || !identity.current
    ) {
      return;
    }

    submissionInFlight.current = true;
    setSaveError(null);
    dispatch({ type: 'submit' });
    try {
      await completeLessonSession({
        sessionId: state.sessionId,
        ownerId: identity.current.ownerId,
        dogId: identity.current.dogId,
        lessonId: route.params.lessonId,
        dailyPlanId: route.params.dailyPlanId ?? null,
        startedAt: state.startedAt,
        rating: state.selectedRating,
        notes: createGuidedSessionNote(state, lesson?.steps.length ?? 1),
        allowPrerequisiteBypass: route.params.selfDirected === true && route.params.dailyPlanId === undefined,
      });
      // Progress is now persisted AND the shared lesson-library state has been
      // refreshed by completeLessonSession. Return to Home so it renders the
      // updated numbers, then trigger the celebration over Home via a one-time
      // navigation param.
      dispatch({ type: 'saveSucceeded' });
      navigation.navigate('Main', {
        screen: 'Today',
        params: {
          celebrateLessonId: route.params.lessonId,
          celebrateLessonTitle: lesson?.title,
        },
      });
    } catch (cause) {
      setSaveError(sessionCompletionMessage(cause));
      dispatch({ type: 'saveFailed' });
    } finally {
      submissionInFlight.current = false;
    }
  };

  if (loading) {
    return <AppScreen scroll={false}><LoadingState message="Preparing guided session…" /></AppScreen>;
  }
  if (summaryError) {
    return <AppScreen>
      <SecondaryTextButton title="Back to lesson" onPress={() => navigation.goBack()} />
      <ErrorState message={lessonLibraryErrorMessage(summaryError)} onRetry={retry} />
    </AppScreen>;
  }
  if (!lesson || !summary) {
    return <AppScreen>
      <SecondaryTextButton title="Back to lesson" onPress={() => navigation.goBack()} />
      <ErrorState message="This lesson is no longer available." onRetry={() => navigation.goBack()} actionTitle="Back to lesson" />
    </AppScreen>;
  }
  const selfDirectedLockedLesson = summary.state === 'LOCKED' && route.params.selfDirected === true && route.params.dailyPlanId === undefined;
  if ((summary.state === 'LOCKED' && !selfDirectedLockedLesson) || !lesson.isActive) {
    return <AppScreen>
      <SecondaryTextButton title="Back to lesson" onPress={() => navigation.goBack()} />
      <View style={styles.errorCard}>
        <Text style={styles.sectionTitle}>Lesson still locked</Text>
        <Text style={styles.body}>{summary.lock?.reason ?? 'This lesson is not currently available.'}</Text>
      </View>
    </AppScreen>;
  }

  return (
    <LessonSessionScreenView
      lesson={lesson}
      dogName={selectedDog?.name ?? 'your dog'}
      state={state}
      saveError={saveError}
      onBegin={() =>
        dispatch({
          type: 'begin',
          startedAt: new Date().toISOString(),
        })
      }
      onPause={() => dispatch({ type: 'pause' })}
      onResume={() => dispatch({ type: 'resume' })}
      onRecordSuccess={() =>
        dispatch({ type: 'recordSuccess' })
      }
      onRecordChallenge={() =>
        dispatch({ type: 'recordChallenge' })
      }
      onUndo={() =>
        dispatch({ type: 'undo' })
      }
      onAcceptReset={() =>
        dispatch({ type: 'acceptReset' })
      }
      onFinish={() => dispatch({ type: 'finish' })}
      onReturnToTraining={() =>
        dispatch({ type: 'returnToTraining' })
      }
      onSelectRating={(rating) =>
        dispatch({
          type: 'selectRating',
          rating,
        })
      }
      onSave={() => void save()}
      onCancel={cancel}
      onDone={() => navigation.goBack()}
    />
  );
}

function sessionCompletionMessage(cause: unknown): string {
  if (!(cause instanceof LessonSessionCompletionError)) {
    return 'This training session could not be saved. Please try again.';
  }
  if (cause.code === 'STALE_SELECTED_DOG') {
    return 'The selected dog changed. Return to the Academy before saving this session.';
  }
  if (cause.code === 'LESSON_LOCKED' || cause.code === 'LESSON_INELIGIBLE') {
    return 'This lesson is no longer available for this dog. Return to the lesson summary.';
  }
  if (cause.code.startsWith('DAILY_PLAN_')) {
    return 'This Daily Plan has changed and cannot accept the session. Your check-ins are still here so you can try again.';
  }
  if (cause.code === 'CORRUPT_STORED_DATA') {
    return 'Stored training data could not be read safely. No partial session was saved.';
  }
  return 'This training session could not be saved. Please try again.';
}