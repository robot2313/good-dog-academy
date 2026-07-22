import { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../types/navigation';
import { useLessonLibraryData } from './LessonLibraryContext';
import { LessonLibraryService } from './LessonLibraryService';
import { LessonSummaryScreenView } from './LessonSummaryScreenView';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonSummary'>;

export function LessonSummaryScreen({ navigation, route }: Props): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords, loading, error, retry } = useLessonLibraryData();
  const selectedDogId = selectedDog?.id ?? null;
  const service = useMemo(() => new LessonLibraryService(catalogue, selectedDogId, progressRecords), [catalogue, progressRecords, selectedDogId]);

  return <LessonSummaryScreenView
    lessonId={route.params.lessonId}
    dogName={selectedDog?.name ?? null}
    service={service}
    loading={loading}
    error={error}
    onRetry={retry}
    onBack={() => navigation.goBack()}
  />;
}
