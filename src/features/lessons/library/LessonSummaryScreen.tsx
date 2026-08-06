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
  const lessonDefinition = catalogue.findById(route.params.lessonId);

  return <LessonSummaryScreenView
    lessonId={route.params.lessonId}
    lessonDefinition={lessonDefinition}
    dogName={selectedDog?.name ?? null}
    service={service}
    loading={loading}
    error={error}
    onRetry={retry}
    allowLockedStart={route.params.selfDirected === true}
    onBack={() => navigation.goBack()}
    onStart={() => navigation.navigate('LessonSession', {
      lessonId: route.params.lessonId,
      ...(route.params.dailyPlanId ? { dailyPlanId: route.params.dailyPlanId } : {}),
      ...(route.params.selfDirected ? { selfDirected: true } : {}),
    })}
  />;
}
