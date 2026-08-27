import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Dog, LessonProgress } from '../../../domain/models';
import { useOnboarding } from '../../onboarding/OnboardingContext';
import { loadBundledLessonCatalogue, type LessonCatalogue } from '../catalogue';
import {
  LessonSessionCompletionError,
  type CompleteLessonSessionRequest,
  type LessonSessionCompletionResult,
} from '../progress';
import {
  lessonProgressInitializationService,
  lessonSessionCompletionService,
} from '../progress/lessonProgressServices';
import { LessonLibraryError } from './LessonLibraryError';

type LessonLibraryContextValue = {
  catalogue: LessonCatalogue;
  selectedDog: Dog | null;
  selectedOwnerId: string | null;
  progressRecords: readonly LessonProgress[];
  loading: boolean;
  error: LessonLibraryError | null;
  retry: () => void;
  completeLessonSession: (
    request: CompleteLessonSessionRequest,
  ) => Promise<LessonSessionCompletionResult>;
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
  const selectedOwnerId = status?.state === 'complete' ? status.owner.id : null;
  const selectedDogId = selectedDog?.id ?? null;
  const selectedDogIdRef = useRef(selectedDogId);
  const selectedOwnerIdRef = useRef(selectedOwnerId);
  selectedDogIdRef.current = selectedDogId;
  selectedOwnerIdRef.current = selectedOwnerId;
  const [retryVersion, setRetryVersion] = useState(0);
  const [loadState, setLoadState] = useState<ProgressLoadState>({ dogId: null, progressRecords: [], loading: false, error: null });

  useEffect(() => {
    let active = true;
    if (!selectedDogId || !selectedOwnerId) {
      setLoadState({ dogId: null, progressRecords: [], loading: false, error: null });
      return () => { active = false; };
    }

    setLoadState({ dogId: selectedDogId, progressRecords: [], loading: true, error: null });
    void lessonProgressInitializationService.initialize(selectedOwnerId, selectedDogId)
      .then((progressRecords) => {
        if (active) setLoadState({ dogId: selectedDogId, progressRecords, loading: false, error: null });
      })
      .catch((cause: unknown) => {
        if (active) setLoadState({ dogId: selectedDogId, progressRecords: [], loading: false, error: corruptProgressError(cause) });
      });
    return () => { active = false; };
  }, [retryVersion, selectedDogId, selectedOwnerId]);

  const retry = useCallback(() => setRetryVersion((current) => current + 1), []);
  const completeLessonSession = useCallback(async (
    request: CompleteLessonSessionRequest,
  ): Promise<LessonSessionCompletionResult> => {
    if (
      request.dogId !== selectedDogIdRef.current
      || request.ownerId !== selectedOwnerIdRef.current
    ) {
      throw new LessonSessionCompletionError('STALE_SELECTED_DOG', {
        requestDogId: request.dogId,
        selectedDogId: selectedDogIdRef.current,
      });
    }

    const result = await lessonSessionCompletionService.complete(request);
    if (selectedDogIdRef.current === request.dogId) {
      setLoadState({
        dogId: request.dogId,
        progressRecords: result.progressRecords,
        loading: false,
        error: null,
      });
    }
    return result;
  }, []);
  const currentLoad = loadState.dogId === selectedDogId ? loadState : { dogId: selectedDogId, progressRecords: [], loading: Boolean(selectedDogId), error: null };
  const value = useMemo<LessonLibraryContextValue>(() => ({
    catalogue,
    selectedDog,
    selectedOwnerId,
    progressRecords: currentLoad.progressRecords,
    loading: currentLoad.loading,
    error: currentLoad.error,
    retry,
    completeLessonSession,
  }), [completeLessonSession, currentLoad.error, currentLoad.loading, currentLoad.progressRecords, retry, selectedDog, selectedOwnerId]);

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
