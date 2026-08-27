import { Text, View } from 'react-native';

import { LessonThumbnail } from '../../../components/LessonThumbnail';
import { PremiumCard } from '../../../components/PremiumCard';
import { styles } from '../../../theme/styles';
import { lessonCardAccessibilityLabel, lessonDifficultyLabels, skillLabel } from './lessonLibraryPresentation';
import type { LessonLibraryItem } from './lessonLibraryTypes';
import { LessonStateBadge } from './LessonStateBadge';

type LessonLibraryCardProps = {
  lesson: LessonLibraryItem;
  allowLockedSelection?: boolean;
  onPress: () => void;
};

export function LessonLibraryCard({ lesson, allowLockedSelection = false, onPress }: LessonLibraryCardProps): React.JSX.Element {
  const selfDirectedLockedLesson = lesson.state === 'LOCKED' && allowLockedSelection;

  return <PremiumCard
    accessibilityLabel={lessonCardAccessibilityLabel(lesson, allowLockedSelection)}
    onPress={onPress}
    tone={lesson.state === 'LOCKED' && !selfDirectedLockedLesson ? 'default' : 'elevated'}
    style={styles.libraryLessonCard}
  >
    <View style={styles.libraryLessonVisualRow}>
      <LessonThumbnail
        decorative
        lessonId={lesson.id}
        skill={lesson.skill}
        lessonTitle={lesson.title}
      />
      <View style={styles.libraryLessonCopy}>
        <View style={styles.libraryLessonTopRow}>
          <Text style={styles.librarySkillLabel}>{skillLabel(lesson.skill)}</Text>
          {selfDirectedLockedLesson ? (
            <View style={[styles.libraryStateBadge, styles.libraryStateAvailable]}>
              <Text style={styles.libraryStateText}>Self-directed</Text>
            </View>
          ) : <LessonStateBadge state={lesson.state} />}
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
    {lesson.state === 'LOCKED' ? (
      <View style={selfDirectedLockedLesson ? styles.librarySelfDirectedNotice : styles.libraryLockNotice}>
        <Text style={selfDirectedLockedLesson ? styles.librarySelfDirectedLabel : styles.libraryLockLabel}>
          {selfDirectedLockedLesson ? 'RECOMMENDED ORDER' : 'PREREQUISITE'}
        </Text>
        <Text style={selfDirectedLockedLesson ? styles.librarySelfDirectedText : styles.libraryLockText}>
          {selfDirectedLockedLesson ? `${lesson.lock.reason} You can choose this lesson now.` : lesson.lock.reason}
        </Text>
      </View>
    ) : null}
    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.libraryCardAction}>
      {selfDirectedLockedLesson ? 'Choose lesson ›' : 'View summary ›'}
    </Text>
  </PremiumCard>;
}
