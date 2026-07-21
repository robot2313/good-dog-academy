import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import type { DogProfile } from '../types/domain';
import { calculateProgress } from '../utils/progress';

type AppStateValue = {
  profile: DogProfile;
  completed: string[];
  progress: number;
  setDogName: (name: string) => void;
  setBreed: (breed: string) => void;
  completeLesson: (lessonId: string) => void;
  resetAppState: () => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: PropsWithChildren): React.JSX.Element {
  const lessonCount = loadBundledLessonCatalogue().definitions.filter((lesson) => lesson.isActive).length;
  const [profile, setProfile] = useState<DogProfile>({ name: '', breed: '' });
  const [completed, setCompleted] = useState<string[]>([]);

  const setDogName = useCallback((name: string) => {
    setProfile((current) => ({ ...current, name }));
  }, []);

  const setBreed = useCallback((breed: string) => {
    setProfile((current) => ({ ...current, breed }));
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    setCompleted((current) => current.includes(lessonId) ? current : [...current, lessonId]);
  }, []);

  const resetAppState = useCallback(() => {
    setProfile({ name: '', breed: '' });
    setCompleted([]);
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    profile,
    completed,
    progress: calculateProgress(completed.length, lessonCount),
    setDogName,
    setBreed,
    completeLesson,
    resetAppState,
  }), [completed, completeLesson, lessonCount, profile, resetAppState, setBreed, setDogName]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return value;
}
