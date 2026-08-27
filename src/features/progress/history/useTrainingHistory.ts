import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useOnboarding } from '../../onboarding/OnboardingContext';
import { TrainingHistoryError } from './TrainingHistoryError';
import type {
  TrainingHistoryEntry,
  TrainingHistoryPage,
} from './TrainingHistoryTypes';
import { trainingHistoryQueryService } from './trainingHistoryServices';

type TrainingHistoryState = {
  readonly page: TrainingHistoryPage | null;
  readonly entry: TrainingHistoryEntry | null;
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly error: TrainingHistoryError | null;
};

export type UseTrainingHistoryResult = TrainingHistoryState & {
  readonly selectedDogName: string | null;
  readonly retry: () => void;
  readonly loadMore: () => Promise<void>;
};

const initialState: TrainingHistoryState = {
  page: null,
  entry: null,
  loading: true,
  loadingMore: false,
  error: null,
};

export function useTrainingHistory(
  sessionId?: string,
): UseTrainingHistoryResult {
  const { status } = useOnboarding();
  const selectedOwnerId = status?.state === 'complete' ? status.owner.id : null;
  const selectedDog = status?.state === 'complete' ? status.dog : null;
  const selectedDogId = selectedDog?.id ?? null;
  const timeZone = useMemo(resolveDeviceTimeZone, []);
  const requestGeneration = useRef(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<TrainingHistoryState>(initialState);

  useFocusEffect(useCallback(() => {
    let active = true;
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setState(initialState);

    if (!selectedOwnerId || !selectedDogId) {
      setState({
        ...initialState,
        loading: false,
        error: new TrainingHistoryError('DOG_NOT_FOUND'),
      });
      return () => { active = false; };
    }

    const load = sessionId
      ? trainingHistoryQueryService.getById({
          ownerId: selectedOwnerId,
          dogId: selectedDogId,
          sessionId,
          timeZone,
        }).then((entry) => {
          if (active && requestGeneration.current === generation) {
            setState({ ...initialState, entry, loading: false });
          }
        })
      : trainingHistoryQueryService.list({
          ownerId: selectedOwnerId,
          dogId: selectedDogId,
          timeZone,
        }).then((page) => {
          if (active && requestGeneration.current === generation) {
            setState({ ...initialState, page, loading: false });
          }
        });

    void load.catch((cause: unknown) => {
      if (active && requestGeneration.current === generation) {
        setState({
          ...initialState,
          loading: false,
          error: asTrainingHistoryError(cause),
        });
      }
    });

    return () => {
      active = false;
      if (requestGeneration.current === generation) {
        requestGeneration.current += 1;
      }
    };
  }, [retryVersion, selectedDogId, selectedOwnerId, sessionId, timeZone]));

  const retry = useCallback(() => {
    setRetryVersion((current) => current + 1);
  }, []);

  const loadMore = useCallback(async (): Promise<void> => {
    if (
      sessionId
      || !selectedOwnerId
      || !selectedDogId
      || !state.page?.hasMore
      || state.loadingMore
    ) return;

    const currentPage = state.page;
    const generation = requestGeneration.current;
    setState((current) => ({ ...current, loadingMore: true, error: null }));
    try {
      const nextPage = await trainingHistoryQueryService.list({
        ownerId: selectedOwnerId,
        dogId: selectedDogId,
        timeZone,
        offset: currentPage.entries.length,
        limit: currentPage.limit,
      });
      if (requestGeneration.current === generation) {
        setState((current) => ({
          ...current,
          page: {
            ...nextPage,
            entries: [...currentPage.entries, ...nextPage.entries],
            offset: 0,
          },
          loadingMore: false,
        }));
      }
    } catch (cause) {
      if (requestGeneration.current === generation) {
        setState((current) => ({
          ...current,
          loadingMore: false,
          error: asTrainingHistoryError(cause),
        }));
      }
    }
  }, [selectedDogId, selectedOwnerId, sessionId, state.loadingMore, state.page, timeZone]);

  return {
    ...state,
    selectedDogName: selectedDog?.name ?? null,
    retry,
    loadMore,
  };
}

function resolveDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function asTrainingHistoryError(cause: unknown): TrainingHistoryError {
  return cause instanceof TrainingHistoryError
    ? cause
    : new TrainingHistoryError('READ_FAILED', {}, { cause });
}
