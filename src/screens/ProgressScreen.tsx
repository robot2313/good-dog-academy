import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { styles } from '../theme/styles';

export function ProgressScreen(): React.JSX.Element {
  const { records } = useLessonProgress();
  const completed = records.filter((record) => record.status === 'completed').map((record) => record.lessonId);
  const progress = records.length === 0 ? 0 : Math.round((completed.length / records.length) * 100);
  const lessons = loadBundledLessonCatalogue().definitions.filter((lesson) => lesson.isActive);
  const skills = [...new Set(lessons.map((lesson) => lesson.skill))];

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>TRAINING INTELLIGENCE</Text>
      <Text style={styles.pageTitle}>Progress</Text>
      <View style={styles.progressHero}>
        <Text style={styles.progressValue}>{progress}%</Text>
        <Text style={styles.progressLabel}>{completed.length} of {lessons.length} lessons completed</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Skills</Text>
        {skills.map((skill) => {
          const skillLessons = lessons.filter((lesson) => lesson.skill === skill);
          const completedCount = skillLessons.filter((lesson) => completed.includes(lesson.id)).length;
          return (
            <View key={skill} style={styles.progressRow}>
              <Text style={styles.progressSkillName}>{skill.replaceAll('-', ' ')}</Text>
              <Text style={completedCount > 0 ? styles.completeText : styles.notStartedText}>{completedCount}/{skillLessons.length}</Text>
            </View>
          );
        })}
      </View>
    </AppScreen>
  );
}
