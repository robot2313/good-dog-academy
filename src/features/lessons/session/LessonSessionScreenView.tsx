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
    return <LessonScaffold
      scroll={false}
      footer={<LessonActionBar
        back={{ label: 'Back', onPress: onCancel }}
        forward={{ label: 'Complete Lesson', onPress: onFinish }}
      />}
    >
      <View style={styles.activeColumn}>
        <LessonPhotoBanner
          decorative
          size="compact"
          source={lessonPhoto}
          accessibilityLabel={`${lesson.title} lesson photograph`}
        />

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
          {steps.map((step, index) => {
            const visual = getLessonStepVisual(lesson.id, index);
            return (
              <View
                key={`${lesson.id}-active-step-${index}`}
                style={[styles.activeStepRow, index === steps.length - 1 && styles.activeStepRowLast]}
              >
                <View style={styles.activeStepNumber}>
                  <Text accessible={false} style={styles.activeStepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.activeStepBody}>
                  <Text style={styles.activeStepText}>{stripStepNumber(step)}</Text>
                  {visual?.setupImage ? (
                    <Image
                      accessible
                      accessibilityRole="image"
                      accessibilityLabel={visual.caption ?? `Step ${index + 1} setup photograph`}
                      resizeMode="cover"
                      source={visual.setupImage}
                      style={sessionLocal.stepVisualImage}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
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

        <View style={sessionLocal.underCounterRow}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="This isn't working. Open help"
            onPress={() => setHelpVisible(true)}
            style={styles.activeUndo}
          >
            <Text style={styles.activeUndoText}>This isn't working?</Text>
          </Pressable>
        </View>
      </View>

      <AppModal visible={helpVisible} title="This isn't working" onClose={() => setHelpVisible(false)} closeLabel="Close help">
        <View style={sessionLocal.helpBody}>
          {support.waysToMakeEasier.length > 0 ? (
            <View style={referenceScreenStyles.noticeInfo}>
              <Text style={referenceScreenStyles.noticeInfoTitle}>Make it easier</Text>
              {support.waysToMakeEasier.map((way, index) => (
                <Text key={`${lesson.id}-help-easier-${index}`} style={referenceScreenStyles.noticeInfoBody}>• {way}</Text>
              ))}
            </View>
          ) : null}
          {support.thingsThatMightGoWrong.length > 0 ? (
            <View style={referenceScreenStyles.card}>
              <Text style={referenceScreenStyles.blockTitle}>Common mistakes</Text>
              {support.thingsThatMightGoWrong.slice(0, 3).map((problem, index) => (
                <Text key={`${lesson.id}-help-problem-${index}`} style={referenceScreenStyles.blockIntro}>• {problem}</Text>
              ))}
            </View>
          ) : null}
          {support.safetyNotes.length > 0 ? (
            <View style={referenceScreenStyles.noticeWarn}>
              <Text style={referenceScreenStyles.noticeWarnTitle}>Safety first</Text>
              {support.safetyNotes.map((note, index) => (
                <Text key={`${lesson.id}-help-safety-${index}`} style={referenceScreenStyles.noticeWarnBody}>• {note}</Text>
              ))}
            </View>
          ) : null}
          <PrimaryButton title="Try again" onPress={() => setHelpVisible(false)} />
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
