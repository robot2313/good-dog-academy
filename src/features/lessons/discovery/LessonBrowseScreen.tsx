import { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { ReferenceIcon, type ReferenceIconName } from '../../../components/ReferenceIcon';
import type { LessonDifficultyLevel } from '../../../domain/models';
import { referencePalette, referenceStyles } from '../../../theme/referenceStyles';
import type { RootStackParamList } from '../../../types/navigation';
import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { useLessonLibraryData } from '../library/LessonLibraryContext';
import { lessonCardAccessibilityLabel, lessonDifficultyLabels, lessonLibraryErrorMessage } from '../library/lessonLibraryPresentation';
import { LessonLibraryService } from '../library/LessonLibraryService';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';
import { lessonCollectionById, lessonsForDiscoveryScope, trainingCategoryForSkill, type LessonDiscoveryScope } from './lessonDiscovery';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonBrowse'>;
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
const filters: readonly { id: DifficultyFilter; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'beginner', label: 'Beginner' }, { id: 'intermediate', label: 'Intermediate' }, { id: 'advanced', label: 'Advanced' }];

export function LessonBrowseScreen({ navigation, route }: Props): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords, loading, error, retry } = useLessonLibraryData();
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const service = useMemo(() => new LessonLibraryService(catalogue, selectedDog?.id ?? null, progressRecords), [catalogue, progressRecords, selectedDog?.id]);
  const presentation = browsePresentation(route.params);
  let lessons: readonly LessonLibraryItem[] = [];
  let derivedError: unknown | null = error;
  if (!loading && !derivedError) { try { lessons = lessonsForDiscoveryScope(service.getAllLessons(), presentation.scope); } catch (cause) { derivedError = cause; } }
  if (loading) return <AppScreen scroll={false}><LoadingState message="Loading lessons…" /></AppScreen>;
  if (derivedError) return <AppScreen><ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={retry} /></AppScreen>;
  const filtered = lessons.filter((lesson) => matchesDifficulty(lesson.difficulty, difficultyFilter));
  const iconName: ReferenceIconName = route.params?.skill ?? 'categories';

  return <SafeAreaView style={referenceStyles.screen}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={referenceStyles.compactScroll} showsVerticalScrollIndicator={false}>
      <View style={referenceStyles.headerRow}><Pressable accessibilityRole="button" accessibilityLabel="Back to Categories" onPress={() => navigation.goBack()} style={({ pressed }) => [referenceStyles.iconButton, pressed && referenceStyles.pressed]}><ReferenceIcon name="back" /></Pressable><View style={{ flex: 1 }} /></View>
      <View style={referenceStyles.browseHeaderIdentity}><View style={[referenceStyles.categoryIconBox, { backgroundColor: '#E9F3E6' }]}><ReferenceIcon name={iconName} color={referencePalette.greenDark} size={22} /></View><View style={referenceStyles.browseTitleCopy}><Text accessibilityRole="header" style={[referenceStyles.title, { fontSize: 22, lineHeight: 27 }]}>{presentation.title}</Text><Text style={referenceStyles.smallSubtitle}>{lessons.length} lessons</Text></View></View>
      <View style={referenceStyles.browseHero}><Image accessible accessibilityLabel={`${presentation.title} training photograph`} resizeMode="cover" source={getLessonImageSource(presentation.anchorLessonId, route.params?.skill)} style={referenceStyles.browseHeroImage} /><View style={referenceStyles.browseHeroCopy}><Text style={referenceStyles.browseHeroDescription}>{presentation.intro}</Text></View></View>
      <View accessibilityRole="radiogroup" accessibilityLabel="Lesson difficulty" style={referenceStyles.chipRow}>{filters.map((filter) => { const active = difficultyFilter === filter.id; return <Pressable key={filter.id} accessibilityRole="button" accessibilityLabel={filter.label} accessibilityState={{ selected: active }} onPress={() => setDifficultyFilter(filter.id)} style={({ pressed }) => [referenceStyles.filterChip, active && referenceStyles.filterChipActive, pressed && referenceStyles.pressed]}><Text style={[referenceStyles.filterChipText, active && referenceStyles.filterChipTextActive]}>{filter.label}</Text></Pressable>; })}</View>
      <View style={referenceStyles.lessonList}>{filtered.map((lesson, index) => <Pressable key={lesson.id} accessibilityRole="button" accessibilityLabel={lessonCardAccessibilityLabel(lesson, true)} onPress={() => navigation.navigate('LessonSummary', { lessonId: lesson.id, selfDirected: true })} style={({ pressed }) => [referenceStyles.lessonRow, pressed && referenceStyles.pressed]}>
        <Text style={referenceStyles.lessonRowNumber}>{index + 1}.</Text><Image accessible={false} resizeMode="cover" source={getLessonImageSource(lesson.id, lesson.skill)} style={referenceStyles.lessonRowImage} /><View style={referenceStyles.lessonRowCopy}><Text numberOfLines={2} style={referenceStyles.lessonRowTitle}>{lesson.title}</Text><Text style={referenceStyles.lessonRowMeta}>{lessonDifficultyLabels[lesson.difficulty]} · {lesson.estimatedMinutes} min</Text>{lesson.state === 'COMPLETED' ? <Text style={referenceStyles.lessonRowState}>Completed</Text> : lesson.state === 'IN_PROGRESS' ? <Text style={referenceStyles.lessonRowState}>In progress</Text> : null}</View><ReferenceIcon name="chevron" size={17} color={referencePalette.inactive} />
      </Pressable>)}</View>
      {filtered.length === 0 ? <View style={referenceStyles.categoryFooter}><Text style={referenceStyles.sectionTitle}>No lessons at this level</Text><Text style={referenceStyles.smallSubtitle}>Choose another difficulty to see available lessons.</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}

function browsePresentation(params: Props['route']['params']): { scope: LessonDiscoveryScope; title: string; intro: string; anchorLessonId: string } {
  if (params?.skill) { const category = trainingCategoryForSkill(params.skill); return { scope: { type: 'skill', skill: params.skill }, title: category.label, intro: category.description, anchorLessonId: category.anchorLessonId }; }
  if (params?.collectionId) { const collection = lessonCollectionById(params.collectionId); return { scope: { type: 'collection', collectionId: collection.id }, title: collection.label, intro: `${collection.ageLabel}. ${collection.description}`, anchorLessonId: collection.anchorLessonId }; }
  if (params?.recommended) return { scope: { type: 'recommended' }, title: 'Recommended', intro: 'Lessons selected from current progress and available next steps.', anchorLessonId: 'focus-check-in' };
  return { scope: { type: 'all' }, title: 'All Lessons', intro: 'Choose any lesson that fits what your dog needs today.', anchorLessonId: 'focus-check-in' };
}
function matchesDifficulty(difficulty: LessonDifficultyLevel, filter: DifficultyFilter): boolean { if (filter === 'all') return true; if (filter === 'beginner') return difficulty <= 2; if (filter === 'intermediate') return difficulty === 3; return difficulty >= 4; }
