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

const statusService = createOnboardingStatusService(appStorage);

type OnboardingContextValue = {
  status: OnboardingStatus | null;
  loading: boolean;
  ownerForm: OwnerFormData;
  dogForm: DogFormData;
  saveError: string | null;
  saving: boolean;
  setOwnerForm: React.Dispatch<React.SetStateAction<OwnerFormData>>;
  setDogForm: React.Dispatch<React.SetStateAction<DogFormData>>;
  continueExistingSetup: () => Promise<void>;
  completeSetup: () => Promise<boolean>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { setDogName, setBreed, completeOnboarding: completeLegacyOnboarding } = useAppState();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [dogForm, setDogForm] = useState(emptyDogForm);

  const applyCompleteStatus = useCallback((nextStatus: OnboardingStatus) => {
    setStatus(nextStatus);
    if (nextStatus.state === 'complete') {
      setDogName(nextStatus.dog.name);
      setBreed(nextStatus.dog.breedUnknown ? 'Unknown' : nextStatus.dog.breed);
      completeLegacyOnboarding();
    }
  }, [completeLegacyOnboarding, setBreed, setDogName]);

  useEffect(() => {
    void initializeApplication()
      .then(() => statusService.getStatus())
      .then(applyCompleteStatus)
      .finally(() => setLoading(false));
  }, [applyCompleteStatus]);

  const continueExistingSetup = useCallback(async () => {
    if (status?.state === 'incomplete') {
      if (status.owner) setOwnerForm({ displayName: status.owner.displayName, trainingExperience: status.owner.trainingExperience, primaryGoal: status.owner.primaryGoal });
      if (status.dog) {
        const displayWeight = status.dog.weightKg === null ? '' : status.dog.weightUnit === 'lb' ? (status.dog.weightKg / 0.45359237).toFixed(1) : status.dog.weightKg.toString();
        setDogForm({
          photoUri: status.dog.photoUri,
          name: status.dog.name,
          breed: status.dog.breed,
          breedUnknown: status.dog.breedUnknown,
          birthdayEstimated: status.dog.birthdayEstimated,
          birthday: status.dog.dateOfBirth ?? '',
          estimatedAgeYears: status.dog.estimatedAgeYears?.toString() ?? '',
          sex: status.dog.sex,
          weight: displayWeight,
          weightUnit: status.dog.weightUnit,
          energyLevel: status.dog.energyLevel,
        });
      }
      await statusService.clearIncompleteData();
    } else if (status?.state === 'corrupt') {
      await statusService.clearIncompleteData();
    }
    setStatus({ state: 'not-started', hasSavedData: false });
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
      const error = new InitializationError('ONBOARDING_SAVE_FAILED', { phase: 'onboarding-completion' }, true, { cause });
      initializationErrorReporter.report(error);
      setSaveError(error.userMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [applyCompleteStatus, dogForm, ownerForm]);

  const value = useMemo(() => ({ status, loading, ownerForm, dogForm, saveError, saving, setOwnerForm, setDogForm, continueExistingSetup, completeSetup }), [completeSetup, continueExistingSetup, dogForm, loading, ownerForm, saveError, saving, status]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding must be used within OnboardingProvider');
  return value;
}
