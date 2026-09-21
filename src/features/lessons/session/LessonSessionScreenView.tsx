import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppModal } from '../../../components/AppModal';
import { AppScreen } from '../../../components/AppScreen';
import { LessonActionBar } from '../../../components/LessonActionBar';
import { LessonPhotoBanner } from '../../../components/LessonPhotoBanner';
import { LessonScaffold } from '../../../components/LessonScaffold';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ReferenceIcon } from '../../../components/ReferenceIcon';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import type { LessonDefinition, LessonPerformanceRating } from '../../../domain/models';
import { referencePalette, referenceScreenStyles } from '../../../theme/referenceStyles';
import { styles } from '../../../theme/styles';
import { lessonEncouragement } from '../coaching/lessonCoaching';
import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { getLessonStepVisual } from '../coaching/lessonStepVisuals';
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
  const [helpVisible, setHelpVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const lessonPhoto = getLessonImageSource(lesson.id, lesson.skill);
  const support = lessonSupportContent(lesson);

  if (state.phase === 'complete') {
    return <AppScreen>
      <View style={sessionLocal.completeColumn} accessibilityLiveRegion="polite">
        <View style={sessionLocal.completeMark}>
          <ReferenceIcon name="check" size={26} color="#FFFFFF" strokeWidth={2.6} />
        </View>
        <Text style={styles.guidedCompleteKicker}>SESSION SAVED</Text>
        <Text accessibilityRole="header" style={styles.guidedCompleteTitle}>That practice counts.</Text>
        <Text style={styles.guidedCompleteBody}>{lessonEncouragement(lesson)}</Text>
        <View style={sessionLocal.completeStatsCard}>
          <View style={sessionLocal.completeStat}>
            <Text style={sessionLocal.completeStatValue}>{state.successfulRepetitions}</Text>
            <Text style={sessionLocal.completeStatLabel}>SUCCESSES</Text>
          </View>
          <View style={sessionLocal.completeStatDivider} />
          <View style={sessionLocal.completeStat}>
            <Text style={sessionLocal.completeStatValue}>{steps.length}</Text>
            <Text style={sessionLocal.completeStatLabel}>STEPS PRACTISED</Text>
          </View>
        </View>
        <View style={sessionLocal.completeNextCard}>
          <Image accessible={false} resizeMode="cover" source={lessonPhoto} style={sessionLocal.completeNextImage} />
          <View style={sessionLocal.completeNextCopy}>
            <Text style={sessionLocal.completeNextTitle}>{lesson.title}</Text>
            <Text style={sessionLocal.completeNextMeta}>
              Progress recorded for {dogName}. Your Journey updates from here.
            </Text>
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

    const safeStepIndex = Math.min(currentStepIndex, steps.length - 1);
    const currentStep = steps[safeStepIndex];
    const currentVisual = getLessonStepVisual(lesson.id, safeStepIndex);
    const isFirstStep = safeStepIndex === 0;
    const isLastStep = safeStepIndex === steps.length - 1;

    const handlePreviousStep = (): void => {
      if (isFirstStep) {
        onCancel();
        return;
      }

      setCurrentStepIndex((value) => Math.max(0, value - 1));
    };

    const handleNextStep = (): void => {
      if (isLastStep) {
        onFinish();
        return;
      }

      setCurrentStepIndex((value) => Math.min(steps.length - 1, value + 1));
    };

    return <LessonScaffold
      footer={<LessonActionBar
        back={{
          label: isFirstStep ? 'Back' : 'Previous',
          onPress: handlePreviousStep,
        }}
        forward={{
          label: isLastStep ? 'Complete Lesson' : 'Next Step',
          onPress: handleNextStep,
        }}
      />}
    >
      <View style={styles.activeColumn}>
        <View style={styles.activeTimerHeader} accessibilityLiveRegion="polite">
          <View>
            <Text style={styles.activeTimerLabel}>
              {state.running
                ? 'SESSION RUNNING'
                : timerExpired
                  ? 'TIME BOX COMPLETE'
                  : 'SESSION PAUSED'}
            </Text>
            <Text style={styles.activeTimerValue}>
              {formatSessionTime(state.remainingSeconds)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              state.running ? 'Pause session timer' : 'Resume session timer'
            }
            accessibilityState={{
              disabled: state.resetSuggested || timerExpired,
            }}
            disabled={state.resetSuggested || timerExpired}
            onPress={state.running ? onPause : onResume}
            style={({ pressed }) => [
              styles.activeTimerButton,
              (state.resetSuggested || timerExpired) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.activeTimerButtonText}>
              {state.running ? 'Pause' : 'Resume'}
            </Text>
          </Pressable>
        </View>

        <View
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Step ${safeStepIndex + 1} of ${steps.length}`}
          style={sessionLocal.singleStepCard}
        >
          <View style={sessionLocal.stepProgressRow}>
            <Text style={sessionLocal.stepProgressText}>
              STEP {safeStepIndex + 1} OF {steps.length}
            </Text>

            <View style={sessionLocal.stepDots}>
              {steps.map((_, index) => (
                <View
                  key={`${lesson.id}-step-dot-${index}`}
                  style={[
                    sessionLocal.stepDot,
                    index === safeStepIndex && sessionLocal.stepDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <Image
            accessible
            accessibilityRole="image"
            accessibilityLabel={
              currentVisual?.caption ??
              `${lesson.title}, step ${safeStepIndex + 1}`
            }
            resizeMode="contain"
            source={currentVisual?.setupImage ?? lessonPhoto}
            style={sessionLocal.singleStepImage}
          />

          <View style={sessionLocal.singleStepCopy}>
            <View style={styles.activeStepNumber}>
              <Text accessible={false} style={styles.activeStepNumberText}>
                {safeStepIndex + 1}
              </Text>
            </View>

            <Text style={sessionLocal.singleStepText}>
              {stripStepNumber(currentStep)}
            </Text>
          </View>
        </View>

        {state.resetSuggested ? (
          <View
            style={styles.activeResetHint}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.activeResetHintText}>
              Two tricky attempts in a row. Make the setup easier, then continue.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="I made it easier, continue"
              onPress={onAcceptReset}
              style={({ pressed }) => [
                styles.activeResetHintButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.activeResetHintButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.activeCounterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Success. ${state.successfulRepetitions} recorded`}
            accessibilityState={{ disabled: state.resetSuggested }}
            disabled={state.resetSuggested}
            onPress={onRecordSuccess}
            style={({ pressed }) => [
              styles.activeCounterSuccess,
              state.resetSuggested && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.activeCounterLabelOnDark}>SUCCESS</Text>
            <Text style={styles.activeCounterValueOnDark}>
              {state.successfulRepetitions}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Try again. ${state.needsHelpRepetitions} recorded`}
            accessibilityState={{ disabled: state.resetSuggested }}
            disabled={state.resetSuggested}
            onPress={onRecordChallenge}
            style={({ pressed }) => [
              styles.activeCounterTryAgain,
              state.resetSuggested && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.activeCounterLabelLight}>TRY AGAIN</Text>
            <Text style={styles.activeCounterValueLight}>
              {state.needsHelpRepetitions}
            </Text>
          </Pressable>
        </View>

        <View style={sessionLocal.underCounterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Undo last check-in"
            accessibilityState={{ disabled: !canUndo }}
            disabled={!canUndo}
            onPress={onUndo}
            style={styles.activeUndo}
          >
            <Text
              style={[
                styles.activeUndoText,
                !canUndo && styles.activeUndoTextDisabled,
              ]}
            >
              Undo last
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="This isn't working. Open help"
            onPress={() => setHelpVisible(true)}
            style={styles.activeUndo}
          >
            <Text style={styles.activeUndoText}>
              This isn't working?
            </Text>
          </Pressable>
        </View>
      </View>

      <AppModal
        visible={helpVisible}
        title="This isn't working"
        onClose={() => setHelpVisible(false)}
        closeLabel="Close help"
      >
        <View style={sessionLocal.helpBody}>
          {support.waysToMakeEasier.length > 0 ? (
            <View style={referenceScreenStyles.noticeInfo}>
              <Text style={referenceScreenStyles.noticeInfoTitle}>
                Make it easier
              </Text>
              {support.waysToMakeEasier.map((way, index) => (
                <Text
                  key={`${lesson.id}-help-easier-${index}`}
                  style={referenceScreenStyles.noticeInfoBody}
                >
                  • {way}
                </Text>
              ))}
            </View>
          ) : null}

          {support.thingsThatMightGoWrong.length > 0 ? (
            <View style={referenceScreenStyles.card}>
              <Text style={referenceScreenStyles.blockTitle}>
                Common mistakes
              </Text>
              {support.thingsThatMightGoWrong.slice(0, 3).map((problem, index) => (
                <Text
                  key={`${lesson.id}-help-problem-${index}`}
                  style={referenceScreenStyles.blockIntro}
                >
                  • {problem}
                </Text>
              ))}
            </View>
          ) : null}

          {support.safetyNotes.length > 0 ? (
            <View style={referenceScreenStyles.noticeWarn}>
              <Text style={referenceScreenStyles.noticeWarnTitle}>
                Safety first
              </Text>
              {support.safetyNotes.map((note, index) => (
                <Text
                  key={`${lesson.id}-help-safety-${index}`}
                  style={referenceScreenStyles.noticeWarnBody}
                >
                  • {note}
                </Text>
              ))}
            </View>
          ) : null}

          <PrimaryButton
            title="Try again"
            onPress={() => setHelpVisible(false)}
          />
        </View>
      </AppModal>
    </LessonScaffold>;
  }

  return <LessonScaffold
    footer={<LessonActionBar
      back={{ label: 'Back', onPress: onCancel }}
      forward={{ label: 'Start Lesson', onPress: onBegin }}
    />}
  >
    <LessonPhotoBanner
      source={lessonPhoto}
      accessibilityLabel={`${lesson.title} lesson photograph`}
    />
    <View style={sessionLocal.bybHeader}>
      <Text style={styles.eyebrowDark}>BEFORE YOU BEGIN · {lesson.estimatedMinutes} MIN</Text>
      <Text accessibilityRole="header" style={styles.pageTitle}>Before You Begin</Text>
    </View>

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
              <View style={sessionLocal.listIconCircle}>
                <ReferenceIcon name="check" size={11} color="#FFFFFF" strokeWidth={2.6} />
              </View>
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
              <View style={[sessionLocal.listIconCircle, sessionLocal.listIconCircleWarn]}>
                <Text accessible={false} style={sessionLocal.listIconGlyph}>!</Text>
              </View>
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
              <View style={[sessionLocal.listIconCircle, sessionLocal.listIconCircleSoft]}>
                <Text accessible={false} style={sessionLocal.listIconGlyphGreen}>↓</Text>
              </View>
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

const sessionLocal = StyleSheet.create({
  bybHeader: { gap: 2 },
  helpBody: { gap: 10 },
  listIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: referencePalette.green,
  },
  listIconCircleWarn: { backgroundColor: '#D99A22' },
  listIconCircleSoft: { backgroundColor: referencePalette.greenSoft },
  listIconGlyph: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontWeight: '900' },
  listIconGlyphGreen: { color: referencePalette.greenDark, fontSize: 11, lineHeight: 14, fontWeight: '900' },
  stepVisualImage: {
    width: '100%',
    height: 110,
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: referencePalette.line,
  },
  singleStepCard: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: referencePalette.line,
    backgroundColor: referencePalette.surface,
    padding: 12,
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepProgressText: {
    color: referencePalette.greenDark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: referencePalette.line,
  },
  stepDotActive: {
    width: 18,
    backgroundColor: referencePalette.green,
  },
  singleStepImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 380,
    borderRadius: 14,
    backgroundColor: referencePalette.greenSoft,
  },
  singleStepCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  singleStepText: {
    flex: 1,
    minWidth: 0,
    color: referencePalette.navy,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  underCounterRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  completeColumn: { alignItems: 'center', gap: 10, paddingTop: 8 },
  completeMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: referencePalette.green,
  },
  completeStatsCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: referencePalette.line,
    backgroundColor: referencePalette.surface,
    paddingVertical: 12,
  },
  completeStat: { flex: 1, alignItems: 'center', gap: 1 },
  completeStatDivider: { width: 1, alignSelf: 'stretch', backgroundColor: referencePalette.line },
  completeStatValue: { color: referencePalette.greenDark, fontSize: 22, lineHeight: 27, fontWeight: '900' },
  completeStatLabel: { color: referencePalette.muted, fontSize: 9, lineHeight: 13, letterSpacing: 0.8, fontWeight: '900' },
  completeNextCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: referencePalette.line,
    backgroundColor: referencePalette.surface,
    padding: 10,
  },
  completeNextImage: { width: 52, height: 52, borderRadius: 10 },
  completeNextCopy: { flex: 1, minWidth: 0, gap: 2 },
  completeNextTitle: { color: referencePalette.navy, fontSize: 13.5, lineHeight: 18, fontWeight: '900' },
  completeNextMeta: { color: referencePalette.muted, fontSize: 11, lineHeight: 15 },
});
