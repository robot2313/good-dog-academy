import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppScreen } from '../components/AppScreen';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { styles } from '../theme/styles';
import { SecondaryTextButton } from '../components/SecondaryTextButton';
import type { RootStackParamList } from '../types/navigation';

const catalogue = loadBundledLessonCatalogue();

export function ProgressScreen(): React.JSX.Element {
  const { records, sessions, summary, achievements } = useLessonProgress();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const completed = records.filter((record) => record.status === 'completed').map((record) => record.lessonId);
  const progress = records.length === 0 ? 0 : Math.round((completed.length / records.length) * 100);
  const lessons = catalogue.definitions.filter((lesson) => lesson.isActive);
  const skills = [...new Set(lessons.map((lesson) => lesson.skill))];

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>TRAINING INTELLIGENCE</Text>
      <Text style={styles.pageTitle}>Progress</Text>
      <View style={styles.progressHero} accessible accessibilityLabel={`${progress}% of lesson paths completed`}>
        <Text style={styles.progressValue}>{progress}%</Text>
        <Text style={styles.progressLabel}>{completed.length} of {lessons.length} lesson paths completed</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
        <View style={styles.insightGrid}>
          <View style={styles.insightMetric}><Text style={styles.insightValue}>{summary?.sessionsCompleted ?? sessions.length}</Text><Text style={styles.insightLabel}>sessions</Text></View>
          <View style={styles.insightMetric}><Text style={styles.insightValue}>{summary?.currentStreakDays ?? 0}</Text><Text style={styles.insightLabel}>day streak</Text></View>
          <View style={styles.insightMetric}><Text style={styles.insightValue}>{summary?.totalTrainingMinutes ?? 0}</Text><Text style={styles.insightLabel}>minutes</Text></View>
        </View>
      </View>

      {achievements.length > 0 ? <View style={styles.card}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement) => <View key={achievement.id} style={styles.achievementRow}>
          <View style={styles.achievementMark}><Text style={styles.achievementMarkText}>★</Text></View>
          <View style={styles.achievementCopy}><Text style={styles.label}>{achievement.title}</Text><Text style={styles.achievementDescription}>{achievement.description}</Text></View>
        </View>)}
      </View> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent training</Text>
        {sessions.length === 0 ? <Text style={styles.body}>Your completed sessions will appear here.</Text> : sessions.slice(0, 5).map((session) => {
          const lesson = catalogue.findById(session.lessonId);
          return <View key={session.id} style={styles.sessionRow}>
            <View style={styles.sessionCopy}><Text style={styles.label}>{lesson?.title ?? 'Training session'}</Text><Text style={styles.sessionMeta}>{session.durationMinutes} min · {session.completedAt?.slice(0, 10)}</Text></View>
            <Text style={session.outcome === 'success' ? styles.completeText : styles.notStartedText}>{session.outcome?.replace('-', ' ')}</Text>
          </View>;
        })}
        {sessions.length > 0 ? <SecondaryTextButton title="View all sessions and notes" onPress={() => navigation.navigate('SessionHistory')} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Skills</Text>
        {skills.map((skill) => {
          const skillLessons = lessons.filter((lesson) => lesson.skill === skill);
          const completedCount = skillLessons.filter((lesson) => completed.includes(lesson.id)).length;
          return <View key={skill} style={styles.progressRow}><Text style={styles.progressSkillName}>{skill.replaceAll('-', ' ')}</Text><Text style={completedCount > 0 ? styles.completeText : styles.notStartedText}>{completedCount}/{skillLessons.length}</Text></View>;
        })}
      </View>
    </AppScreen>
  );
}
