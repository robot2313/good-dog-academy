import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { lessons } from '../data/lessons';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';

export function ProgressScreen(): React.JSX.Element {
  const { completed, progress } = useAppState();

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>TRAINING INTELLIGENCE</Text>
      <Text style={styles.pageTitle}>Progress</Text>
      <View style={styles.progressHero}>
        <Text style={styles.progressValue}>{progress}%</Text>
        <Text style={styles.progressLabel}>Foundation completed</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Completed lessons</Text>
        {lessons.map((lesson) => (
          <View key={lesson.id} style={styles.progressRow}>
            <Text style={styles.body}>{lesson.title}</Text>
            <Text style={completed.includes(lesson.id) ? styles.completeText : styles.notStartedText}>
              {completed.includes(lesson.id) ? 'Completed' : 'Not started'}
            </Text>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}
