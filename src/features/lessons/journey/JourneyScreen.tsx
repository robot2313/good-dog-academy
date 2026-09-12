import { useEffect, useMemo, useState } from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { IdentityHeader } from '../../../components/IdentityHeader';
import { ReferenceIcon } from '../../../components/ReferenceIcon';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../../../services/AdaptiveTrainingPersistenceService';
import { referencePalette, referenceScreenStyles, referenceStyles } from '../../../theme/referenceStyles';
import type { MainTabParamList, RootStackParamList } from '../../../types/navigation';
import { useLessonLibraryData } from '../library/LessonLibraryContext';
import { lessonLibraryErrorMessage } from '../library/lessonLibraryPresentation';
import { LessonLibraryService } from '../library/LessonLibraryService';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';
import {
  buildAdaptiveJourneyRecommendation,
  type AdaptiveJourneyRecommendation,
} from './AdaptiveJourneyRecommendation';

type StackProps = NativeStackScreenProps<RootStackParamList, 'Journey'>;
type TabProps = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Plan'>, NativeStackScreenProps<RootStackParamList, 'Main'>>;
type JourneyStageId = 'foundation' | 'building' | 'real-world' | 'lifelong';
type JourneyStage = { readonly id: JourneyStageId; readonly number: number; readonly title: string; readonly lessons: readonly LessonLibraryItem[] };

export function JourneyScreen({ navigation }: StackProps): React.JSX.Element {
  return <JourneyContent onBack={() => navigation.goBack()} onOpenLesson={(lessonId) => navigation.navigate('LessonSummary', { lessonId })} />;
}

export function JourneyTabScreen({ navigation }: TabProps): React.JSX.Element {
  return <JourneyContent onOpenLesson={(lessonId) => navigation.navigate('LessonSummary', { lessonId })} />;
}

function JourneyContent({ onBack, onOpenLesson }: { readonly onBack?: () => void; readonly onOpenLesson: (lessonId: string) => void }): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords, loading, error, retry } = useLessonLibraryData();
  const [expandedStage, setExpandedStage] = useState<JourneyStageId | 'all'>('foundation');
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<AdaptiveJourneyRecommendation | null>(null);
  const service = useMemo(() => new LessonLibraryService(catalogue, selectedDog?.id ?? null, progressRecords), [catalogue, progressRecords, selectedDog?.id]);

  let lessons: readonly LessonLibraryItem[] | null = null;
  let derivedError: unknown | null = error;
  if (!loading && !derivedError) {
    try { lessons = service.getAllLessons(); } catch (cause) { derivedError = cause; }
  }

  useEffect(() => {
    if (loading || error || !selectedDog) {
      setAdaptiveRecommendation(null);
      return;
    }

    let active = true;
    void Promise.all([
      loadAdaptiveTrainingMemory(selectedDog.id),
      loadAdaptiveSessionHistory(selectedDog.id),
    ]).then(([memory, history]) => {
      if (!active) return;
      const currentLessons = service.getAllLessons();
      setAdaptiveRecommendation(buildAdaptiveJourneyRecommendation({ lessons: currentLessons, memory, history }));
    }).catch(() => {
      if (active) setAdaptiveRecommendation(null);
    });

    return () => { active = false; };
  }, [error, loading, selectedDog, service]);

  if (loading) return <AppScreen scroll={false}><LoadingState message="Building your training journey…" /></AppScreen>;
  if (derivedError || !lessons) return <AppScreen><ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={retry} /></AppScreen>;

  const stages = createJourneyStages(lessons);
  const firstIncompleteStage = stages.find((stage) => stage.lessons.some((lesson) => lesson.state !== 'COMPLETED'))?.id ?? stages[0]?.id ?? 'foundation';
  const completedCount = lessons.filter((lesson) => lesson.state === 'COMPLETED').length;

  return <SafeAreaView style={referenceStyles.screen}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={referenceStyles.scroll} showsVerticalScrollIndicator={false}>
      {onBack ? <View style={referenceStyles.headerRow}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={({ pressed }) => [referenceStyles.iconButton, pressed && referenceStyles.pressed]}><ReferenceIcon name="back" /></Pressable><View style={{ width: 38 }} /></View> : null}
      <IdentityHeader />
      <View style={referenceStyles.header}><Text accessibilityRole="header" style={referenceStyles.title}>Your Journey</Text><Text style={referenceStyles.subtitle}>Your personalised path to success</Text></View>
      <Text style={referenceStyles.journeyIntro}>This is the recommended order. You can still choose any lesson from Categories whenever your dog needs something different.</Text>

      {adaptiveRecommendation?.action === 'switch' ? <View style={referenceScreenStyles.cardSelected}>
        <Text style={referenceScreenStyles.meta}>PLAN ADJUSTED</Text>
        <Text style={referenceScreenStyles.blockTitle}>{adaptiveRecommendation.recommendedLessonTitle}</Text>
        <Text style={referenceScreenStyles.blockIntro}>{adaptiveRecommendation.explanation}</Text>
        <Text style={referenceScreenStyles.meta}>Instead of {adaptiveRecommendation.currentLessonTitle}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open recommended lesson ${adaptiveRecommendation.recommendedLessonTitle}`} onPress={() => onOpenLesson(adaptiveRecommendation.lessonId)} style={({ pressed }) => [referenceStyles.largeGreenButton, pressed && referenceStyles.pressed]}>
          <Text style={referenceStyles.largeGreenButtonText}>Open Recommended Lesson</Text>
        </Pressable>
      </View> : null}

      <View style={referenceStyles.stageList}>
        {stages.map((stage) => {
          const complete = stage.lessons.filter((lesson) => lesson.state === 'COMPLETED').length;
          const expanded = expandedStage === 'all' || expandedStage === stage.id;
          const active = stage.id === firstIncompleteStage;
          return <View key={stage.id} style={referenceStyles.stageCard}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Stage ${stage.number}: ${stage.title}. ${complete} of ${stage.lessons.length} completed.`} accessibilityState={{ expanded }} onPress={() => setExpandedStage((current) => current === stage.id ? 'all' : stage.id)} style={({ pressed }) => [referenceStyles.stageHeader, pressed && referenceStyles.pressed]}>
              <View style={[referenceStyles.stageNumber, active && referenceStyles.stageNumberActive]}><Text style={[referenceStyles.stageNumberText, active && referenceStyles.stageNumberTextActive]}>{stage.number}</Text></View>
              <View style={referenceStyles.stageHeaderCopy}><Text style={referenceStyles.stageTitle}>Stage {stage.number}: {stage.title}</Text><Text style={referenceStyles.stageProgress}>{complete} / {stage.lessons.length} completed</Text></View>
              <ReferenceIcon name="chevron" size={18} color={referencePalette.muted} />
            </Pressable>
            {expanded ? <View style={referenceStyles.stageBody}>{stage.lessons.map((lesson) => {
              const completed = lesson.state === 'COMPLETED';
              const current = lesson.state === 'IN_PROGRESS' || lesson.state === 'AVAILABLE';
              return <Pressable key={lesson.id} accessibilityRole="button" accessibilityLabel={`${lesson.title}. ${completed ? 'Completed' : current ? 'Available' : 'Upcoming'}. Open lesson`} onPress={() => onOpenLesson(lesson.id)} style={({ pressed }) => [referenceStyles.stageLessonRow, pressed && referenceStyles.pressed]}>
                <View style={[referenceStyles.stageLessonMarker, completed && referenceStyles.stageLessonMarkerComplete, current && !completed && referenceStyles.stageLessonMarkerCurrent]}>{completed ? <ReferenceIcon name="check" size={13} color="#FFFFFF" strokeWidth={2.4} /> : current ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: referencePalette.navy }} /> : <ReferenceIcon name="lock" size={12} color={referencePalette.inactive} />}</View>
                <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={2} style={referenceStyles.stageLessonTitle}>{lesson.title}</Text><Text style={referenceStyles.stageLessonMeta}>{lesson.estimatedMinutes} min · Level {lesson.difficulty}</Text></View>
              </Pressable>;
            })}</View> : null}
          </View>;
        })}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="View full journey" onPress={() => setExpandedStage('all')} style={({ pressed }) => [referenceStyles.largeGreenButton, pressed && referenceStyles.pressed]}><Text style={referenceStyles.largeGreenButtonText}>View Full Journey</Text></Pressable>
      <Text style={[referenceStyles.smallSubtitle, { textAlign: 'center' }]}>{completedCount} of {lessons.length} lessons complete</Text>
    </ScrollView>
  </SafeAreaView>;
}

function createJourneyStages(lessons: readonly LessonLibraryItem[]): readonly JourneyStage[] {
  const stages: JourneyStage[] = [
    { id: 'foundation', number: 1, title: 'Foundation', lessons: lessons.filter((lesson) => lesson.difficulty === 1) },
    { id: 'building', number: 2, title: 'Building Skills', lessons: lessons.filter((lesson) => lesson.difficulty === 2) },
    { id: 'real-world', number: 3, title: 'Real World', lessons: lessons.filter((lesson) => lesson.difficulty === 3) },
    { id: 'lifelong', number: 4, title: 'Lifelong Skills', lessons: lessons.filter((lesson) => lesson.difficulty >= 4) },
  ];
  return stages.filter((stage) => stage.lessons.length > 0);
}
