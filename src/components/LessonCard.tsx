import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { LessonDefinition } from '../domain/models';
import { styles } from '../theme/styles';
import { PrimaryButton } from './PrimaryButton';

type LessonCardProps = {
  lesson: LessonDefinition;
  completed: boolean;
  onComplete: () => void;
};

export function LessonCard({ lesson, completed, onComplete }: LessonCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.lessonTopRow}>
        <View style={styles.coursePill}>
          <Text style={styles.coursePillText}>{lesson.skill.replaceAll('-', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.duration}>LEVEL {lesson.difficultyLevel} · {lesson.estimatedMinutes} MIN</Text>
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.body}>{lesson.shortDescription}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [styles.lessonDetailsButton, pressed && styles.pressed]}
      >
        <Text style={styles.lessonDetailsButtonText}>{expanded ? 'Hide lesson' : 'View lesson'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.lessonDetails}>
          <Text style={styles.lessonGoal}>{lesson.goal}</Text>
          {lesson.steps.map((step, index) => (
            <View key={`${lesson.id}-step-${index}`} style={styles.lessonStep}>
              <Text style={styles.lessonStepNumber}>{index + 1}</Text>
              <Text style={styles.lessonStepText}>{step}</Text>
            </View>
          ))}
          {lesson.safetyNotes.length > 0 ? (
            <View style={styles.lessonSafety}>
              <Text style={styles.lessonSafetyTitle}>Keep it safe</Text>
              <Text style={styles.lessonSafetyText}>{lesson.safetyNotes.join(' ')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {completed
        ? <View style={styles.completedBadge}><Text style={styles.completedBadgeText}>✓ Completed</Text></View>
        : <PrimaryButton title="Mark session complete" onPress={onComplete} />}
    </View>
  );
}
