import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import { lessons } from '../data/lessons';
import type { DogProfile } from '../types/domain';
import { calculateProgress } from '../utils/progress';

type AppStateValue = {
  onboarded: boolean;
  profile: DogProfile;
  completed: string[];
  progress: number;
  setDogName: (name: string) => void;
  setBreed: (breed: string) => void;
  completeOnboarding: () => void;
  completeLesson: (lessonId: string) => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState<DogProfile>({ name: '', breed: '' });
  const [completed, setCompleted] = useState<string[]>([]);

  const setDogName = useCallback((name: string) => {
    setProfile((current) => ({ ...current, name }));
  }, []);

  const setBreed = useCallback((breed: string) => {
    setProfile((current) => ({ ...current, breed }));
  }, []);

  const completeOnboarding = useCallback(() => setOnboarded(true), []);

  const completeLesson = useCallback((lessonId: string) => {
    setCompleted((current) => current.includes(lessonId) ? current : [...current, lessonId]);
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    onboarded,
    profile,
    completed,
    progress: calculateProgress(completed.length, lessons.length),
    setDogName,
    setBreed,
    completeOnboarding,
    completeLesson,
  }), [completed, completeLesson, completeOnboarding, onboarded, profile, setBreed, setDogName]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return value;
}
