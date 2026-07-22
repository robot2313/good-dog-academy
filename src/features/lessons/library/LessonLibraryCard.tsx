import { Pressable, Text, View } from 'react-native';

import { styles } from '../../../theme/styles';
import { lessonCardAccessibilityLabel, lessonDifficultyLabels, skillLabel } from './lessonLibraryPresentation';
import type { LessonLibraryItem } from './lessonLibraryTypes';
import { LessonStateBadge } from './LessonStateBadge';

type LessonLibraryCardProps = {
  lesson: LessonLibraryItem;
  onPress: () => void;
};

export function LessonLibraryCard({ lesson, onPress }: LessonLibraryCardProps): React.JSX.Element {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={lessonCardAccessibilityLabel(lesson)}
    onPress={onPress}
    style={({ pressed }) => [styles.libraryLessonCard, pressed && styles.pressed]}
  >
    <View style={styles.libraryLessonTopRow}>
      <Text style={styles.librarySkillLabel}>{skillLabel(lesson.skill)}</Text>
      <LessonStateBadge state={lesson.state} />
    </View>
    <Text style={styles.libraryLessonTitle}>{lesson.title}</Text>
    <Text style={styles.libraryLessonDescription}>{lesson.description}</Text>
    <View style={styles.libraryMetadataRow}>
      <Text style={styles.libraryMetadataText}>{lessonDifficultyLabels[lesson.difficulty]}</Text>
      <Text style={styles.libraryMetadataDot}>•</Text>
      <Text style={styles.libraryMetadataText}>{lesson.estimatedMinutes} min</Text>
    </View>
    {lesson.state === 'LOCKED' ? <View style={styles.libraryLockNotice}><Text style={styles.libraryLockLabel}>PREREQUISITE</Text><Text style={styles.libraryLockText}>{lesson.lock.reason}</Text></View> : null}
    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.libraryCardAction}>View summary ›</Text>
  </Pressable>;
}
