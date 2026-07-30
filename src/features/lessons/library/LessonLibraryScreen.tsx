import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../types/navigation';
import { LessonLibraryService } from './LessonLibraryService';
import { LessonLibraryScreenView } from './LessonLibraryScreenView';
import { useLessonLibraryData } from './LessonLibraryContext';

export type LessonLibraryScreenProps = {
  hero?: React.JSX.Element;
};

export function LessonLibraryScreen({ hero }: LessonLibraryScreenProps = {}): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords, loading, error, retry } = useLessonLibraryData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const selectedDogId = selectedDog?.id ?? null;
  const service = useMemo(() => new LessonLibraryService(catalogue, selectedDogId, progressRecords), [catalogue, progressRecords, selectedDogId]);

  return <LessonLibraryScreenView
    hero={hero}
    dogName={selectedDog?.name ?? null}
    service={service}
    loading={loading}
    error={error}
    onRetry={retry}
    onOpenLesson={(lessonId) => navigation.navigate('LessonSummary', { lessonId })}
  />;
}
