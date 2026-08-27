import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useOnboarding } from '../../onboarding/OnboardingContext';
import { DogLearningPassportError } from './DogLearningPassportError';
import type { DogLearningPassport } from './DogLearningPassportTypes';
import { dogLearningPassportQueryService } from './dogLearningPassportServices';

type PassportState = {
  readonly passport: DogLearningPassport | null;
  readonly loading: boolean;
  readonly error: DogLearningPassportError | null;
};

export type UseDogLearningPassportResult = PassportState & {
  readonly retry: () => void;
};

const initialState: PassportState = {
  passport: null,
  loading: true,
  error: null,
};

export function useDogLearningPassport(): UseDogLearningPassportResult {
  const { status } = useOnboarding();
  const ownerId = status?.state === 'complete' ? status.owner.id : null;
  const dogId = status?.state === 'complete' ? status.dog.id : null;
  const timeZone = useMemo(resolveDeviceTimeZone, []);
  const requestGeneration = useRef(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<PassportState>(initialState);

  useFocusEffect(useCallback(() => {
    let active = true;
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setState(initialState);

    if (!ownerId || !dogId) {
      setState({
        passport: null,
        loading: false,
        error: new DogLearningPassportError('DOG_NOT_FOUND'),
      });
      return () => { active = false; };
    }

    void dogLearningPassportQueryService.get({ ownerId, dogId, timeZone })
      .then((passport) => {
        if (active && requestGeneration.current === generation) {
          setState({ passport, loading: false, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (active && requestGeneration.current === generation) {
          setState({ passport: null, loading: false, error: asPassportError(cause) });
        }
      });

    return () => {
      active = false;
      if (requestGeneration.current === generation) requestGeneration.current += 1;
    };
  }, [dogId, ownerId, retryVersion, timeZone]));

  const retry = useCallback(() => setRetryVersion((current) => current + 1), []);
  return { ...state, retry };
}

function resolveDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function asPassportError(cause: unknown): DogLearningPassportError {
  return cause instanceof DogLearningPassportError
    ? cause
    : new DogLearningPassportError('READ_FAILED', {}, { cause });
}
