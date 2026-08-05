import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppScreen } from '../components/AppScreen';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Metric } from '../components/Metric';
import { PremiumCard } from '../components/PremiumCard';
import { SectionHeader } from '../components/SectionHeader';
import { DogLearningPassportError } from '../features/progress/passport/DogLearningPassportError';
import type { DogLearningPassport } from '../features/progress/passport/DogLearningPassportTypes';
import { PassportSkillCard } from '../features/progress/passport/PassportSkillCard';
import { PassportTimeline } from '../features/progress/passport/PassportTimeline';
import { useDogLearningPassport } from '../features/progress/passport/useDogLearningPassport';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { colorTokens, spacingTokens, typographyTokens } from '../theme/tokens';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Progress'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function ProgressScreen({ navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const dogName = dog?.name ?? 'My Dog';
  const photoUri = dog?.photoUri ?? null;
  const { passport, loading, error, retry } = useDogLearningPassport();

  const openNextStep = (current: DogLearningPassport) => {
    if (current.nextStep.kind === 'lesson' && current.nextStep.lessonId) {
      navigation.navigate('LessonSummary', { lessonId: current.nextStep.lessonId });
      return;
    }
    if (current.nextStep.kind === 'help-now') {
      navigation.navigate('Troubleshooter', { mode: 'help-now' });
      return;
    }
    navigation.navigate('Academy');
  };

  return (
    <AppScreen>
      <DogIdentityHero
        dogName={dogName}
        photoUri={photoUri}
        eyebrow="TRAINING INTELLIGENCE"
        title="Learning Passport"
        supportingText={`A private evidence record of what ${dogName} has practised, where it worked, and what should come next.`}
        size="standard"
      />

      {loading ? <LoadingState message={`Building ${dogName}'s Learning Passport...`} /> : null}
      {!loading && error ? <ErrorState message={passportErrorMessage(error)} onRetry={retry} /> : null}
      {!loading && !error && passport ? <>
          <PassportSnapshot dogName={dogName} passport={passport} />

          <PremiumCard tone="selected">
            <SectionHeader
              eyebrow="NEXT SAFEST STEP"
              title={passport.nextStep.title}
              supportingText={passport.nextStep.reason}
            />
            <AppButton title={passport.nextStep.title} onPress={() => openNextStep(passport)} />
          </PremiumCard>

          <View style={componentStyles.section}>
            <SectionHeader
              eyebrow="SKILL EVIDENCE"
              title="What the record supports"
              supportingText="Reliability appears only when it was explicitly reported in a named environment."
            />
            <View accessibilityRole="list" style={componentStyles.list}>
              {passport.skills.map((record) => <PassportSkillCard key={record.skill} record={record} />)}
            </View>
          </View>

          <View style={componentStyles.section}>
            <SectionHeader
              eyebrow="TRAINING STORY"
              title="Recent evidence"
              supportingText="Guided sessions and real-world Help Me Now results, newest first."
            />
            <PassportTimeline
              items={passport.timeline}
              onOpenSession={(sessionId) => navigation.navigate('SessionDetail', { sessionId })}
            />
          </View>

          <PremiumCard tone="elevated">
            <SectionHeader
              eyebrow="FULL JOURNAL"
              title="Training history"
              supportingText="Review every completed guided session, outcome, rating range, and saved note."
            />
            <AppButton title="View session history" onPress={() => navigation.navigate('SessionHistory')} />
          </PremiumCard>

          <PremiumCard>
            <Text accessibilityRole="header" style={componentStyles.evidenceTitle}>How Passport evidence works</Text>
            <Text style={componentStyles.evidenceText}>A successful lesson shows useful progress, not mastery. “Reliable here” is reserved for an explicit reliable result and always names the recorded environment.</Text>
            <AppButton variant="secondary" title="Browse the Academy" onPress={() => navigation.navigate('Academy')} />
          </PremiumCard>
        </> : null}
    </AppScreen>
  );
}

function PassportSnapshot({ dogName, passport }: { readonly dogName: string; readonly passport: DogLearningPassport }): React.JSX.Element {
  const reliableSkills = passport.skills.filter((record) => record.evidenceLevel === 'reliable').length;
  const growingSkills = passport.skills.filter((record) => record.evidenceLevel === 'growing').length;
  return (
    <PremiumCard tone="forest" style={styles.progressSnapshotCard}>
      <SectionHeader
        inverse
        eyebrow="PASSPORT SNAPSHOT"
        title={`${dogName}'s evidence`}
        supportingText={`${reliableSkills} environment-specific reliable skills and ${growingSkills} growing skills recorded so far.`}
      />
      <View style={styles.metricRow}>
        <Metric value={passport.snapshot.completedLessons} label="Lessons" />
        <Metric value={passport.snapshot.completedSessions} label="Sessions" />
        <Metric value={passport.snapshot.trainingMinutes} label="Minutes" />
      </View>
      <Text style={componentStyles.snapshotFootnote}>
        {passport.snapshot.recordedEnvironments} real-world environments recorded
      </Text>
    </PremiumCard>
  );
}

function passportErrorMessage(error: DogLearningPassportError): string {
  if (error.code === 'CORRUPT_STORED_DATA') {
    return 'The Learning Passport could not read the saved record safely. No training data was changed.';
  }
  if (error.code === 'DOG_NOT_FOUND' || error.code === 'OWNER_NOT_FOUND' || error.code === 'DOG_OWNERSHIP_MISMATCH') {
    return 'The Learning Passport is not available for the selected dog.';
  }
  return 'The Learning Passport could not be loaded. Please try again.';
}

const componentStyles = StyleSheet.create({
  section: { gap: spacingTokens.md },
  list: { gap: spacingTokens.sm },
  snapshotFootnote: { ...typographyTokens.caption, color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
  evidenceTitle: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
  evidenceText: { ...typographyTokens.body, color: colorTokens.text.secondary },
});
