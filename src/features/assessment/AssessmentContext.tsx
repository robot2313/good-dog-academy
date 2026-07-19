import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import type { AssessmentOption } from '../../domain/models';
import { InitializationError } from '../../services/initialization';
import { initializationErrorReporter } from '../../services/initialization/InitializationErrorReporter';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { assessmentQuestions } from './catalogue';
import { assessmentCompletionService, behaviourAssessmentTransactions } from './assessmentServices';
import type { AssessmentAnswers } from './scoring';

type AssessmentContextValue = {
  answers: AssessmentAnswers;
  saving: boolean;
  error: string | null;
  setAnswer: (questionId: string, option: AssessmentOption) => void;
  sectionComplete: (questionIds: readonly string[]) => boolean;
  allComplete: boolean;
  completeAssessment: () => Promise<boolean>;
  recoverCorruptAssessment: () => Promise<boolean>;
};

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export function AssessmentProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status, refreshApplicationStatus } = useOnboarding();
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAnswer = useCallback((questionId: string, option: AssessmentOption) => setAnswers((current) => ({ ...current, [questionId]: option })), []);
  const sectionComplete = useCallback((questionIds: readonly string[]) => questionIds.every((id) => answers[id] !== undefined), [answers]);
  const allComplete = sectionComplete(assessmentQuestions.map((question) => question.id));

  const completeAssessment = useCallback(async (): Promise<boolean> => {
    if (!status || (status.state !== 'assessment-required' && status.state !== 'assessment-corrupt') || !allComplete) return false;
    setError(null);
    setSaving(true);
    try {
      await assessmentCompletionService.complete({ owner: status.owner, dog: status.dog, profile: status.behaviourProfile, answers });
      await refreshApplicationStatus();
      return true;
    } catch (cause) {
      const failure = new InitializationError('BEHAVIOUR_ASSESSMENT_SAVE_FAILED', { phase: 'behaviour-assessment-completion', dogId: status.dog.id }, true, { cause });
      initializationErrorReporter.report(failure);
      setError(failure.userMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [allComplete, answers, refreshApplicationStatus, status]);

  const recoverCorruptAssessment = useCallback(async (): Promise<boolean> => {
    if (!status || status.state !== 'assessment-corrupt') return false;
    setError(null);
    setSaving(true);
    try {
      await behaviourAssessmentTransactions.clearCorruptAssessments(status.behaviourProfile);
      setAnswers({});
      await refreshApplicationStatus();
      return true;
    } catch (cause) {
      const failure = new InitializationError('BEHAVIOUR_ASSESSMENT_RECOVERY_FAILED', { phase: 'behaviour-assessment-recovery', dogId: status.dog.id }, true, { cause });
      initializationErrorReporter.report(failure);
      setError(failure.userMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [refreshApplicationStatus, status]);

  const value = useMemo(() => ({ answers, saving, error, setAnswer, sectionComplete, allComplete, completeAssessment, recoverCorruptAssessment }), [allComplete, answers, completeAssessment, error, recoverCorruptAssessment, saving, sectionComplete, setAnswer]);
  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment(): AssessmentContextValue {
  const value = useContext(AssessmentContext);
  if (!value) throw new Error('useAssessment must be used within AssessmentProvider');
  return value;
}
