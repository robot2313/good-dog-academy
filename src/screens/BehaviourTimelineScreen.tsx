import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { IdentityHeader } from '../components/IdentityHeader';
import { LoadingState } from '../components/LoadingState';
import { SectionHeader } from '../components/SectionHeader';
import { buildBehaviourTimeline, type BehaviourTimeline } from '../domain/behaviour/BehaviourTimeline';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory } from '../services/AdaptiveTrainingPersistenceService';
import { referenceScreenStyles } from '../theme/referenceStyles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BehaviourTimeline'>;

const skillLabel = (skillId: string) => skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const dateLabel = (value: string) => new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

export function BehaviourTimelineScreen(): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [timeline, setTimeline] = useState<BehaviourTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!dog) {
      setTimeline({ events: [], patterns: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const history = await loadAdaptiveSessionHistory(dog.id);
      setTimeline(buildBehaviourTimeline(history));
    } catch {
      setError('Behaviour Timeline could not read the saved coached-session record safely.');
    } finally {
      setLoading(false);
    }
  }, [dog]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppScreen>
      <IdentityHeader />
      <View style={referenceScreenStyles.pageHeader}>
        <Text accessibilityRole="header" style={referenceScreenStyles.pageTitle}>Behaviour Timeline</Text>
        <Text style={referenceScreenStyles.pageSubtitle}>A chronological evidence record of how coached training is changing — patterns, not diagnoses.</Text>
      </View>

      {loading ? <LoadingState message="Reading behaviour patterns…" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}

      {!loading && !error && timeline ? <>
        {timeline.patterns.length ? <View style={{ gap: 10 }}>
          <SectionHeader eyebrow="PATTERNS" title="What keeps showing up" supportingText="Recent coached sessions are grouped into practical training signals." />
          {timeline.patterns.map((pattern) => (
            <View key={pattern.id} style={pattern.severity === 'safety' ? referenceScreenStyles.noticeAlert : pattern.severity === 'watch' ? referenceScreenStyles.noticeWarn : pattern.severity === 'positive' ? referenceScreenStyles.noticeInfo : referenceScreenStyles.card}>
              <Text style={pattern.severity === 'safety' ? referenceScreenStyles.noticeAlertTitle : pattern.severity === 'watch' ? referenceScreenStyles.noticeWarnTitle : pattern.severity === 'positive' ? referenceScreenStyles.noticeInfoTitle : referenceScreenStyles.blockTitle}>{pattern.title}</Text>
              <Text style={pattern.severity === 'safety' ? referenceScreenStyles.noticeAlertBody : pattern.severity === 'watch' ? referenceScreenStyles.noticeWarnBody : pattern.severity === 'positive' ? referenceScreenStyles.noticeInfoBody : referenceScreenStyles.blockIntro}>{pattern.detail}</Text>
            </View>
          ))}
        </View> : null}

        <View style={{ gap: 10 }}>
          <SectionHeader eyebrow="TIMELINE" title="Session-by-session evidence" supportingText="Newest coached evidence appears first." />
          {timeline.events.length ? timeline.events.map((event) => (
            <View key={event.id} style={referenceScreenStyles.card}>
              <Text style={referenceScreenStyles.meta}>{dateLabel(event.occurredAt)} · {skillLabel(event.skillId)}</Text>
              <Text style={referenceScreenStyles.blockTitle}>{event.title}</Text>
              <Text style={referenceScreenStyles.blockIntro}>{event.detail}</Text>
              <Text style={referenceScreenStyles.meta}>Lesson: {event.lessonId}</Text>
            </View>
          )) : (
            <View style={referenceScreenStyles.emptyCard}>
              <Text style={referenceScreenStyles.emptyTitle}>No coached evidence yet</Text>
              <Text style={referenceScreenStyles.emptyBody}>Complete Camera Coach sessions to build the behaviour timeline.</Text>
            </View>
          )}
        </View>
      </> : null}
    </AppScreen>
  );
}
