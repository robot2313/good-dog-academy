import { Pressable, Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProgressIndicator } from '../../../components/ProgressIndicator';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import type { LessonDefinition, LessonPerformanceRating } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { LessonIllustration } from '../coaching/LessonIllustration';
import { lessonEncouragement } from '../coaching/lessonCoaching';
import {
  formatSessionTime,
  sessionCheckInMessage,
  suggestedSessionRating,
  type GuidedSessionState,
} from './guidedSession';

interface LessonSessionScreenViewProps {
  readonly lesson: LessonDefinition;
  readonly dogName: string;
  readonly state: GuidedSessionState;
  readonly saveError: string | null;
  readonly onBegin: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onRecordSuccess: () => void;
  readonly onRecordChallenge: () => void;
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

export function LessonSessionScreenView({
  lesson,
  dogName,
  state,
  saveError,
  onBegin,
  onPause,
  onResume,
  onPrevious,
  onNext,
  onRecordSuccess,
  onRecordChallenge,
  onAcceptReset,
  onFinish,
  onReturnToTraining,
  onSelectRating,
  onSave,
  onCancel,
  onDone,
}: LessonSessionScreenViewProps): React.JSX.Element {
  const steps = lesson.steps.length > 0 ? lesson.steps : [lesson.goal];
  const currentStep = steps[state.currentStep] ?? steps[0];
  const tip = lesson.tips[state.currentStep % Math.max(1, lesson.tips.length)]
    ?? 'Reward the smallest good choice and pause between repetitions.';
  const troubleshooting = lesson.troubleshooting[
    state.currentStep % Math.max(1, lesson.troubleshooting.length)
  ];

  if (state.phase === 'complete') {
    return <AppScreen>
      <View style={styles.guidedCompleteCard} accessibilityLiveRegion="polite">
        <Text accessible={false} style={styles.guidedCompleteMark}>✓</Text>
        <Text style={styles.guidedCompleteKicker}>SESSION SAVED</Text>
        <Text accessibilityRole="header" style={styles.guidedCompleteTitle}>That practice counts.</Text>
        <Text style={styles.guidedCompleteBody}>{lessonEncouragement(lesson)}</Text>
      </View>
      <View style={styles.sessionSnapshotCard}>
        <Text accessibilityRole="header" style={styles.sessionSnapshotTitle}>Session snapshot</Text>
        <View style={styles.sessionSnapshotRow}>
          <View style={styles.sessionSnapshotMetric}>
            <Text style={styles.sessionSnapshotValue}>{state.successfulRepetitions}</Text>
            <Text style={styles.sessionSnapshotLabel}>wins noticed</Text>
          </View>
          <View style={styles.sessionSnapshotMetric}>
            <Text style={styles.sessionSnapshotValue}>{state.needsHelpRepetitions}</Text>
            <Text style={styles.sessionSnapshotLabel}>needed help</Text>
          </View>
          <View style={styles.sessionSnapshotMetric}>
            <Text style={styles.sessionSnapshotValue}>{state.furthestStep + 1}/{steps.length}</Text>
            <Text style={styles.sessionSnapshotLabel}>steps reached</Text>
          </View>
        </View>
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
        <Text style={styles.body}>{state.successfulRepetitions} successful · {state.needsHelpRepetitions} needed help · reached step {state.furthestStep + 1} of {steps.length}</Text>
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
    const onLastStep = state.currentStep === steps.length - 1;
    const timerExpired = state.remainingSeconds === 0;
    return <AppScreen>
      <View style={styles.sessionTimerCard} accessibilityLiveRegion="polite">
        <View>
          <Text style={styles.sessionTimerLabel}>
            {state.running ? 'SESSION RUNNING' : timerExpired ? 'TIME BOX COMPLETE' : 'SESSION PAUSED'}
          </Text>
          <Text style={styles.sessionTimer}>{formatSessionTime(state.remainingSeconds)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={state.running ? 'Pause session timer' : 'Resume session timer'}
          accessibilityState={{ disabled: state.resetSuggested || timerExpired }}
          disabled={state.resetSuggested || timerExpired}
          onPress={state.running ? onPause : onResume}
          style={({ pressed }) => [styles.timerButton, (state.resetSuggested || timerExpired) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.timerButtonText}>{state.running ? 'Pause' : 'Resume'}</Text>
        </Pressable>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: steps.length, now: state.currentStep + 1 }}
      >
        <ProgressIndicator current={state.currentStep + 1} total={steps.length} />
      </View>
      <View style={styles.sessionStepCard}>
        <Text style={styles.sessionStepKicker}>STEP {state.currentStep + 1}</Text>
        <Text accessibilityRole="header" style={styles.sessionStepText}>{currentStep.replace(/^\d+\.\s*/, '')}</Text>
      </View>
      <View style={styles.sessionCoachCard}>
        <Text style={styles.sessionCoachLabel}>COACHING TIP</Text>
        <Text style={styles.sessionCoachBody}>{tip}</Text>
      </View>
      <View style={styles.sessionCheckInCard} accessibilityLiveRegion="polite">
        <Text style={styles.sessionCheckInLabel}>QUICK CHECK</Text>
        <Text accessibilityRole="header" style={styles.sessionCheckInHeading}>How did that repetition go?</Text>
        <Text style={styles.sessionCoachBody}>{sessionCheckInMessage(state)}</Text>
        <View style={styles.sessionCountRow}>
          <Text style={styles.sessionCountText}>{state.successfulRepetitions} wins</Text>
          <Text style={styles.sessionCountText}>{state.needsHelpRepetitions} needed help</Text>
        </View>
        {state.resetSuggested ? <View style={styles.sessionResetCard}>
          <Text style={styles.sessionResetTitle}>Take a reset</Text>
          <Text style={styles.sessionResetText}>Pause for 30–60 seconds. Add distance, reduce the distraction or ask for an easier version.</Text>
          <PrimaryButton title="I made it easier — continue" onPress={onAcceptReset} />
        </View> : <View style={styles.sessionActionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark a successful repetition"
            onPress={onRecordSuccess}
            style={({ pressed }) => [styles.sessionWinButton, pressed && styles.pressed]}
          ><Text style={styles.sessionWinButtonText}>✓ That worked</Text></Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark a repetition that needs help"
            onPress={onRecordChallenge}
            style={({ pressed }) => [styles.sessionHelpButton, pressed && styles.pressed]}
          ><Text style={styles.sessionHelpButtonText}>Needs help</Text></Pressable>
        </View>}
      </View>
      <View style={styles.sessionTroubleCard}>
        <Text style={styles.sessionTroubleLabel}>IF THIS ISN&apos;T WORKING</Text>
        <Text style={styles.troubleshootingProblem}>{troubleshooting?.problem ?? 'Your dog is distracted, hesitant or losing interest.'}</Text>
        <Text style={styles.troubleshootingSolution}>{troubleshooting?.solution ?? 'Pause, add distance, lower the difficulty and reward one easier success.'}</Text>
      </View>
      <View style={styles.sessionActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous training step"
          accessibilityState={{ disabled: state.currentStep === 0 || state.resetSuggested }}
          disabled={state.currentStep === 0 || state.resetSuggested}
          onPress={onPrevious}
          style={({ pressed }) => [styles.sessionOutlineButton, (state.currentStep === 0 || state.resetSuggested) && styles.disabled, pressed && styles.pressed]}
        ><Text style={styles.sessionOutlineButtonText}>Previous</Text></Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next training step"
          accessibilityState={{ disabled: onLastStep || state.resetSuggested }}
          disabled={onLastStep || state.resetSuggested}
          onPress={onNext}
          style={({ pressed }) => [styles.sessionOutlineButton, (onLastStep || state.resetSuggested) && styles.disabled, pressed && styles.pressed]}
        ><Text style={styles.sessionOutlineButtonText}>Next step</Text></Pressable>
      </View>
      <PrimaryButton title="Finish and rate session" onPress={onFinish} />
      <SecondaryTextButton title="Leave without saving" onPress={onCancel} />
      <Text style={styles.sessionExitNote}>Finish early if your dog is tired, worried or losing focus. That is good coaching.</Text>
    </AppScreen>;
  }

  return <AppScreen>
    <SecondaryTextButton title="Back to lesson" onPress={onCancel} />
    <Text style={styles.eyebrowDark}>GUIDED SESSION</Text>
    <Text accessibilityRole="header" style={styles.pageTitle}>{lesson.title}</Text>
    <View style={styles.coachingGoalCard}>
      <Text style={styles.coachingKicker}>TODAY&apos;S GOAL</Text>
      <Text style={styles.lessonGoal}>{lesson.goal}</Text>
      <Text style={styles.coachingMeta}>About {lesson.estimatedMinutes} minutes · pause or finish early at any time.</Text>
    </View>
    <LessonIllustration skill={lesson.skill} lessonId={lesson.id} commonMistake={lesson.commonMistakes[0]} />
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Get ready</Text>
      <Text style={styles.body}>Have everything within reach before you begin:</Text>
      <View style={styles.coachingListCard}>
        {(lesson.equipment.length > 0 ? lesson.equipment : ['Small rewards your dog enjoys']).map((item, index) => <View key={`${lesson.id}-equipment-${index}`} style={styles.coachingListRow}>
          <Text accessible={false} style={styles.coachingBullet}>✓</Text>
          <Text style={styles.coachingListText}>{item}</Text>
        </View>)}
      </View>
    </View>
    <View style={styles.safetyCard}>
      <Text accessibilityRole="header" style={styles.safetyTitle}>Safety comes first</Text>
      <Text style={styles.safetyText}>{lesson.safetyNotes[0] ?? 'Use a quiet, comfortable space and stop if your dog appears worried or overwhelmed.'}</Text>
    </View>
    <View style={styles.sessionPromiseCard}>
      <Text accessibilityRole="header" style={styles.sessionPromiseTitle}>Your coaching promise</Text>
      <Text style={styles.sessionPromiseText}>Two difficult attempts in a row means pause and make the setup easier—not push through.</Text>
    </View>
    <PrimaryButton title={`Begin ${lesson.estimatedMinutes}-minute session`} onPress={onBegin} />
  </AppScreen>;
}
