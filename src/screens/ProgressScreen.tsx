import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { lessons } from '../data/lessons';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Progress'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function ProgressScreen({ navigation }: Props): React.JSX.Element {
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
      <View style={styles.progressHistoryCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Training history</Text>
        <Text style={styles.body}>Review completed guided sessions, outcomes, rating ranges, and saved notes.</Text>
        <PrimaryButton
          title="View session history"
          onPress={() => navigation.navigate('SessionHistory')}
        />
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
