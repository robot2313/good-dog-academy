import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { InitializationError } from '../../services/initialization';
import { initializeApplication } from '../../services/initialization/initializeApplication';
import { initializationErrorReporter } from '../../services/initialization/InitializationErrorReporter';
import { appStorage } from '../../services/appStorage';
import { useAppState } from '../../state/AppStateContext';
import { onboardingCompletionService } from './onboardingCompletionServiceInstance';
import { createOnboardingStatusService, type OnboardingStatus } from './OnboardingStatusService';
import { validateDogForm, validateOwnerForm } from './validation';
import { emptyDogForm, emptyOwnerForm, type DogFormData, type OwnerFormData } from './types';
import { onboardingRecoveryService } from './onboardingRecoveryServiceInstance';
import { DogPhotoStorageError } from './photo/DogPhotoStorage';

const statusService = createOnboardingStatusService(appStorage);

type OnboardingContextValue = {
  status: OnboardingStatus | null;
  loading: boolean;
  initializationError: string | null;
  ownerForm: OwnerFormData;
  dogForm: DogFormData;
  saveError: string | null;
  recoveryError: string | null;
  saving: boolean;
  setOwnerForm: React.Dispatch<React.SetStateAction<OwnerFormData>>;
  setDogForm: React.Dispatch<React.SetStateAction<DogFormData>>;
  restartSavedSetup: () => Promise<boolean>;
  completeSetup: () => Promise<boolean>;
  resetAfterDevelopmentClear: () => void;
  refreshApplicationStatus: () => Promise<void>;
  retryInitialization: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { setDogName, setBreed, resetAppState } = useAppState();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [dogForm, setDogForm] = useState(emptyDogForm);

  const applyCompleteStatus = useCallback((nextStatus: OnboardingStatus) => {
    setStatus(nextStatus);
    if (nextStatus.state === 'complete' || nextStatus.state === 'assessment-required' || nextStatus.state === 'assessment-corrupt') {
      setDogName(nextStatus.dog.name);
      setBreed(nextStatus.dog.breedUnknown ? 'Unknown' : nextStatus.dog.breed);
    }
  }, [setBreed, setDogName]);

  const refreshApplicationStatus = useCallback(async () => {
    applyCompleteStatus(await statusService.getStatus());
  }, [applyCompleteStatus]);

  const runInitialization = useCallback(async () => {
    setLoading(true);
    setInitializationError(null);
    const result = await initializeApplication();
    if (!result.ok) {
      setInitializationError(result.error.userMessage);
      setLoading(false);
      return;
    }
    applyCompleteStatus(await statusService.getStatus());
    setLoading(false);
  }, [applyCompleteStatus]);

  useEffect(() => { void runInitialization(); }, [runInitialization]);
  const retryInitialization = useCallback(() => { void runInitialization(); }, [runInitialization]);

  const restartSavedSetup = useCallback(async (): Promise<boolean> => {
    if (!status) return false;
    setRecoveryError(null);
    try {
      await onboardingRecoveryService.restart(status);
      setOwnerForm(emptyOwnerForm);
      setDogForm(emptyDogForm);
      setStatus({ state: 'not-started', hasSavedData: false });
      return true;
    } catch (cause) {
      const error = new InitializationError('ONBOARDING_RECOVERY_FAILED', { phase: 'onboarding-recovery', status: status.state }, true, { cause });
      initializationErrorReporter.report(error);
      setRecoveryError(error.userMessage);
      return false;
    }
  }, [status]);

  const completeSetup = useCallback(async (): Promise<boolean> => {
    setSaveError(null);
    if (!validateOwnerForm(ownerForm).valid || !validateDogForm(dogForm).valid) return false;
    setSaving(true);
    try {
      const { owner, dog, behaviourProfile } = await onboardingCompletionService.complete(ownerForm, dogForm);
      applyCompleteStatus({ state: 'assessment-required', hasSavedData: true, owner, dog, behaviourProfile });
      return true;
    } catch (cause) {
      const error = new InitializationError(cause instanceof DogPhotoStorageError ? 'DOG_PHOTO_PERSIST_FAILED' : 'ONBOARDING_SAVE_FAILED', { phase: 'onboarding-completion' }, true, { cause });
      initializationErrorReporter.report(error);
      setSaveError(error.userMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [applyCompleteStatus, dogForm, ownerForm]);

  const resetAfterDevelopmentClear = useCallback(() => {
    resetAppState();
    setOwnerForm(emptyOwnerForm);
    setDogForm(emptyDogForm);
    setSaveError(null);
    setRecoveryError(null);
    setStatus({ state: 'not-started', hasSavedData: false });
  }, [resetAppState]);

  const value = useMemo(() => ({ status, loading, initializationError, ownerForm, dogForm, saveError, recoveryError, saving, setOwnerForm, setDogForm, restartSavedSetup, completeSetup, resetAfterDevelopmentClear, refreshApplicationStatus, retryInitialization }), [completeSetup, dogForm, initializationError, loading, ownerForm, recoveryError, refreshApplicationStatus, resetAfterDevelopmentClear, restartSavedSetup, retryInitialization, saveError, saving, status]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding must be used within OnboardingProvider');
  return value;
}
