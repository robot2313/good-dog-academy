import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Dog, LessonProgress } from '../../../domain/models';
import { domainRepositories } from '../../../services/domainRepositories';
import { useOnboarding } from '../../onboarding/OnboardingContext';
import { loadBundledLessonCatalogue, type LessonCatalogue } from '../catalogue';
import { LessonLibraryError } from './LessonLibraryError';

type LessonLibraryContextValue = {
  catalogue: LessonCatalogue;
  selectedDog: Dog | null;
  progressRecords: readonly LessonProgress[];
  loading: boolean;
  error: LessonLibraryError | null;
  retry: () => void;
};

type ProgressLoadState = {
  dogId: string | null;
  progressRecords: readonly LessonProgress[];
  loading: boolean;
  error: LessonLibraryError | null;
};

const catalogue = loadBundledLessonCatalogue();
const LessonLibraryContext = createContext<LessonLibraryContextValue | undefined>(undefined);

export function LessonLibraryProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status } = useOnboarding();
  const selectedDog = status?.state === 'complete' ? status.dog : null;
  const selectedDogId = selectedDog?.id ?? null;
  const [retryVersion, setRetryVersion] = useState(0);
  const [loadState, setLoadState] = useState<ProgressLoadState>({ dogId: null, progressRecords: [], loading: false, error: null });

  useEffect(() => {
    let active = true;
    if (!selectedDogId) {
      setLoadState({ dogId: null, progressRecords: [], loading: false, error: null });
      return () => { active = false; };
    }

    setLoadState({ dogId: selectedDogId, progressRecords: [], loading: true, error: null });
    void domainRepositories.lessonProgress.findAll()
      .then((progressRecords) => {
        if (active) setLoadState({ dogId: selectedDogId, progressRecords, loading: false, error: null });
      })
      .catch((cause: unknown) => {
        if (active) setLoadState({ dogId: selectedDogId, progressRecords: [], loading: false, error: corruptProgressError(cause) });
      });
    return () => { active = false; };
  }, [retryVersion, selectedDogId]);

  const retry = useCallback(() => setRetryVersion((current) => current + 1), []);
  const currentLoad = loadState.dogId === selectedDogId ? loadState : { dogId: selectedDogId, progressRecords: [], loading: Boolean(selectedDogId), error: null };
  const value = useMemo<LessonLibraryContextValue>(() => ({
    catalogue,
    selectedDog,
    progressRecords: currentLoad.progressRecords,
    loading: currentLoad.loading,
    error: currentLoad.error,
    retry,
  }), [currentLoad.error, currentLoad.loading, currentLoad.progressRecords, retry, selectedDog]);

  return <LessonLibraryContext.Provider value={value}>{children}</LessonLibraryContext.Provider>;
}

export function useLessonLibraryData(): LessonLibraryContextValue {
  const value = useContext(LessonLibraryContext);
  if (!value) throw new Error('useLessonLibraryData must be used within LessonLibraryProvider');
  return value;
}

function corruptProgressError(cause: unknown): LessonLibraryError {
  if (cause instanceof LessonLibraryError) return cause;
  return new LessonLibraryError('CORRUPT_PROGRESS', { causeName: cause instanceof Error ? cause.name : typeof cause });
}
