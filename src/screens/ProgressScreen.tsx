import { useCallback, useEffect, useState } from 'react';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { IdentityHeader } from '../components/IdentityHeader';
import { LoadingState } from '../components/LoadingState';
import { Metric } from '../components/Metric';
import { SectionHeader } from '../components/SectionHeader';
import { buildTrainingIntelligence, type TrainingIntelligence } from '../domain/behaviour/TrainingIntelligence';
import { DogLearningPassportError } from '../features/progress/passport/DogLearningPassportError';
import type { DogLearningPassport } from '../features/progress/passport/DogLearningPassportTypes';
import { PassportSkillCard } from '../features/progress/passport/PassportSkillCard';
import { PassportTimeline } from '../features/progress/passport/PassportTimeline';
import { useDogLearningPassport } from '../features/progress/passport/useDogLearningPassport';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../services/AdaptiveTrainingPersistenceService';
import { referenceScreenStyles } from '../theme/referenceStyles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Progress'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

const skillLabel = (skillId: string) => skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function ProgressScreen({ navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const dogName = dog?.name ?? 'My Dog';
  const { passport, loading, error, retry } = useDogLearningPassport();
  const [adaptiveIntel, setAdaptiveIntel] = useState<TrainingIntelligence | null>(null);

  const loadAdaptive = useCallback(async () => {
    if (!dog) {
      setAdaptiveIntel(null);
      return;
    }
    try {
      const [memory, history] = await Promise.all([
        loadAdaptiveTrainingMemory(dog.id),
        loadAdaptiveSessionHistory(dog.id),
      ]);
      setAdaptiveIntel(buildTrainingIntelligence(memory, history));
    } catch {
      setAdaptiveIntel(null);
    }
  }, [dog]);

  useEffect(() => { void loadAdaptive(); }, [loadAdaptive]);

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
      <IdentityHeader />

      <View style={referenceScreenStyles.pageHeader}>
        <Text accessibilityRole="header" style={referenceScreenStyles.pageTitle}>Learning Passport</Text>
        <Text style={referenceScreenStyles.pageSubtitle}>
          A private evidence record of what {dogName} has practised, where it worked, and what should come next.
        </Text>
      </View>

      {loading ? <LoadingState message={`Building ${dogName}'s Learning Passport...`} /> : null}
      {!loading && error ? <ErrorState message={passportErrorMessage(error)} onRetry={retry} /> : null}
      {!loading && !error && passport ? <>
          <PassportSnapshot dogName={dogName} passport={passport} />

          {adaptiveIntel && adaptiveIntel.totalSessions > 0 ? (
            <View style={referenceScreenStyles.cardSelected}>
              <SectionHeader
                eyebrow="COACHED EVIDENCE"
                title={`${adaptiveIntel.totalSessions} adaptive session${adaptiveIntel.totalSessions === 1 ? '' : 's'} analysed`}
                supportingText={adaptiveIntel.strongestSkillId
                  ? `Strongest current coached evidence: ${skillLabel(adaptiveIntel.strongestSkillId)}.${adaptiveIntel.watchSkillId ? ` Watch priority: ${skillLabel(adaptiveIntel.watchSkillId)}.` : ''}`
                  : 'Coached rep evidence is being collected.'}
              />
              <View style={referenceScreenStyles.statRow}>
                <Metric value={adaptiveIntel.skills.length} label="Skills" />
                <Metric value={adaptiveIntel.skills.filter((skill) => skill.direction === 'improving').length} label="Improving" />
                <Metric value={adaptiveIntel.warnings.length} label="Warnings" />
              </View>
              <AppButton title="Open Training Intelligence" onPress={() => navigation.navigate('TrainingIntelligence')} />
            </View>
          ) : null}

          <View style={referenceScreenStyles.cardSelected}>
            <SectionHeader
              eyebrow="NEXT SAFEST STEP"
              title={passport.nextStep.title}
              supportingText={passport.nextStep.reason}
            />
            <AppButton title={passport.nextStep.title} onPress={() => openNextStep(passport)} />
          </View>

          <View style={{ gap: 10 }}>
            <SectionHeader
              eyebrow="SKILL EVIDENCE"
              title="What the record supports"
              supportingText="Reliability appears only when it was explicitly reported in a named environment."
            />
            <View accessibilityRole="list" style={referenceScreenStyles.listGap}>
              {passport.skills.map((record) => <PassportSkillCard key={record.skill} record={record} />)}
            </View>
          </View>

          <View style={{ gap: 10 }}>
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

          {(!adaptiveIntel || adaptiveIntel.totalSessions === 0) ? (
            <View style={referenceScreenStyles.cardSelected}>
              <SectionHeader
                eyebrow="ADAPTIVE INTELLIGENCE"
                title="See what is changing over time"
                supportingText="Complete coached sessions to compare recent reps with earlier sessions, spot regression, cue repetition, correction rates and stress-tagged evidence."
              />
              <AppButton title="Open Training Intelligence" onPress={() => navigation.navigate('TrainingIntelligence')} />
            </View>
          ) : null}

          <View style={referenceScreenStyles.card}>
            <SectionHeader
              eyebrow="FULL JOURNAL"
              title="Training history"
              supportingText="Review every completed guided session, outcome, rating range, and saved note."
            />
            <AppButton title="View session history" onPress={() => navigation.navigate('SessionHistory')} />
          </View>

          <View style={referenceScreenStyles.card}>
            <Text accessibilityRole="header" style={referenceScreenStyles.blockTitle}>How Passport evidence works</Text>
            <Text style={referenceScreenStyles.blockIntro}>
              A successful lesson shows useful progress, not mastery. “Reliable here” is reserved for an explicit
              reliable result and always names the recorded environment.
            </Text>
            <AppButton variant="secondary" title="Browse the Academy" onPress={() => navigation.navigate('Academy')} />
          </View>
        </> : null}
    </AppScreen>
  );
}

function PassportSnapshot({ dogName, passport }: { readonly dogName: string; readonly passport: DogLearningPassport }): React.JSX.Element {
  const reliableSkills = passport.skills.filter((record) => record.evidenceLevel === 'reliable').length;
  const growingSkills = passport.skills.filter((record) => record.evidenceLevel === 'growing').length;
  return (
    <View style={{ gap: 10 }}>
      <SectionHeader
        eyebrow="PASSPORT SNAPSHOT"
        title={`${dogName}'s evidence`}
        supportingText={`${reliableSkills} environment-specific reliable skills and ${growingSkills} growing skills recorded so far.`}
      />
      <View style={referenceScreenStyles.statRow}>
        <Metric value={passport.snapshot.completedLessons} label="Lessons" />
        <Metric value={passport.snapshot.completedSessions} label="Sessions" />
        <Metric value={passport.snapshot.trainingMinutes} label="Minutes" />
      </View>
      <Text style={referenceScreenStyles.meta}>
        {passport.snapshot.recordedEnvironments} real-world environments recorded
      </Text>
    </View>
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
