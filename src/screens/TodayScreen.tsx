import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { IdentityHeader } from '../components/IdentityHeader';
import { LessonCompletionCelebration } from '../components/LessonCompletionCelebration';
import { ReferenceIcon } from '../components/ReferenceIcon';
import { useTodayPlan } from '../features/daily-plan/useTodayPlan';
import { getLessonImageSource } from '../features/lessons/coaching/lessonImageManifest';
import { recommendedLessons, trainingCategories } from '../features/lessons/discovery';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
import { lessonDifficultyLabels, skillLabel } from '../features/lessons/library/lessonLibraryPresentation';
import { LessonLibraryService } from '../features/lessons/library/LessonLibraryService';
import type { LessonLibraryItem } from '../features/lessons/library/lessonLibraryTypes';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { referencePalette, referenceStyles } from '../theme/referenceStyles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

export type TodayScreenProps = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Today'>, NativeStackScreenProps<RootStackParamList, 'Main'>>;
const categoryTones = [['#E8EEF8', '#6576A5'], ['#E3F4F8', '#2A83A0'], ['#FFF0C8', '#B27A16'], ['#FBE3D0', '#B76123']] as const;

export function TodayScreen({ navigation, route }: TodayScreenProps): React.JSX.Element {
  const { plan, selectedDogName, loading } = useTodayPlan();
  const library = getLibraryData();
  const onboarding = getOnboardingIdentity();
  const dog = library?.selectedDog ?? onboarding?.dog ?? null;
  const dogName = (dog?.name ?? selectedDogName ?? '').trim() || null;
  const photoUri = dog?.photoUri ?? null;
  const service = useMemo(() => library ? new LessonLibraryService(library.catalogue, library.selectedDog?.id ?? null, library.progressRecords) : null, [library?.catalogue, library?.progressRecords, library?.selectedDog?.id]);
  let allLessons: readonly LessonLibraryItem[] = [];
  try { allLessons = service?.getAllLessons() ?? []; } catch { allLessons = []; }
  const recommendations = recommendedLessons(allLessons, 3);
  const recommended = recommendations[0] ?? null;
  const jumpBack = allLessons.find((lesson) => lesson.state === 'IN_PROGRESS') ?? recommendations[1] ?? recommended;
  const nextItem = plan?.items.find((item) => !item.completed && item.lessonAvailable) ?? null;
  const allComplete = plan ? plan.status === 'completed' || (plan.items.length > 0 && plan.completedItemCount === plan.items.length) : false;
  const completedToday = plan?.completedItemCount ?? 0;
  const planTotal = plan?.items.length ?? 0;
  const planProgress = planTotal > 0 ? Math.min(100, Math.round((completedToday / planTotal) * 100)) : 0;
  const [celebration, setCelebration] = useState<{ visible: boolean; title?: string }>({ visible: false });
  const celebrateTitle = route.params?.celebrateLessonTitle;
  useEffect(() => { if (!celebrateTitle) return; setCelebration({ visible: true, title: celebrateTitle }); navigation.setParams({ celebrateLessonId: undefined, celebrateLessonTitle: undefined }); }, [celebrateTitle, navigation]);
  const openNextLesson = () => { if (nextItem && plan) navigation.navigate('LessonSummary', { lessonId: nextItem.lessonId, dailyPlanId: plan.id }); else navigation.navigate('Academy'); };
  const primaryDisabled = loading && !nextItem && !allComplete;

  return <SafeAreaView style={referenceStyles.screen}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={referenceStyles.scroll} showsVerticalScrollIndicator={false}>
      <View style={referenceStyles.homeHeader}>
        <View style={referenceStyles.homeUtilityRow}><Pressable accessibilityRole="button" accessibilityLabel="Open dogs profile" onPress={() => navigation.navigate('Profile')} style={({ pressed }) => [referenceStyles.iconButton, pressed && referenceStyles.pressed]}><ReferenceIcon name="menu" /></Pressable><View accessible accessibilityLabel="Notifications" style={referenceStyles.iconButton}><ReferenceIcon name="bell" size={20} /></View></View>
        <IdentityHeader />
      </View>
      <View style={{ gap: 9 }}>
        <View style={referenceStyles.sectionHeader}><Text style={referenceStyles.sectionTitle}>Today’s Plan</Text><Pressable accessibilityRole="button" accessibilityLabel="Your journey so far" onPress={() => navigation.navigate('Journey')}><Text style={referenceStyles.sectionLink}>View journey</Text></Pressable></View>
        <View style={referenceStyles.todayCard}>{nextItem ? <View style={referenceStyles.todayImage}><Image accessible accessibilityLabel={`${nextItem.title} lesson preview`} resizeMode="cover" source={getLessonImageSource(nextItem.lessonId, nextItem.skill)} style={referenceStyles.cardSideImageFill} /></View> : <View style={referenceStyles.todayImage} />}<View style={referenceStyles.todayCopy}><Text style={referenceStyles.cardTitle}>{nextItem?.title ?? (allComplete ? 'Plan complete' : 'Your next lesson')}</Text><Text style={referenceStyles.cardKicker}>{nextItem ? `${skillLabel(nextItem.skill)} · ${lessonDifficultyLabels[nextItem.difficultyLevel ?? 1]}` : 'Daily plan'}</Text><Text numberOfLines={2} style={referenceStyles.cardMeta}>{nextItem?.description ?? (allComplete ? 'Beautiful work today.' : 'Your plan is getting ready.')}</Text><View style={referenceStyles.progressTrack}><View style={[referenceStyles.progressFill, { width: `${planProgress}%` }]} /></View><Pressable accessibilityRole="button" accessibilityLabel={allComplete ? 'All lessons complete. Review your journey' : 'Start next lesson'} accessibilityState={{ disabled: primaryDisabled }} disabled={primaryDisabled} onPress={allComplete ? () => navigation.navigate('Journey') : openNextLesson} style={({ pressed }) => [referenceStyles.compactGreenButton, primaryDisabled && { opacity: 0.45 }, pressed && !primaryDisabled && referenceStyles.pressed]}><Text style={referenceStyles.compactGreenButtonText}>{allComplete ? 'View Journey' : 'Continue Lesson'}</Text></Pressable></View></View>
      </View>
      <View style={{ gap: 9 }}><View style={referenceStyles.sectionHeader}><Text style={referenceStyles.sectionTitle}>Recommended For You</Text><Text style={referenceStyles.sectionLink} onPress={() => navigation.navigate('Recommended')}>See all</Text></View>{recommended ? <Pressable accessibilityRole="button" accessibilityLabel={`Recommended lesson: ${recommended.title}`} onPress={() => navigation.navigate('LessonSummary', { lessonId: recommended.id })} style={({ pressed }) => [referenceStyles.recommendationCard, pressed && referenceStyles.pressed]}><View style={referenceStyles.recommendationImage}><Image accessible={false} resizeMode="cover" source={getLessonImageSource(recommended.id, recommended.skill)} style={referenceStyles.cardSideImageFill} /></View><View style={referenceStyles.recommendationCopy}><Text style={referenceStyles.cardTitle}>{recommended.title}</Text><Text style={referenceStyles.cardKicker}>{skillLabel(recommended.skill)} · {lessonDifficultyLabels[recommended.difficulty]}</Text><Text style={referenceStyles.cardMeta}>{recommended.estimatedMinutes} min</Text></View></Pressable> : null}</View>
      {jumpBack ? <View style={{ gap: 9 }}><View style={referenceStyles.sectionHeader}><Text style={referenceStyles.sectionTitle}>Jump Back In</Text><Text style={referenceStyles.sectionLink} onPress={() => navigation.navigate('Academy')}>See all</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Jump back into ${jumpBack.title}`} onPress={() => navigation.navigate('LessonSummary', { lessonId: jumpBack.id, selfDirected: true })} style={({ pressed }) => [referenceStyles.jumpBackCard, pressed && referenceStyles.pressed]}><View style={referenceStyles.jumpBackImage}><Image accessible={false} resizeMode="cover" source={getLessonImageSource(jumpBack.id, jumpBack.skill)} style={referenceStyles.cardSideImageFill} /></View><View style={referenceStyles.recommendationCopy}><Text style={referenceStyles.cardTitle}>{jumpBack.title}</Text><Text style={referenceStyles.cardKicker}>{skillLabel(jumpBack.skill)} · {lessonDifficultyLabels[jumpBack.difficulty]}</Text><View style={referenceStyles.progressTrack}><View style={[referenceStyles.progressFill, { width: jumpBack.state === 'IN_PROGRESS' ? '60%' : '18%' }]} /></View></View></Pressable></View> : null}
      <View style={{ gap: 10 }}><View style={referenceStyles.sectionHeader}><Text style={referenceStyles.sectionTitle}>Browse by Category</Text><Text style={referenceStyles.sectionLink} onPress={() => navigation.navigate('Academy')}>See all</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={referenceStyles.categoryPillsRow}>{trainingCategories.slice(0, 4).map((category, index) => { const [backgroundColor, iconColor] = categoryTones[index]!; return <Pressable key={category.skill} accessibilityRole="button" accessibilityLabel={category.label} onPress={() => navigation.navigate('LessonBrowse', { skill: category.skill })} style={({ pressed }) => [referenceStyles.categoryPill, pressed && referenceStyles.pressed]}><View style={[referenceStyles.categoryPillIcon, { backgroundColor }]}><ReferenceIcon name={category.skill} size={21} color={iconColor} /></View><Text numberOfLines={2} style={referenceStyles.categoryPillLabel}>{category.shortLabel}</Text></Pressable>; })}<Pressable accessibilityRole="button" accessibilityLabel="More categories" onPress={() => navigation.navigate('Academy')} style={({ pressed }) => [referenceStyles.categoryPill, pressed && referenceStyles.pressed]}><View style={[referenceStyles.categoryPillIcon, { backgroundColor: '#EEECE7' }]}><ReferenceIcon name="categories" size={20} color={referencePalette.text} /></View><Text style={referenceStyles.categoryPillLabel}>More</Text></Pressable></ScrollView></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Help me now with a training problem" accessibilityHint="Opens quick, safety-first guidance for what is happening right now" onPress={() => navigation.navigate('Troubleshooter', { mode: 'help-now' })} style={({ pressed }) => [referenceStyles.helpStrip, pressed && referenceStyles.pressed]}><View style={referenceStyles.helpStripCopy}><Text style={referenceStyles.helpStripTitle}>Need help right now?</Text><Text style={referenceStyles.helpStripBody}>Get one safe next step for the behaviour you are seeing.</Text></View><ReferenceIcon name="chevron" size={17} color="#8B6A34" /></Pressable>
    </ScrollView>
    <LessonCompletionCelebration visible={celebration.visible} dogName={dogName ?? 'your dog'} photoUri={photoUri} lessonTitle={celebration.title} onContinue={() => setCelebration((current) => ({ ...current, visible: false }))} testID="lesson-completion-celebration" />
  </SafeAreaView>;
}
function getOnboardingIdentity() { try { const { status } = useOnboarding(); return status?.state === 'complete' ? { dog: status.dog, ownerName: status.owner.displayName } : null; } catch { return null; } }
function getLibraryData() { try { const { catalogue, selectedDog, progressRecords } = useLessonLibraryData(); return { catalogue, selectedDog, progressRecords }; } catch { return null; } }
