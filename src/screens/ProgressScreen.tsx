import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { AppButton } from '../components/AppButton';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { Metric } from '../components/Metric';
import { PremiumCard } from '../components/PremiumCard';
import { SectionHeader } from '../components/SectionHeader';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Progress'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function ProgressScreen({ navigation }: Props): React.JSX.Element {
  const dog = getOnboardingDog();
  const { progressRecords } = useLessonLibraryData();
  const dogName = dog?.name ?? 'My Dog';
  const photoUri = dog?.photoUri ?? null;
  const snapshot = progressRecords.reduce(
    (totals, record) => ({
      completedLessons: totals.completedLessons + Number(record.status === 'completed'),
      activeLessons: totals.activeLessons + Number(record.status === 'inProgress'),
      totalSessions: totals.totalSessions + Math.max(0, record.attempts),
    }),
    { completedLessons: 0, activeLessons: 0, totalSessions: 0 },
  );

  return (
    <AppScreen>
      <DogIdentityHero
        dogName={dogName}
        photoUri={photoUri}
        eyebrow="TRAINING INTELLIGENCE"
        title="Progress"
        supportingText="Your completed guided sessions are saved per dog and form the reliable record of your training."
        size="standard"
      />
      <PremiumCard tone="forest" style={styles.progressSnapshotCard}>
        <SectionHeader
          inverse
          eyebrow="TRAINING SNAPSHOT"
          title={`${dogName}'s momentum`}
          supportingText="A clear view of the work you have built together."
        />
        <View style={styles.metricRow}>
          <Metric value={snapshot.completedLessons} label="Completed" />
          <Metric value={snapshot.activeLessons} label="In progress" />
          <Metric value={snapshot.totalSessions} label="Sessions" />
        </View>
      </PremiumCard>
      <PremiumCard tone="elevated">
        <SectionHeader
          eyebrow="YOUR JOURNAL"
          title="Training history"
          supportingText="Review guided sessions, outcomes, ratings, and the notes that tell your training story."
        />
        <AppButton
          title="View session history"
          onPress={() => navigation.navigate('SessionHistory')}
        />
      </PremiumCard>
      <PremiumCard>
        <SectionHeader
          eyebrow="NEXT STEP"
          title="Continue training"
          supportingText="Open the Academy to review progress and choose another available skill."
        />
        <AppButton
          variant="secondary"
          title="Browse the Academy"
          onPress={() => navigation.navigate('Academy')}
        />
      </PremiumCard>
    </AppScreen>
  );
}


function getOnboardingDog() {
  try {
    const { status } = useOnboarding();
    return status?.state === 'complete' ? status.dog : null;
  } catch {
    return null;
  }
}
