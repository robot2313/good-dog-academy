import { useCallback, useEffect, useState } from 'react';
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
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../services/AdaptiveTrainingPersistenceService';
import { referenceScreenStyles } from '../theme/referenceStyles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TrainingIntelligence'>;

const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const label = (skillId: string) => skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function TrainingIntelligenceScreen({ navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [intel, setIntel] = useState<TrainingIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!dog) {
      setIntel(null);
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
      setIntel(buildTrainingIntelligence(memory, history));
    } catch {
      setError('Training Intelligence could not read the saved adaptive training record safely.');
    } finally {
      setLoading(false);
    }
  }, [dog]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppScreen>
      <IdentityHeader />
      <View style={referenceScreenStyles.pageHeader}>
        <Text accessibilityRole="header" style={referenceScreenStyles.pageTitle}>Training Intelligence</Text>
        <Text style={referenceScreenStyles.pageSubtitle}>
          Long-term patterns from coached reps, corrections and changing performance — not just lesson completion.
        </Text>
      </View>

      {loading ? <LoadingState message="Reading training patterns..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}

      {!loading && !error && intel ? <>
        <View style={referenceScreenStyles.cardSelected}>
          <SectionHeader eyebrow="LONG-TERM SNAPSHOT" title={`${intel.totalSessions} coached session${intel.totalSessions === 1 ? '' : 's'}`} supportingText={intel.strongestSkillId ? `Strongest current evidence: ${label(intel.strongestSkillId)}. Watch priority: ${label(intel.watchSkillId ?? intel.strongestSkillId)}.` : 'Complete coached sessions to build longitudinal intelligence.'} />
          <View style={referenceScreenStyles.statRow}>
            <Metric value={intel.skills.length} label="Skills" />
            <Metric value={intel.skills.filter((skill) => skill.direction === 'improving').length} label="Improving" />
            <Metric value={intel.warnings.length} label="Warnings" />
          </View>
          <AppButton title="Open Adaptive 7-Day Program" onPress={() => navigation.navigate('AdaptiveProgram')} />
          <AppButton variant="secondary" title="Open Behaviour Timeline" onPress={() => navigation.navigate('BehaviourTimeline')} />
        </View>

        {intel.warnings.length ? <View style={referenceScreenStyles.card}>
          <SectionHeader eyebrow="EARLY WARNINGS" title="What deserves attention" supportingText="Evidence signals only — these are not medical or behavioural diagnoses." />
          {intel.warnings.map((warning) => <Text key={warning} style={referenceScreenStyles.blockIntro}>• {warning}</Text>)}
        </View> : null}

        <View style={{ gap: 10 }}>
          <SectionHeader eyebrow="SKILL TRENDS" title="What is actually changing" supportingText="Recent coached sessions are compared with earlier evidence when enough data exists." />
          {intel.skills.map((skill) => <View key={skill.skillId} style={referenceScreenStyles.card}>
            <Text style={referenceScreenStyles.blockTitle}>{label(skill.skillId)}</Text>
            <Text style={referenceScreenStyles.meta}>{skill.direction.replace('-', ' ').toUpperCase()} · recent clean {pct(skill.recentCleanRate)}{skill.delta === null ? '' : ` · ${skill.delta >= 0 ? '+' : ''}${Math.round(skill.delta * 100)} pts`}</Text>
            <Text style={referenceScreenStyles.blockIntro}>{skill.recommendation}</Text>
            <Text style={referenceScreenStyles.meta}>Cue repeats {pct(skill.cueRepeatRate)} · Slow responses {pct(skill.slowResponseRate)} · Stress-tagged {pct(skill.stressSignalRate)} · Owner corrections {pct(skill.correctedRepRate)}</Text>
          </View>)}
        </View>

        <View style={referenceScreenStyles.card}>
          <SectionHeader eyebrow="EVIDENCE JOURNAL" title="Learning Passport" supportingText="Open the evidence record behind the trends and next-step recommendations." />
          <AppButton title="Open Learning Passport" onPress={() => navigation.navigate('Main', { screen: 'Progress' })} />
        </View>
      </> : null}
    </AppScreen>
  );
}
