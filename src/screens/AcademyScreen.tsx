import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { LessonCard } from '../components/LessonCard';
import type { BehaviourSkill } from '../domain/models';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { styles } from '../theme/styles';

const catalogue = loadBundledLessonCatalogue();

export function AcademyScreen(): React.JSX.Element {
  const { records, error, completeLesson } = useLessonProgress();
  const [skill, setSkill] = useState<BehaviourSkill | 'all'>('all');
  const lessons = catalogue.definitions.filter((lesson) => lesson.isActive);
  const skills = [...new Set(lessons.map((lesson) => lesson.skill))];
  const visibleLessons = lessons.filter((lesson) => skill === 'all' || lesson.skill === skill);

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>ACADEMY</Text>
      <Text style={styles.pageTitle}>Training courses</Text>
      <Text style={styles.body}>Thirty force-free lessons, organised into clear three-stage learning paths.</Text>
      {error ? <View style={styles.errorCard}><Text style={styles.body}>{error}</Text></View> : null}
      <View style={styles.filterRow}>
        {(['all', ...skills] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: skill === option }}
            onPress={() => setSkill(option)}
            style={[styles.filterChip, skill === option && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, skill === option && styles.filterChipTextActive]}>
              {option === 'all' ? 'All skills' : option.replaceAll('-', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.resultsText}>{visibleLessons.length} lessons</Text>
      {visibleLessons.map((lesson) => {
        const status = records.find((record) => record.lessonId === lesson.id)?.status ?? 'locked';
        const prerequisiteTitles = lesson.prerequisites.map((prerequisite) => catalogue.findById(prerequisite.lessonId)?.title).filter(Boolean);
        return <LessonCard
          key={lesson.id}
          lesson={lesson}
          status={status}
          lockedMessage={prerequisiteTitles.length > 0 ? `Complete ${prerequisiteTitles.join(' and ')} first.` : undefined}
          onComplete={(rating) => void completeLesson(lesson.id, rating)}
        />;
      })}
    </AppScreen>
  );
}
