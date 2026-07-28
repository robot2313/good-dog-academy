import { Text, View } from 'react-native';

import { LessonThumbnail } from '../../../components/LessonThumbnail';
import { PremiumCard } from '../../../components/PremiumCard';
import { styles } from '../../../theme/styles';
import { lessonCardAccessibilityLabel, lessonDifficultyLabels, skillLabel } from './lessonLibraryPresentation';
import type { LessonLibraryItem } from './lessonLibraryTypes';
import { LessonStateBadge } from './LessonStateBadge';

type LessonLibraryCardProps = {
  lesson: LessonLibraryItem;
  onPress: () => void;
};

export function LessonLibraryCard({ lesson, onPress }: LessonLibraryCardProps): React.JSX.Element {
  return <PremiumCard
    accessibilityLabel={lessonCardAccessibilityLabel(lesson)}
    onPress={onPress}
    tone={lesson.state === 'LOCKED' ? 'default' : 'elevated'}
    style={styles.libraryLessonCard}
  >
    <View style={styles.libraryLessonVisualRow}>
      <LessonThumbnail
        decorative
        skill={lesson.skill}
        lessonTitle={lesson.title}
      />
      <View style={styles.libraryLessonCopy}>
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
      </View>
    </View>
    {lesson.state === 'LOCKED' ? <View style={styles.libraryLockNotice}><Text style={styles.libraryLockLabel}>PREREQUISITE</Text><Text style={styles.libraryLockText}>{lesson.lock.reason}</Text></View> : null}
    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.libraryCardAction}>View summary ›</Text>
  </PremiumCard>;
}
