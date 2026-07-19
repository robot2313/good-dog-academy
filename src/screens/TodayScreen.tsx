import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { LessonCard } from '../components/LessonCard';
import { Metric } from '../components/Metric';
import { useIncompleteLessons } from '../hooks/useIncompleteLessons';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';

export function TodayScreen(): React.JSX.Element {
  const { profile, completed, progress, completeLesson } = useAppState();
  const recommendedLessons = useIncompleteLessons(2);

  return (
    <AppScreen>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.eyebrow}>TODAY'S PRIVATE PLAN</Text>
            <Text style={styles.heroDogName}>{profile.name || 'My Dog'}</Text>
          </View>
          <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>OWNER</Text></View>
        </View>
        <Text style={styles.heroTitle}>One focused session today.</Text>
        <Text style={styles.heroBody}>Build reliability in short, successful sessions instead of overwhelming your dog.</Text>
        <View style={styles.metricRow}>
          <Metric value={completed.length} label="completed" />
          <Metric value={`${progress}%`} label="academy" />
          <Metric value={4} label="lessons" />
        </View>
      </View>
      <Text style={styles.eyebrowDark}>RECOMMENDED NEXT</Text>
      {recommendedLessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} completed={false} onComplete={() => completeLesson(lesson.id)} />
      ))}
    </AppScreen>
  );
}
