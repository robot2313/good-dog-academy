import { Pressable, Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { LessonActionBar } from '../../../components/LessonActionBar';
import { LessonScaffold } from '../../../components/LessonScaffold';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import type { LessonDefinition, LessonPerformanceRating } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { lessonEncouragement } from '../coaching/lessonCoaching';
import {
  formatSessionTime,
  suggestedSessionRating,
  type GuidedSessionState,
} from './guidedSession';
import { lessonSupportContent } from './lessonSupportContent';

interface LessonSessionScreenViewProps {
  readonly lesson: LessonDefinition;
  readonly dogName: string;
  readonly state: GuidedSessionState;
  readonly saveError: string | null;
  readonly onBegin: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onRecordSuccess: () => void;
  readonly onRecordChallenge: () => void;
  readonly onUndo: () => void;
  readonly onAcceptReset: () => void;
  readonly onFinish: () => void;
  readonly onReturnToTraining: () => void;
  readonly onSelectRating: (rating: LessonPerformanceRating) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly onDone: () => void;
}

const ratingOptions = Object.freeze([
  { rating: 1, title: 'Very difficult', description: 'Stop and make the next session much easier' },
  { rating: 2, title: 'Needs more practice', description: 'A simpler setup would help' },
  { rating: 3, title: 'Some success', description: 'At least one useful repetition' },
  { rating: 4, title: 'Went well', description: 'Mostly relaxed and successful' },
  { rating: 5, title: 'Went great', description: 'Relaxed and reliably successful' },
] as const satisfies readonly {
  readonly rating: LessonPerformanceRating;
  readonly title: string;
  readonly description: string;
}[]);

function stripStepNumber(value: string): string {
  return value.replace(/^\s*\d+\.\s*/, '').trim();
}

export function LessonSessionScreenView({
  lesson,
  dogName,
  state,
  saveError,
  onBegin,
  onPause,
  onResume,
  onRecordSuccess,
  onRecordChallenge,
  onUndo,
  onAcceptReset,
  onFinish,
  onReturnToTraining,
  onSelectRating,
  onSave,
  onCancel,
  onDone,
}: LessonSessionScreenViewProps): React.JSX.Element {
  const steps = lesson.steps.length > 0 ? lesson.steps : [lesson.goal];

  if (state.phase === 'complete') {
    return <AppScreen>
      <View style={styles.guidedCompleteCard} accessibilityLiveRegion="polite">
        <Text accessible={false} style={styles.guidedCompleteMark}>✓</Text>
        <Text style={styles.guidedCompleteKicker}>SESSION SAVED</Text>
        <Text accessibilityRole="header" style={styles.guidedCompleteTitle}>That practice counts.</Text>
        <Text style={styles.guidedCompleteBody}>{lessonEncouragement(lesson)}</Text>
      </View>
      <PrimaryButton title="Back to lesson" onPress={onDone} />
    </AppScreen>;
  }

  if (state.phase === 'feedback' || state.phase === 'saving') {
    const saving = state.phase === 'saving';
    const suggestedRating = suggestedSessionRating(state);
    return <AppScreen>
      <Text style={styles.eyebrowDark}>SESSION CHECK-IN</Text>
      <Text accessibilityRole="header" style={styles.pageTitle}>How did it feel?</Text>
      <Text style={styles.body}>Choose the closest match. Honest feedback helps the next practice stay achievable.</Text>
      <View style={styles.sessionSnapshotCard}>
        <Text style={styles.sessionSnapshotTitle}>Today with {dogName}</Text>
        <Text style={styles.body}>{state.successfulRepetitions} success · {state.needsHelpRepetitions} try again · {steps.length} steps</Text>
      </View>
      <View style={styles.sessionRatingStack}>
        {ratingOptions.map((option) => {
          const selected = state.selectedRating === option.rating;
          const suggested = suggestedRating === option.rating;
          return <Pressable
            key={option.rating}
            accessibilityRole="button"
            accessibilityLabel={`${option.rating} out of 5. ${option.title}${suggested ? '. Suggested from check-ins' : ''}`}
            accessibilityState={{ disabled: saving, selected }}
            disabled={saving}
            onPress={() => onSelectRating(option.rating)}
            style={({ pressed }) => [
              styles.sessionRatingButton,
              selected && styles.sessionRatingButtonSelected,
              saving && styles.disabled,
              pressed && !saving && styles.pressed,
            ]}
          >
            <View style={styles.sessionRatingTitleRow}>
              <Text style={styles.sessionRatingValue}>{option.rating}</Text>
              <View style={styles.sessionRatingCopy}>
                <Text style={styles.sessionRatingTitle}>{option.title}</Text>
                <Text style={styles.sessionRatingDescription}>{option.description}</Text>
              </View>
              {suggested ? <Text style={styles.sessionRatingSuggested}>SUGGESTED</Text> : null}
            </View>
          </Pressable>;
        })}
      </View>
      {saveError ? <View style={styles.errorCard} accessibilityLiveRegion="assertive">
        <Text style={styles.body}>{saveError}</Text>
      </View> : null}
      <PrimaryButton
        title={saving ? 'Saving session…' : 'Save session'}
        accessibilityLabel={saving ? 'Saving session' : 'Save session'}
        disabled={saving || state.selectedRating === null}
        onPress={onSave}
      />
      {!saving ? <>
        <SecondaryTextButton title="Keep training" onPress={onReturnToTraining} />
        <SecondaryTextButton title="Leave without saving" onPress={onCancel} />
      </> : null}
    </AppScreen>;
  }

  if (state.phase === 'training') {
    const timerExpired = state.remainingSeconds === 0;
    const canUndo = state.undoSnapshot !== null;
    return <LessonScaffold
      scroll={false}
      footer={<LessonActionBar
        back={{ label: 'Back', onPress: onCancel }}
        forward={{ label: 'Complete Lesson', onPress: onFinish }}
      />}
    >
      <View style={styles.activeColumn}>
        <View style={styles.activeTimerHeader} accessibilityLiveRegion="polite">
          <View>
            <Text style={styles.activeTimerLabel}>
              {state.running ? 'SESSION RUNNING' : timerExpired ? 'TIME BOX COMPLETE' : 'SESSION PAUSED'}
            </Text>
            <Text style={styles.activeTimerValue}>{formatSessionTime(state.remainingSeconds)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={state.running ? 'Pause session timer' : 'Resume session timer'}
            accessibilityState={{ disabled: state.resetSuggested || timerExpired }}
            disabled={state.resetSuggested || timerExpired}
            onPress={state.running ? onPause : onResume}
            style={({ pressed }) => [styles.activeTimerButton, (state.resetSuggested || timerExpired) && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.activeTimerButtonText}>{state.running ? 'Pause' : 'Resume'}</Text>
          </Pressable>
        </View>

        <View
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`All ${steps.length} training steps for ${lesson.title}`}
          style={styles.activeSteps}
        >
          {steps.map((step, index) => (
            <View
              key={`${lesson.id}-active-step-${index}`}
              style={[styles.activeStepRow, index === steps.length - 1 && styles.activeStepRowLast]}
            >
              <View style={styles.activeStepNumber}>
                <Text accessible={false} style={styles.activeStepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.activeStepBody}>
                <Text style={styles.activeStepText}>{stripStepNumber(step)}</Text>
              </View>
            </View>
          ))}
        </View>

        {state.resetSuggested ? (
          <View style={styles.activeResetHint} accessibilityLiveRegion="polite">
            <Text style={styles.activeResetHintText}>Two tricky attempts in a row. Make the setup easier, then continue.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="I made it easier, continue"
              onPress={onAcceptReset}
              style={({ pressed }) => [styles.activeResetHintButton, pressed && styles.pressed]}
            ><Text style={styles.activeResetHintButtonText}>Continue</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.activeCounterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Success. ${state.successfulRepetitions} recorded. Mark a successful repetition`}
            accessibilityState={{ disabled: state.resetSuggested }}
            disabled={state.resetSuggested}
            onPress={onRecordSuccess}
            style={({ pressed }) => [styles.activeCounterSuccess, state.resetSuggested && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.activeCounterLabelOnDark}>SUCCESS</Text>
            <Text style={styles.activeCounterValueOnDark}>{state.successfulRepetitions}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Try again. ${state.needsHelpRepetitions} recorded. Mark a repetition that needs help`}
            accessibilityState={{ disabled: state.resetSuggested }}
            disabled={state.resetSuggested}
            onPress={onRecordChallenge}
            style={({ pressed }) => [styles.activeCounterTryAgain, state.resetSuggested && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.activeCounterLabelLight}>TRY AGAIN</Text>
            <Text style={styles.activeCounterValueLight}>{state.needsHelpRepetitions}</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo last check-in"
          accessibilityState={{ disabled: !canUndo }}
          disabled={!canUndo}
          onPress={onUndo}
          style={styles.activeUndo}
        >
          <Text style={[styles.activeUndoText, !canUndo && styles.activeUndoTextDisabled]}>Undo last</Text>
        </Pressable>
      </View>
    </LessonScaffold>;
  }

  const support = lessonSupportContent(lesson);
  return <LessonScaffold
    footer={<LessonActionBar
      back={{ label: 'Back', onPress: onCancel }}
      forward={{ label: 'Start Lesson', onPress: onBegin }}
    />}
  >
    <Text style={styles.eyebrowDark}>BEFORE YOU BEGIN</Text>
    <Text accessibilityRole="header" style={styles.pageTitle}>Before You Begin</Text>

    <View style={styles.coachingGoalCard}>
      <Text style={styles.coachingKicker}>LESSON OVERVIEW</Text>
      <Text style={styles.lessonGoal}>{support.overview}</Text>
      {support.aim ? <Text style={styles.coachingMeta}>Aiming for: {support.aim}</Text> : null}
      <Text style={styles.coachingMeta}>About {lesson.estimatedMinutes} minutes · pause or finish early at any time.</Text>
    </View>

    {support.coachingTips.length > 0 ? (
      <View style={styles.bybSection}>
        <Text accessibilityRole="header" style={styles.coachingSectionTitle}>Coaching tips</Text>
        <View style={styles.coachingListCard}>
          {support.coachingTips.map((tip, index) => (
            <View key={`${lesson.id}-tip-${index}`} style={styles.coachingListRow}>
              <Text accessible={false} style={styles.coachingTipIcon}>★</Text>
              <Text style={styles.coachingListText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}

    {support.thingsThatMightGoWrong.length > 0 ? (
      <View style={styles.bybSection}>
        <Text accessibilityRole="header" style={styles.coachingSectionTitle}>Things that might go wrong</Text>
        <View style={styles.coachingPreventionCard}>
          {support.thingsThatMightGoWrong.map((problem, index) => (
            <View key={`${lesson.id}-problem-${index}`} style={styles.coachingListRow}>
              <Text accessible={false} style={styles.coachingWarningIcon}>!</Text>
              <Text style={styles.coachingListText}>{problem}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}

    {support.waysToMakeEasier.length > 0 ? (
      <View style={styles.bybSection}>
        <Text accessibilityRole="header" style={styles.coachingSectionTitle}>Make it easier</Text>
        <View style={styles.bybEasierCard}>
          {support.waysToMakeEasier.map((way, index) => (
            <View key={`${lesson.id}-easier-${index}`} style={styles.coachingListRow}>
              <Text accessible={false} style={styles.bybEasierIcon}>↓</Text>
              <Text style={styles.coachingListText}>{way}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}

    {support.safetyNotes.length > 0 ? (
      <View style={styles.safetyCard}>
        <Text accessibilityRole="header" style={styles.safetyTitle}>Safety first</Text>
        {support.safetyNotes.map((note, index) => (
          <Text key={`${lesson.id}-safety-${index}`} style={styles.safetyText}>• {note}</Text>
        ))}
      </View>
    ) : null}
  </LessonScaffold>;
}
