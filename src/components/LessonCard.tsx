import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { LessonDefinition, LessonPerformanceRating, LessonProgressStatus } from '../domain/models';
import { styles } from '../theme/styles';
import { PrimaryButton } from './PrimaryButton';

type LessonCardProps = {
  lesson: LessonDefinition;
  status: LessonProgressStatus;
  lockedMessage?: string;
  onComplete: (rating: LessonPerformanceRating) => void;
};

export function LessonCard({ lesson, status, lockedMessage, onComplete }: LessonCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const submitFeedback = (rating: LessonPerformanceRating) => { onComplete(rating); setShowFeedback(false); };
  const completed = status === 'completed';
  const locked = status === 'locked';

  return (
    <View style={styles.card}>
      <View style={styles.lessonTopRow}>
        <View style={styles.coursePill}><Text style={styles.coursePillText}>{lesson.skill.replaceAll('-', ' ').toUpperCase()}</Text></View>
        <Text style={styles.duration}>LEVEL {lesson.difficultyLevel} · {lesson.estimatedMinutes} MIN</Text>
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.body}>{lesson.shortDescription}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'Hide' : 'View'} ${lesson.title} instructions`} accessibilityState={{ expanded }} onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.lessonDetailsButton, pressed && styles.pressed]}>
        <Text style={styles.lessonDetailsButtonText}>{expanded ? 'Hide lesson' : 'View lesson'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.lessonDetails}>
          <Text style={styles.lessonGoal}>{lesson.goal}</Text>
          {lesson.steps.map((step, index) => <View key={`${lesson.id}-step-${index}`} style={styles.lessonStep}><Text style={styles.lessonStepNumber}>{index + 1}</Text><Text style={styles.lessonStepText}>{step}</Text></View>)}
          {lesson.safetyNotes.length > 0 ? <View style={styles.lessonSafety}><Text style={styles.lessonSafetyTitle}>Keep it safe</Text><Text style={styles.lessonSafetyText}>{lesson.safetyNotes.join(' ')}</Text></View> : null}
        </View>
      ) : null}
      {completed ? <View style={styles.completedBadge}><Text style={styles.completedBadgeText}>✓ Path completed</Text></View> : null}
      {locked ? <View style={styles.lockedLesson}><Text style={styles.lockedLessonTitle}>Locked</Text><Text style={styles.lockedLessonText}>{lockedMessage ?? 'Complete the prerequisite lesson path to unlock this session.'}</Text></View> : showFeedback ? (
        <View style={styles.feedbackPanel}>
          <Text style={styles.label}>How did this session go?</Text>
          <View style={styles.feedbackRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Session needs more practice" style={styles.feedbackButton} onPress={() => submitFeedback(2)}><Text style={styles.feedbackButtonText}>Needs practice</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Session went well" style={styles.feedbackButton} onPress={() => submitFeedback(3)}><Text style={styles.feedbackButtonText}>Good</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Session went great" style={[styles.feedbackButton, styles.feedbackButtonStrong]} onPress={() => submitFeedback(5)}><Text style={[styles.feedbackButtonText, styles.feedbackButtonTextStrong]}>Great</Text></Pressable>
          </View>
        </View>
      ) : <PrimaryButton title={completed ? 'Practice again' : 'Finish session'} onPress={() => setShowFeedback(true)} />}
    </View>
  );
}
