import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { LessonCard } from '../components/LessonCard';
import type { BehaviourSkill } from '../domain/models';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { styles } from '../theme/styles';

export function AcademyScreen(): React.JSX.Element {
  const { records, completeLesson } = useLessonProgress();
  const [skill, setSkill] = useState<BehaviourSkill | 'all'>('all');
  const lessons = loadBundledLessonCatalogue().definitions.filter((lesson) => lesson.isActive);
  const skills = [...new Set(lessons.map((lesson) => lesson.skill))];
  const visibleLessons = lessons.filter((lesson) => skill === 'all' || lesson.skill === skill);

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>ACADEMY</Text>
      <Text style={styles.pageTitle}>Training courses</Text>
      <Text style={styles.body}>Thirty force-free lessons, organised into clear three-stage learning paths.</Text>
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
      {visibleLessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          completed={records.find((record) => record.lessonId === lesson.id)?.status === 'completed'}
          onComplete={() => void completeLesson(lesson.id)}
        />
      ))}
    </AppScreen>
  );
}
