import { Text, View } from 'react-native';

import { styles } from '../theme/styles';
import type { Lesson } from '../types/domain';
import { PrimaryButton } from './PrimaryButton';

type LessonCardProps = {
  lesson: Lesson;
  completed: boolean;
  onComplete: () => void;
};

export function LessonCard({ lesson, completed, onComplete }: LessonCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.lessonTopRow}>
        <View style={styles.coursePill}>
          <Text style={styles.coursePillText}>{lesson.course.toUpperCase()}</Text>
        </View>
        <Text style={styles.duration}>{lesson.duration} MIN</Text>
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.body}>{lesson.summary}</Text>
      {completed
        ? <View style={styles.completedBadge}><Text style={styles.completedBadgeText}>✓ Completed</Text></View>
        : <PrimaryButton title="Complete test lesson" onPress={onComplete} />}
    </View>
  );
}
