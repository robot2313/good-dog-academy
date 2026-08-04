import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../components/ErrorState';
import { FormTextInput } from '../../components/FormTextInput';
import { LessonActionBar } from '../../components/LessonActionBar';
import { LessonScaffold } from '../../components/LessonScaffold';
import { LoadingState } from '../../components/LoadingState';
import { PremiumCard } from '../../components/PremiumCard';
import type { TroubleshooterAttempt, TroubleshooterOutcome, TroubleshooterTopicId } from '../../domain/models';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';
import type { RootStackParamList } from '../../types/navigation';
import { useLessonLibraryData } from '../lessons/library/LessonLibraryContext';
import { LessonLibraryService } from '../lessons/library/LessonLibraryService';
import { DogTroubleshooterService } from './DogTroubleshooterService';
import { troubleshooterConcerns } from './troubleshooterCatalogue';
import { troubleshooterHistoryService } from './troubleshooterHistoryServiceInstance';
import { TroubleshooterResultView } from './TroubleshooterResultView';
import { TroubleshooterReferenceGuide } from './TroubleshooterReferenceGuide';
import {
  bodyStateOptions,
  responseStateOptions,
  type TroubleshooterBodyState,
  type TroubleshooterDiagnosticAnswers,
  type TroubleshooterResponseState,
} from './troubleshooterTypes';

export type DogTroubleshooterScreenProps = NativeStackScreenProps<RootStackParamList, 'Troubleshooter'>;
type FlowStep = 'concern' | 'guide' | 'scenario' | 'body' | 'response' | 'environment' | 'result';

export function DogTroubleshooterScreen({ navigation }: DogTroubleshooterScreenProps): React.JSX.Element {
  const { catalogue, selectedDog, selectedOwnerId, progressRecords, loading, error, retry } = useLessonLibraryData();
  const [step, setStep] = useState<FlowStep>('concern');
  const [topicId, setTopicId] = useState<TroubleshooterTopicId | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [bodyState, setBodyState] = useState<TroubleshooterBodyState | null>(null);
  const [responseState, setResponseState] = useState<TroubleshooterResponseState | null>(null);
  const [environment, setEnvironment] = useState('');
  const [attempts, setAttempts] = useState<readonly TroubleshooterAttempt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRetryVersion, setHistoryRetryVersion] = useState(0);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedDogId = selectedDog?.id ?? null;
  const dogName = selectedDog?.name.trim() || 'your dog';
  const concern = topicId ? troubleshooterConcerns.find((item) => item.id === topicId) ?? null : null;
  const answers: TroubleshooterDiagnosticAnswers | null = topicId && scenarioId && bodyState && responseState && environment.trim()
    ? { topicId, scenarioId, bodyState, responseState, environment: environment.trim() }
    : null;
  const service = useMemo(() => new DogTroubleshooterService(
    new LessonLibraryService(catalogue, selectedDogId, progressRecords),
  ), [catalogue, progressRecords, selectedDogId]);

  useEffect(() => {
    let active = true;
    if (!selectedDogId) {
      setAttempts([]);
      setHistoryLoading(false);
      setHistoryError(null);
      return () => { active = false; };
    }
    setHistoryLoading(true);
    setHistoryError(null);
    void troubleshooterHistoryService.listForDog(selectedDogId)
      .then((records) => {
        if (active) setAttempts(records);
      })
      .catch(() => {
        if (active) setHistoryError('Saved Troubleshooter results could not be read safely.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => { active = false; };
  }, [historyRetryVersion, selectedDogId]);

  let result = null;
  try {
    result = step === 'result' && answers ? service.recommend(answers, attempts) : null;
  } catch {
    return <LessonScaffold footer={<LessonActionBar back={{ label: 'Back', onPress: navigation.goBack }} />}><ErrorState message="The Troubleshooter could not prepare this plan safely." onRetry={retry} /></LessonScaffold>;
  }

  const resetFlow = () => {
    setStep('concern');
    setTopicId(null);
    setScenarioId(null);
    setBodyState(null);
    setResponseState(null);
    setEnvironment('');
    setSaveError(null);
  };

  const back = () => {
    switch (step) {
      case 'concern': navigation.goBack(); break;
      case 'guide': setStep('concern'); break;
      case 'scenario': resetFlow(); break;
      case 'body': setScenarioId(null); setStep('scenario'); break;
      case 'response': setBodyState(null); setStep('body'); break;
      case 'environment': setResponseState(null); setStep('response'); break;
      case 'result': setStep('environment'); break;
    }
  };

  const reportOutcome = async (outcome: TroubleshooterOutcome) => {
    if (!answers || !result || !selectedOwnerId || !selectedDogId) return;
    setSavingOutcome(true);
    setSaveError(null);
    try {
      const attempt = await troubleshooterHistoryService.recordOutcome({ ownerId: selectedOwnerId, dogId: selectedDogId, answers, result, outcome });
      setAttempts((current) => Object.freeze([...current, attempt]));
    } catch {
      setSaveError('That result could not be saved. Please try again.');
    } finally {
      setSavingOutcome(false);
    }
  };

  const footer = <LessonActionBar
    back={{ label: step === 'concern' ? 'Back' : step === 'result' ? 'Review answers' : 'Previous', onPress: back }}
    forward={step === 'environment'
      ? { label: 'Show my plan', onPress: () => setStep('result'), disabled: !environment.trim() || historyLoading || Boolean(historyError) }
      : undefined}
  />;

  if (loading) return <LessonScaffold footer={footer}><LoadingState message={`Preparing training help for ${dogName}…`} /></LessonScaffold>;
  if (error) return <LessonScaffold footer={footer}><ErrorState message="The Troubleshooter could not read the saved lesson progress safely." onRetry={retry} /></LessonScaffold>;

  return (
    <LessonScaffold footer={footer}>
      <Text style={styles.eyebrow}>TRAINING TROUBLESHOOTER</Text>
      <Text accessibilityRole="header" style={styles.title}>{screenTitle(step, dogName, concern?.title)}</Text>
      <Text style={styles.intro}>{screenIntro(step)}</Text>

      {step === 'concern' ? (
        <View accessibilityRole="list" style={styles.list}>
          <ChoiceCard
            title="Training safety and practical guide"
            description="Equipment, rewards, stress signals, and choosing qualified help."
            onPress={() => setStep('guide')}
          />
          {troubleshooterConcerns.map((item) => (
            <ChoiceCard key={item.id} title={item.title} description={item.description} onPress={() => { setTopicId(item.id); setStep('scenario'); }} />
          ))}
        </View>
      ) : null}

      {step === 'guide' ? <TroubleshooterReferenceGuide /> : null}

      {step === 'scenario' && concern ? (
        <View accessibilityRole="list" style={styles.list}>
          {concern.scenarios.map((scenario) => (
            <ChoiceCard key={scenario.id} title={scenario.label} onPress={() => { setScenarioId(scenario.id); setStep('body'); }} />
          ))}
        </View>
      ) : null}

      {step === 'body' ? (
        <View accessibilityRole="list" style={styles.list}>
          {bodyStateOptions.map((option) => <ChoiceCard key={option.id} title={option.label} onPress={() => {
            setBodyState(option.id);
            if (isSafetyBodyState(option.id)) {
              setResponseState('can-eat-and-respond');
              setEnvironment('the current situation');
              setStep('result');
            } else {
              setStep('response');
            }
          }} />)}
        </View>
      ) : null}

      {step === 'response' ? (
        <View accessibilityRole="list" style={styles.list}>
          {responseStateOptions.map((option) => <ChoiceCard key={option.id} title={option.label} onPress={() => { setResponseState(option.id); setStep('environment'); }} />)}
        </View>
      ) : null}

      {step === 'environment' ? (
        <View style={styles.environmentGroup}>
          <FormTextInput
            label="Where are you practising?"
            value={environment}
            onChangeText={setEnvironment}
            placeholder="For example: quiet lounge room or front yard"
            maxLength={80}
            returnKeyType="done"
          />
          <Text style={styles.helper}>This lets the app remember that success applies to this environment—not everywhere yet.</Text>
          {historyLoading ? <Text accessibilityRole="alert" style={styles.helper}>Checking previous results…</Text> : null}
          {historyError ? <ErrorState message={historyError} onRetry={() => setHistoryRetryVersion((current) => current + 1)} /> : null}
        </View>
      ) : null}

      {step === 'result' && result ? (
        <TroubleshooterResultView
          dogName={dogName}
          result={result}
          savingOutcome={savingOutcome}
          saveError={saveError}
          onReportOutcome={(outcome) => { void reportOutcome(outcome); }}
          onOpenLesson={(lessonId) => navigation.navigate('LessonSummary', { lessonId })}
        />
      ) : null}
    </LessonScaffold>
  );
}

function ChoiceCard({ title, description, onPress }: { readonly title: string; readonly description?: string; readonly onPress: () => void }): React.JSX.Element {
  return (
    <PremiumCard accessibilityLabel={description ? `${title}. ${description}` : title} onPress={onPress} style={styles.choiceCard}>
      <Text style={styles.choiceTitle}>{title}</Text>
      {description ? <Text style={styles.choiceDescription}>{description}</Text> : null}
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.choose}>Choose {'>'}</Text>
    </PremiumCard>
  );
}

function screenTitle(step: FlowStep, dogName: string, concernTitle?: string): string {
  switch (step) {
    case 'concern': return `What is ${dogName} struggling with?`;
    case 'guide': return 'Train safely and humanely';
    case 'scenario': return 'Which description is closest?';
    case 'body': return `How does ${dogName} look when it happens?`;
    case 'response': return 'What can they do in that moment?';
    case 'environment': return 'Where is this happening?';
    case 'result': return concernTitle ? `${dogName}’s plan for: ${concernTitle}` : `${dogName}’s training plan`;
  }
}

function screenIntro(step: FlowStep): string {
  switch (step) {
    case 'concern': return 'Choose the closest match. The app will ask three short questions before suggesting a practical exercise.';
    case 'guide': return 'Use this reference before choosing equipment, rewards, or outside help.';
    case 'scenario': return 'Choose what you see most often. It does not need to be a perfect match.';
    case 'body': return 'Body language changes whether training is appropriate or safety and health come first.';
    case 'response': return 'This helps separate distraction, reward value, cue clarity, and session length.';
    case 'environment': return 'Skills do not automatically transfer between places. Be specific but brief.';
    case 'result': return 'Use the immediate exercise first. Related lessons are optional and appear after the fallback plan.';
  }
}

function isSafetyBodyState(state: TroubleshooterBodyState): boolean {
  return state === 'panic-snapping-or-aggression'
    || state === 'possible-pain-or-sudden-change'
    || state === 'injury-child-or-control-risk';
}

const styles = StyleSheet.create({
  eyebrow: { ...typographyTokens.label, color: colorTokens.text.accent, letterSpacing: 1.2 },
  title: { ...typographyTokens.pageTitle, color: colorTokens.text.primary },
  intro: { ...typographyTokens.body, color: colorTokens.text.secondary },
  list: { gap: spacingTokens.sm },
  choiceCard: { borderRadius: radiusTokens.lg, padding: spacingTokens.lg },
  choiceTitle: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
  choiceDescription: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  choose: { ...typographyTokens.label, color: colorTokens.text.accent, marginTop: spacingTokens.xxs },
  environmentGroup: { gap: spacingTokens.sm },
  helper: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
});
