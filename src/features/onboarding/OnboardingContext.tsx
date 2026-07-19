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
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { setDogName, setBreed, resetAppState } = useAppState();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [dogForm, setDogForm] = useState(emptyDogForm);

  const applyCompleteStatus = useCallback((nextStatus: OnboardingStatus) => {
    setStatus(nextStatus);
    if (nextStatus.state === 'complete') {
      setDogName(nextStatus.dog.name);
      setBreed(nextStatus.dog.breedUnknown ? 'Unknown' : nextStatus.dog.breed);
    }
  }, [setBreed, setDogName]);

  useEffect(() => {
    void initializeApplication()
      .then(() => statusService.getStatus())
      .then(applyCompleteStatus)
      .finally(() => setLoading(false));
  }, [applyCompleteStatus]);

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
      const { owner, dog } = await onboardingCompletionService.complete(ownerForm, dogForm);
      applyCompleteStatus({ state: 'complete', hasSavedData: true, owner, dog });
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

  const value = useMemo(() => ({ status, loading, ownerForm, dogForm, saveError, recoveryError, saving, setOwnerForm, setDogForm, restartSavedSetup, completeSetup, resetAfterDevelopmentClear }), [completeSetup, dogForm, loading, ownerForm, recoveryError, resetAfterDevelopmentClear, restartSavedSetup, saveError, saving, status]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding must be used within OnboardingProvider');
  return value;
}
