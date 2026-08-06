import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DogAvatar } from '../components/DogAvatar';
import { HomeGradientBackground } from '../components/HomeGradientBackground';
import { LessonCompletionCelebration } from '../components/LessonCompletionCelebration';
import { useTodayPlan } from '../features/daily-plan/useTodayPlan';
import { homeWelcomeMessage } from '../features/home/homeWelcomeMessage';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
import { LessonLibraryService } from '../features/lessons/library/LessonLibraryService';
import { LifeStageCard, RecommendedLessonCard, TrainingCategoryCard } from '../features/lessons/discovery/LessonDiscoveryCards';
import { lessonCollections, recommendedLessons, trainingCategories } from '../features/lessons/discovery';
import { getLessonImageSource } from '../features/lessons/coaching/lessonImageManifest';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

export type TodayScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Today'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function TodayScreen({ navigation, route }: TodayScreenProps): React.JSX.Element {
  const { plan, selectedDogName, loading } = useTodayPlan();
  const library = getLibraryData();
  const onboardingDog = getOnboardingDog();
  const dog = library?.selectedDog ?? onboardingDog ?? null;
  const dogName = (dog?.name ?? selectedDogName ?? '').trim() || null;
  const photoUri = dog?.photoUri ?? null;
  const progress = library?.progressRecords ?? [];
  const sessionCount = progress.reduce((total, record) => total + Math.max(0, record.attempts), 0);
  const successfulTotal = progress.reduce((total, record) => total + Math.max(0, record.successfulCompletions), 0);
  const completedLessons = progress.filter((record) => record.status === 'completed').length;
  const successRate = sessionCount > 0 ? successfulTotal / sessionCount : null;
  const message = homeWelcomeMessage({ dogName, completedLessons, sessionCount, successRate });
  const discoveryService = useMemo(
    () => library ? new LessonLibraryService(library.catalogue, library.selectedDog?.id ?? null, library.progressRecords) : null,
    [library?.catalogue, library?.progressRecords, library?.selectedDog?.id],
  );
  let recommendations = [] as ReturnType<typeof recommendedLessons>;
  try {
    recommendations = discoveryService ? recommendedLessons(discoveryService.getAllLessons(), 3) : [];
  } catch {
    recommendations = [];
  }
  const categoryCounts = new Map(trainingCategories.map((category) => [
    category.skill,
    library?.catalogue.definitions.filter((lesson) => lesson.skill === category.skill && lesson.isActive).length ?? 0,
  ]));

  const nextItem = plan?.items.find((item) => !item.completed && item.lessonAvailable) ?? null;
  const allComplete = plan
    ? plan.status === 'completed'
      || (plan.items.length > 0 && plan.completedItemCount === plan.items.length)
    : false;

  // One-time celebration over Home after a lesson is completed and saved.
  const [celebration, setCelebration] = useState<{ visible: boolean; title?: string }>({ visible: false });
  const celebrateTitle = route.params?.celebrateLessonTitle;
  useEffect(() => {
    if (!celebrateTitle) return;
    setCelebration({ visible: true, title: celebrateTitle });
    navigation.setParams({ celebrateLessonId: undefined, celebrateLessonTitle: undefined });
  }, [celebrateTitle, navigation]);

  const openNextLesson = () => {
    if (nextItem && plan) {
      navigation.navigate('LessonSummary', { lessonId: nextItem.lessonId, dailyPlanId: plan.id });
      return;
    }
    navigation.navigate('Academy');
  };

  const primaryLabel = allComplete ? 'All Lessons Complete' : 'Start Next Lesson';
  const primaryDisabled = loading && !nextItem && !allComplete;
  const completedToday = plan?.completedItemCount ?? 0;
  const planTotal = plan?.items.length ?? 0;

  return (
    <View style={styles.homeRoot}>
      <StatusBar style="dark" />
      <HomeGradientBackground />
      <SafeAreaView edges={['top', 'bottom']} style={styles.homeSafe}>
        <ScrollView
          contentContainerStyle={styles.homeBody}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.homeTopBar}>
            <View style={styles.homeTopBarCopy}>
              <Text style={styles.homeBrand}>GOOD DOG ACADEMY</Text>
              <Text style={styles.homeTodayLabel}>Today with</Text>
              <Text accessibilityLabel={dogName ?? 'Your dog'} style={styles.homeDogName}>
                {dogName ?? 'Your dog'}
              </Text>
            </View>
            <View style={styles.homeHeaderAside}>
              <View
                accessible
                accessibilityLabel={`${completedToday} of ${planTotal} planned lessons complete`}
                style={styles.homePlanProgress}
              >
                <Text style={styles.homePlanProgressValue}>{completedToday}/{planTotal}</Text>
                <Text style={styles.homePlanProgressLabel}>DONE</Text>
              </View>
              <View style={styles.homeSmallAvatar}>
                <DogAvatar decorative dogName={dogName ?? 'Dog'} photoUri={photoUri} size={52} />
              </View>
            </View>
          </View>

          <View style={styles.homePlanCard}>
            <View style={styles.homePlanCardTopRow}>
              <Text style={styles.homePlanKicker}>{allComplete ? 'TODAY COMPLETE' : 'UP NEXT'}</Text>
              {nextItem ? (
                <Text style={styles.homePlanMinutes}>{nextItem.plannedMinutes} MIN</Text>
              ) : null}
            </View>

            {nextItem ? (
              <>
                <View style={styles.homePlanImageFrame}>
                  <Image
                    accessible
                    accessibilityLabel={`${nextItem.title} lesson preview`}
                    resizeMode="cover"
                    source={getLessonImageSource(nextItem.lessonId, nextItem.skill)}
                    style={styles.homePlanImage}
                  />
                  <View pointerEvents="none" style={styles.homePlanImageTone} />
                  <View style={styles.homePlanImageBadge}>
                    <Text style={styles.homePlanImageBadgeText}>
                      {nextItem.skill.replaceAll('-', ' ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.homePlanLessonCopy}>
                  <Text style={styles.homePlanLessonTitle}>{nextItem.title}</Text>
                  <Text numberOfLines={3} style={styles.homePlanLessonDescription}>
                    {nextItem.description}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.homePlanCompleteCopy}>
                <Text style={styles.homePlanLessonTitle}>
                  {allComplete ? 'Beautiful work today' : 'Your plan is getting ready'}
                </Text>
                <Text style={styles.homePlanLessonDescription}>
                  {allComplete
                    ? `You and ${dogName ?? 'your dog'} have finished today’s planned training.`
                    : 'Your next recommended lesson will appear here.'}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={allComplete ? 'All lessons complete. Review your journey' : 'Start next lesson'}
              accessibilityState={{ disabled: primaryDisabled }}
              disabled={primaryDisabled}
              onPress={allComplete ? () => navigation.navigate('Journey') : openNextLesson}
              style={({ pressed }) => [
                styles.homePrimaryButton,
                primaryDisabled && styles.disabled,
                pressed && !primaryDisabled && styles.homeButtonPressed,
              ]}
            >
              <Text style={styles.homePrimaryButtonText}>{primaryLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.homeDiscoverySection}>
            <View style={styles.discoverySectionHeader}>
              <View style={styles.discoverySectionHeaderCopy}>
                <Text style={styles.discoverySectionKicker}>RECOMMENDED FOR YOU</Text>
                <Text accessibilityRole="header" style={styles.discoverySectionTitle}>What to train next</Text>
              </View>
              <Text style={styles.discoverySectionLink} onPress={() => navigation.navigate('LessonBrowse', { recommended: true })}>See all</Text>
            </View>
            {recommendations.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryHorizontalContent}>
                {recommendations.map((lesson) => (
                  <RecommendedLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onPress={() => navigation.navigate('LessonSummary', { lessonId: lesson.id })}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.discoveryEmptyText}>Your recommendations will appear as soon as lesson progress is ready.</Text>
            )}
          </View>

          <View style={styles.homeDiscoverySection}>
            <View style={styles.discoverySectionHeader}>
              <View style={styles.discoverySectionHeaderCopy}>
                <Text style={styles.discoverySectionKicker}>CHOOSE YOUR OWN PATH</Text>
                <Text accessibilityRole="header" style={styles.discoverySectionTitle}>Browse by category</Text>
              </View>
              <Text style={styles.discoverySectionLink} onPress={() => navigation.navigate('Academy')}>See all</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryHorizontalContent}>
              {trainingCategories.map((category) => (
                <TrainingCategoryCard
                  key={category.skill}
                  category={category}
                  compact
                  lessonCount={categoryCounts.get(category.skill) ?? 0}
                  onPress={() => navigation.navigate('LessonBrowse', { skill: category.skill })}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.homeDiscoverySection}>
            <View style={styles.discoverySectionHeaderCopy}>
              <Text style={styles.discoverySectionKicker}>LESSONS FOR YOUR DOG</Text>
              <Text accessibilityRole="header" style={styles.discoverySectionTitle}>Puppy, adult, senior or rescue</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryHorizontalContent}>
              {lessonCollections.map((collection) => (
                <LifeStageCard
                  key={collection.id}
                  collection={collection}
                  compact
                  lessonCount={collection.lessonIds.length}
                  onPress={() => navigation.navigate('LessonBrowse', { collectionId: collection.id })}
                />
              ))}
            </ScrollView>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Help me now with a training problem"
            accessibilityHint="Opens quick, safety-first guidance for what is happening right now"
            onPress={() => navigation.navigate('Troubleshooter', { mode: 'help-now' })}
            style={({ pressed }) => [
              styles.homeHelpNowCard,
              pressed && styles.homeButtonPressed,
            ]}
          >
            <View style={styles.homeHelpNowCopy}>
              <Text style={styles.homeHelpNowKicker}>HELP ME NOW</Text>
              <Text style={styles.homeHelpNowTitle}>Something happening right now?</Text>
              <Text style={styles.homeHelpNowBody}>Get one safe next step, then tell us whether it helped.</Text>
            </View>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.homeHelpNowAction}>
              <Text style={styles.homeHelpNowActionText}>OPEN</Text>
              <Text style={styles.homeHelpNowArrow}>{'>'}</Text>
            </View>
          </Pressable>

          <View style={styles.homeWelcome} accessible accessibilityRole="summary">
            <Text style={styles.homeWelcomeKicker}>COACH NOTE</Text>
            <Text style={styles.homeWelcomeTitle}>{message.title}</Text>
            {message.lines.map((line, index) => (
              <Text
                key={`home-welcome-${index}`}
                style={line.startsWith('For the complete report') ? styles.homeWelcomeReport : styles.homeWelcomeLine}
              >
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.homeButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Your journey so far"
              onPress={() => navigation.navigate('Journey')}
              style={({ pressed }) => [
                styles.homeButton,
                pressed && styles.homeButtonPressed,
              ]}
            >
              <Text style={styles.homeButtonText}>Your Journey So Far</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <LessonCompletionCelebration
        visible={celebration.visible}
        dogName={dogName ?? 'your dog'}
        photoUri={photoUri}
        lessonTitle={celebration.title}
        onContinue={() => setCelebration((current) => ({ ...current, visible: false }))}
        testID="lesson-completion-celebration"
      />
    </View>
  );
}

function getOnboardingDog() {
  try {
    const { status } = useOnboarding();
    return status?.state === 'complete' ? status.dog : null;
  } catch {
    return null;
  }
}

function getLibraryData() {
  try {
    const { catalogue, selectedDog, progressRecords } = useLessonLibraryData();
    return { catalogue, selectedDog, progressRecords };
  } catch {
    return null;
  }
}
