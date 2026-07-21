import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { LessonCard } from '../components/LessonCard';
import { Metric } from '../components/Metric';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { useDailyPlan } from '../features/dailyPlan/DailyPlanContext';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';

export function TodayScreen(): React.JSX.Element {
  const { profile } = useAppState();
  const { records, completeLesson } = useLessonProgress();
  const { plan, loading: planLoading, error: planError } = useDailyPlan();
  const completed = records.filter((record) => record.status === 'completed').map((record) => record.lessonId);
  const progress = records.length === 0 ? 0 : Math.round((completed.length / records.length) * 100);
  const lessons = loadBundledLessonCatalogue().definitions.filter((lesson) => lesson.isActive);
  const recommendedLessons = (plan?.lessonIds ?? [])
    .map((lessonId) => lessons.find((lesson) => lesson.id === lessonId))
    .filter((lesson): lesson is (typeof lessons)[number] => Boolean(lesson));

  return (
    <AppScreen>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.eyebrow}>TODAY&apos;S PRIVATE PLAN</Text>
            <Text style={styles.heroDogName}>{profile.name || 'My Dog'}</Text>
          </View>
          <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>OWNER</Text></View>
        </View>
        <Text style={styles.heroTitle}>One focused session today.</Text>
        <Text style={styles.heroBody}>Build reliability in short, successful sessions instead of overwhelming your dog.</Text>
        <View style={styles.metricRow}>
          <Metric value={completed.length} label="completed" />
          <Metric value={`${progress}%`} label="academy" />
          <Metric value={lessons.length} label="lessons" />
        </View>
      </View>
      <Text style={styles.eyebrowDark}>RECOMMENDED NEXT</Text>
      {planLoading ? <Text style={styles.body}>Preparing today’s personalised plan…</Text> : null}
      {planError ? <View style={styles.errorCard}><Text style={styles.body}>{planError}</Text></View> : null}
      {recommendedLessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} completed={false} onComplete={(rating) => void completeLesson(lesson.id, rating)} />
      ))}
      {!planLoading && !planError && recommendedLessons.length === 0 ? (
        <View style={styles.card}><Text style={styles.sectionTitle}>Foundation complete</Text><Text style={styles.body}>Explore the Academy for your next developing lesson.</Text></View>
      ) : null}
    </AppScreen>
  );
}
