import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DogAvatar } from '../components/DogAvatar';
import { HomeGradientBackground } from '../components/HomeGradientBackground';
import { LessonCompletionCelebration } from '../components/LessonCompletionCelebration';
import { useTodayPlan } from '../features/daily-plan/useTodayPlan';
import { homeWelcomeMessage } from '../features/home/homeWelcomeMessage';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
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
    const { selectedDog, progressRecords } = useLessonLibraryData();
    return { selectedDog, progressRecords };
  } catch {
    return null;
  }
}
