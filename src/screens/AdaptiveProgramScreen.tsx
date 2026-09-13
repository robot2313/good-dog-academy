import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { IdentityHeader } from '../components/IdentityHeader';
import { LoadingState } from '../components/LoadingState';
import { SectionHeader } from '../components/SectionHeader';
import { buildAdaptiveTrainingProgram, type AdaptiveTrainingProgram, type ProgramDayMode } from '../domain/training/AdaptiveTrainingProgram';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../services/AdaptiveTrainingPersistenceService';
import { referenceScreenStyles } from '../theme/referenceStyles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AdaptiveProgram'>;

const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

function modeLabel(mode: ProgramDayMode): string {
  if (mode === 'train') return 'Training';
  if (mode === 'refresher') return 'Refresher';
  if (mode === 'recovery') return 'Recovery';
  return 'Rest';
}

export function AdaptiveProgramScreen(_: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [program, setProgram] = useState<AdaptiveTrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!dog) {
      setProgram(null);
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
      setProgram(buildAdaptiveTrainingProgram(memory, history, new Date().toISOString()));
    } catch {
      setError('The adaptive weekly plan could not be built safely from the saved training record.');
    } finally {
      setLoading(false);
    }
  }, [dog]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppScreen>
      <IdentityHeader />
      <View style={referenceScreenStyles.pageHeader}>
        <Text accessibilityRole="header" style={referenceScreenStyles.pageTitle}>Adaptive 7-Day Program</Text>
        <Text style={referenceScreenStyles.pageSubtitle}>
          A weekly plan rebuilt from training evidence. Safety and comfort always override progression.
        </Text>
      </View>

      {loading ? <LoadingState message="Building this week's program..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}

      {!loading && !error && program ? <>
        <View style={referenceScreenStyles.cardSelected}>
          <SectionHeader
            eyebrow="DOG DIGITAL TWIN"
            title={titleCase(program.state)}
            supportingText={program.focusSkillId
              ? `Current focus: ${titleCase(program.focusSkillId)}. The state is a training heuristic based on saved evidence, not a clinical score.`
              : 'Complete coached sessions to give the adaptive planner enough evidence to choose a focus skill.'}
          />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader
            eyebrow="THIS WEEK"
            title="Seven evidence-led days"
            supportingText="Only one challenge variable is increased at a time, and recovery days reduce pressure when safety signals appear."
          />
          {program.days.map((item) => (
            <View key={item.dayIndex} style={referenceScreenStyles.card}>
              <Text style={referenceScreenStyles.blockTitle}>Day {item.dayIndex} · {modeLabel(item.mode)}</Text>
              <Text style={referenceScreenStyles.meta}>
                {item.skillId ? titleCase(item.skillId) : 'No skill assignment'}
                {item.difficulty
                  ? ` · Distance ${item.difficulty.distance}/5 · Duration ${item.difficulty.duration}/5 · Distraction ${item.difficulty.distraction}/5`
                  : ''}
              </Text>
              <Text style={referenceScreenStyles.blockIntro}>{item.rationale}</Text>
            </View>
          ))}
        </View>
      </> : null}
    </AppScreen>
  );
}
