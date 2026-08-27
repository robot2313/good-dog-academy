import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../components/ErrorState';
import { FormTextInput } from '../../components/FormTextInput';
import { LessonActionBar } from '../../components/LessonActionBar';
import { LessonScaffold } from '../../components/LessonScaffold';
import { LoadingState } from '../../components/LoadingState';
import { PremiumCard } from '../../components/PremiumCard';
import { ReferenceIcon } from '../../components/ReferenceIcon';
import type { TroubleshooterAttempt, TroubleshooterOutcome, TroubleshooterTopicId } from '../../domain/models';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';
import type { RootStackParamList } from '../../types/navigation';
import { useLessonLibraryData } from '../lessons/library/LessonLibraryContext';
import { LessonLibraryService } from '../lessons/library/LessonLibraryService';
import { DogTroubleshooterService } from './DogTroubleshooterService';
import { HelpNowResultView } from './HelpNowResultView';
import { helpNowResponseOptions, helpNowSituations } from './helpNowSituations';
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

export function DogTroubleshooterScreen({ navigation, route }: DogTroubleshooterScreenProps): React.JSX.Element {
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
  const [reportedOutcome, setReportedOutcome] = useState<TroubleshooterOutcome | null>(null);
  const isHelpNow = route.params?.mode === 'help-now';
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
    setReportedOutcome(null);
  };

  const back = () => {
    switch (step) {
      case 'concern': navigation.goBack(); break;
      case 'guide': setStep('concern'); break;
      case 'scenario': resetFlow(); break;
      case 'body':
        setBodyState(null);
        if (isHelpNow) {
          setTopicId(null);
          setScenarioId(null);
          setStep('concern');
        } else {
          setScenarioId(null);
          setStep('scenario');
        }
        break;
      case 'response': setBodyState(null); setStep('body'); break;
      case 'environment': setResponseState(null); setStep('response'); break;
      case 'result': setStep(bodyState && isSafetyBodyState(bodyState) ? 'body' : 'environment'); break;
    }
  };

  const reportOutcome = async (outcome: TroubleshooterOutcome) => {
    if (!answers || !result || !selectedOwnerId || !selectedDogId) return;
    setSavingOutcome(true);
    setSaveError(null);
    try {
      const attempt = await troubleshooterHistoryService.recordOutcome({ ownerId: selectedOwnerId, dogId: selectedDogId, answers, result, outcome });
      setAttempts((current) => Object.freeze([...current, attempt]));
      setReportedOutcome(outcome);
    } catch {
      setSaveError('That result could not be saved. Please try again.');
    } finally {
      setSavingOutcome(false);
    }
  };

  const footer = <LessonActionBar
    back={{ label: step === 'concern' ? (isHelpNow ? 'Back home' : 'Back') : step === 'result' ? 'Review answers' : 'Previous', onPress: back }}
    forward={step === 'environment'
      ? { label: 'Show my plan', onPress: () => { setReportedOutcome(null); setStep('result'); }, disabled: !environment.trim() || historyLoading || Boolean(historyError) }
      : undefined}
  />;

  if (loading) return <LessonScaffold footer={footer}><LoadingState message={`Preparing training help for ${dogName}…`} /></LessonScaffold>;
  if (error) return <LessonScaffold footer={footer}><ErrorState message="The Troubleshooter could not read the saved lesson progress safely." onRetry={retry} /></LessonScaffold>;

  return (
    <LessonScaffold footer={footer}>
      <Text style={styles.eyebrow}>{isHelpNow ? 'HELP ME NOW' : 'TRAINING TROUBLESHOOTER'}</Text>
      <Text accessibilityRole="header" style={styles.title}>{screenTitle(step, dogName, concern?.title, isHelpNow)}</Text>
      <Text style={styles.intro}>{screenIntro(step, isHelpNow)}</Text>

      {step === 'concern' ? (
        <View accessibilityRole="list" style={styles.list}>
          {isHelpNow ? <>
              {helpNowSituations.map((situation) => (
                <ChoiceCard
                  key={situation.id}
                  title={situation.title}
                  description={situation.description}
                  onPress={() => {
                    setReportedOutcome(null);
                    setTopicId(situation.topicId);
                    setScenarioId(situation.scenarioId);
                    if (situation.id === 'sudden-change') {
                      setBodyState('possible-pain-or-sudden-change');
                      setResponseState('can-eat-and-respond');
                      setEnvironment('the current situation');
                      setStep('result');
                    } else {
                      setStep('body');
                    }
                  }}
                />
              ))}
              <ChoiceCard
                title="Browse every training problem"
                description="Open the full Training Troubleshooter for less urgent questions."
                onPress={() => navigation.setParams({ mode: 'standard' })}
              />
            </> : <>
              <ChoiceCard
                title="Training safety and practical guide"
                description="Equipment, rewards, stress signals, and choosing qualified help."
                onPress={() => setStep('guide')}
              />
              {troubleshooterConcerns.map((item) => (
                <ChoiceCard key={item.id} title={item.title} description={item.description} onPress={() => { setTopicId(item.id); setStep('scenario'); }} />
              ))}
            </>}
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
          {(isHelpNow ? helpNowResponseOptions : responseStateOptions).map((option) => <ChoiceCard key={option.id} title={option.label} onPress={() => { setResponseState(option.id); setStep('environment'); }} />)}
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
        isHelpNow ? (
          <HelpNowResultView
            key={`${result.protocol.id}-${result.fallbackLevel}`}
            dogName={dogName}
            result={result}
            savingOutcome={savingOutcome}
            saveError={saveError}
            reportedOutcome={reportedOutcome}
            onReportOutcome={(outcome) => { void reportOutcome(outcome); }}
            onOpenFullPlan={() => navigation.setParams({ mode: 'standard' })}
            onStartOver={resetFlow}
          />
        ) : (
          <TroubleshooterResultView
            dogName={dogName}
            result={result}
            savingOutcome={savingOutcome}
            saveError={saveError}
            onReportOutcome={(outcome) => { void reportOutcome(outcome); }}
            onOpenLesson={(lessonId) => navigation.navigate('LessonSummary', { lessonId })}
          />
        )
      ) : null}
    </LessonScaffold>
  );
}

function ChoiceCard({ title, description, onPress }: { readonly title: string; readonly description?: string; readonly onPress: () => void }): React.JSX.Element {
  return (
    <PremiumCard accessibilityLabel={description ? `${title}. ${description}` : title} onPress={onPress} style={styles.choiceCard}>
      <View style={styles.choiceRow}>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>{title}</Text>
          {description ? <Text style={styles.choiceDescription}>{description}</Text> : null}
        </View>
        <ReferenceIcon name="chevron" size={16} color={colorTokens.text.secondary} />
      </View>
    </PremiumCard>
  );
}

function screenTitle(step: FlowStep, dogName: string, concernTitle: string | undefined, isHelpNow: boolean): string {
  switch (step) {
    case 'concern': return isHelpNow ? 'What is happening right now?' : `What is ${dogName} struggling with?`;
    case 'guide': return 'Train safely and humanely';
    case 'scenario': return 'Which description is closest?';
    case 'body': return isHelpNow ? `Is it safe for ${dogName} to keep learning?` : `How does ${dogName} look when it happens?`;
    case 'response': return isHelpNow ? `What can ${dogName} manage right now?` : 'What can they do in that moment?';
    case 'environment': return isHelpNow ? 'Where are you right now?' : 'Where is this happening?';
    case 'result': return isHelpNow ? `One step at a time with ${dogName}` : concernTitle ? `${dogName}’s plan for: ${concernTitle}` : `${dogName}’s training plan`;
  }
}

function screenIntro(step: FlowStep, isHelpNow: boolean): string {
  switch (step) {
    case 'concern': return isHelpNow ? 'Choose the closest match. Safety comes first, then the app will give you one clear action.' : 'Choose the closest match. The app will ask three short questions before suggesting a practical exercise.';
    case 'guide': return 'Use this reference before choosing equipment, rewards, or outside help.';
    case 'scenario': return 'Choose what you see most often. It does not need to be a perfect match.';
    case 'body': return isHelpNow ? 'If anyone could be hurt, your dog is panicking, or pain may be involved, training stops.' : 'Body language changes whether training is appropriate or safety and health come first.';
    case 'response': return isHelpNow ? 'This checks whether the situation is easy enough for learning.' : 'This helps separate distraction, reward value, cue clarity, and session length.';
    case 'environment': return isHelpNow ? 'A short description helps the app remember where this plan was tried.' : 'Skills do not automatically transfer between places. Be specific but brief.';
    case 'result': return isHelpNow ? 'Complete only the action shown. Stop if safety or comfort gets worse.' : 'Use the immediate exercise first. Related lessons are optional and appear after the fallback plan.';
  }
}

function isSafetyBodyState(state: TroubleshooterBodyState): boolean {
  return state === 'panic-snapping-or-aggression'
    || state === 'possible-pain-or-sudden-change'
    || state === 'injury-child-or-control-risk';
}

const styles = StyleSheet.create({
  eyebrow: { ...typographyTokens.label, color: colorTokens.text.accent, letterSpacing: 1.1 },
  title: { ...typographyTokens.pageTitle, color: colorTokens.text.primary, letterSpacing: -0.5 },
  intro: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  list: { gap: spacingTokens.xs },
  choiceCard: { borderRadius: radiusTokens.lg, paddingVertical: spacingTokens.sm, paddingHorizontal: spacingTokens.sm, gap: 0 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: spacingTokens.sm },
  choiceCopy: { flex: 1, minWidth: 0, gap: 2 },
  choiceTitle: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
  choiceDescription: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  environmentGroup: { gap: spacingTokens.xs },
  helper: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
});
