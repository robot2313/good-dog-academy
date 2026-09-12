import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { IdentityHeader } from '../components/IdentityHeader';
import { LoadingState } from '../components/LoadingState';
import { Metric } from '../components/Metric';
import { SectionHeader } from '../components/SectionHeader';
import { buildWeeklyTrainerReview, type WeeklyTrainerReview } from '../domain/analytics/WeeklyTrainerReview';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../services/AdaptiveTrainingPersistenceService';
import { referenceScreenStyles } from '../theme/referenceStyles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyTrainerReview'>;

const skillLabel = (skillId: string | null) => skillId ? skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Collect more evidence';
const percent = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;

export function WeeklyTrainerReviewScreen({ navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [review, setReview] = useState<WeeklyTrainerReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!dog) {
      setReview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [memory, history] = await Promise.all([
        loadAdaptiveTrainingMemory(dog.id),
        loadAdaptiveSessionHistory(dog.id),
      ]);
      setReview(buildWeeklyTrainerReview(memory, history, new Date().toISOString()));
    } catch {
      setError('Weekly Trainer Review could not read the saved adaptive training record safely.');
    } finally {
      setLoading(false);
    }
  }, [dog]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppScreen>
      <IdentityHeader />
      <View style={referenceScreenStyles.pageHeader}>
        <Text accessibilityRole="header" style={referenceScreenStyles.pageTitle}>Weekly Trainer Review</Text>
        <Text style={referenceScreenStyles.pageSubtitle}>A trainer-style summary of the last seven days, grounded in saved coached-session evidence.</Text>
      </View>

      {loading ? <LoadingState message="Reviewing the last seven days…" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}

      {!loading && !error && review ? <>
        <View style={referenceScreenStyles.cardSelected}>
          <SectionHeader eyebrow="THIS WEEK" title={review.headline} supportingText={review.summary} />
          <View style={referenceScreenStyles.statRow}>
            <Metric value={review.sessionsThisWeek} label="Sessions" />
            <Metric value={review.totalRepsThisWeek} label="Reps" />
            <Metric value={percent(review.averageCleanRepRate)} label="Clean" />
          </View>
          <Text style={referenceScreenStyles.meta}>Training state: {review.state.toUpperCase()} · Focus: {skillLabel(review.focusSkillId)}</Text>
        </View>

        {review.wins.length ? <View style={referenceScreenStyles.card}>
          <SectionHeader eyebrow="WINS" title="What improved or held up" supportingText="Positive evidence is reported only when the saved record supports it." />
          {review.wins.map((item) => <Text key={item} style={referenceScreenStyles.blockIntro}>• {item}</Text>)}
        </View> : null}

        {review.watchouts.length ? <View style={review.state === 'recover' ? referenceScreenStyles.noticeAlert : referenceScreenStyles.card}>
          <SectionHeader eyebrow="WATCHOUTS" title="What deserves attention" supportingText="Comfort and evidence quality override progression." />
          {review.watchouts.map((item) => <Text key={item} style={review.state === 'recover' ? referenceScreenStyles.noticeAlertBody : referenceScreenStyles.blockIntro}>• {item}</Text>)}
        </View> : null}

        <View style={referenceScreenStyles.cardSelected}>
          <SectionHeader eyebrow="NEXT WEEK" title="Trainer recommendation" supportingText={review.nextWeekRecommendation} />
          <AppButton title="Open Adaptive 7-Day Program" onPress={() => navigation.navigate('AdaptiveProgram')} />
          <AppButton variant="secondary" title="Open Training Intelligence" onPress={() => navigation.navigate('TrainingIntelligence')} />
          <AppButton variant="secondary" title="Open Behaviour Timeline" onPress={() => navigation.navigate('BehaviourTimeline')} />
        </View>

        <View style={referenceScreenStyles.card}>
          <Text style={referenceScreenStyles.meta}>{review.evidenceNote}</Text>
        </View>
      </> : null}
    </AppScreen>
  );
}
