import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useOnboarding } from '../onboarding/OnboardingContext';
import { isValidTimeZone } from '../progress/time/localCalendarDate';
import { TodayPlanError } from './TodayPlanError';
import type { TodayPlanView } from './TodayPlanTypes';
import { todayPlanService } from './todayPlanServiceInstance';

type TodayPlanState = {
  readonly plan: TodayPlanView | null;
  readonly loading: boolean;
  readonly error: TodayPlanError | null;
};

export type UseTodayPlanResult = TodayPlanState & {
  readonly selectedDogName: string | null;
  readonly retry: () => void;
};

const initialState: TodayPlanState = {
  plan: null,
  loading: true,
  error: null,
};

export function useTodayPlan(): UseTodayPlanResult {
  const { status } = useOnboarding();
  const selectedOwnerId = status?.state === 'complete' ? status.owner.id : null;
  const selectedDog = status?.state === 'complete' ? status.dog : null;
  const selectedDogId = selectedDog?.id ?? null;
  const timezone = resolveDeviceTimeZone();
  const requestGeneration = useRef(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<TodayPlanState>(initialState);

  useFocusEffect(useCallback(() => {
    let active = true;
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setState(initialState);

    if (!selectedOwnerId || !selectedDogId) {
      setState({
        plan: null,
        loading: false,
        error: new TodayPlanError('DOG_NOT_FOUND'),
      });
      return () => {
        active = false;
      };
    }

    if (!timezone) {
      setState({
        plan: null,
        loading: false,
        error: new TodayPlanError('INVALID_TIMEZONE'),
      });
      return () => {
        active = false;
      };
    }

    void todayPlanService.getOrCreate({
      ownerId: selectedOwnerId,
      dogId: selectedDogId,
      timezone,
    }).then((plan) => {
      if (active && requestGeneration.current === generation) {
        setState({ plan, loading: false, error: null });
      }
    }).catch((cause: unknown) => {
      if (active && requestGeneration.current === generation) {
        setState({
          plan: null,
          loading: false,
          error: cause instanceof TodayPlanError
            ? cause
            : new TodayPlanError('PLAN_LOAD_FAILED', {}, { cause }),
        });
      }
    });

    return () => {
      active = false;
      if (requestGeneration.current === generation) {
        requestGeneration.current += 1;
      }
    };
  }, [retryVersion, selectedDogId, selectedOwnerId, timezone]));

  const retry = useCallback(() => {
    setRetryVersion((current) => current + 1);
  }, []);

  return {
    ...state,
    selectedDogName: selectedDog?.name ?? null,
    retry,
  };
}

function resolveDeviceTimeZone(): string | null {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone && isValidTimeZone(timezone) ? timezone : null;
}
