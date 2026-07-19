import { Text } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { LessonCard } from '../components/LessonCard';
import { lessons } from '../data/lessons';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';

export function AcademyScreen(): React.JSX.Element {
  const { completed, completeLesson } = useAppState();

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>ACADEMY</Text>
      <Text style={styles.pageTitle}>Training courses</Text>
      <Text style={styles.body}>Four lessons are included in this stable test build.</Text>
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          completed={completed.includes(lesson.id)}
          onComplete={() => completeLesson(lesson.id)}
        />
      ))}
    </AppScreen>
  );
}
