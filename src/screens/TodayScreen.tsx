import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DogAvatar } from '../components/DogAvatar';
import { HomeDogName } from '../components/HomeDogName';
import { HomeGradientBackground } from '../components/HomeGradientBackground';
import { LessonCompletionCelebration } from '../components/LessonCompletionCelebration';
import { useTodayPlan } from '../features/daily-plan/useTodayPlan';
import { homeWelcomeMessage } from '../features/home/homeWelcomeMessage';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
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
  const { width } = useWindowDimensions();

  const avatarSize = Math.round(Math.max(196, Math.min(248, width * 0.6)));
  const nameWidth = Math.round(Math.min(width - 40, 360));

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

  return (
    <View style={styles.homeRoot}>
      <StatusBar style="light" />
      <HomeGradientBackground />
      <SafeAreaView edges={['top', 'bottom']} style={styles.homeSafe}>
        <View style={styles.homeBody}>
          <View style={{ flex: 0.6 }} />
          <View style={styles.homeHeroBlock}>
            <View style={styles.homePhotoRing}>
              <DogAvatar decorative dogName={dogName ?? 'Dog'} photoUri={photoUri} size={avatarSize} />
            </View>
            <HomeDogName dogName={dogName ?? ''} width={nameWidth} />
          </View>

          <View style={{ height: 14 }} />

          <View style={styles.homeWelcome} accessible accessibilityRole="summary">
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

          <View style={{ flex: 1 }} />

          <View style={styles.homeButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={allComplete ? 'All lessons complete. Review your journey' : 'Start next lesson'}
              accessibilityState={{ disabled: primaryDisabled }}
              disabled={primaryDisabled}
              onPress={allComplete ? () => navigation.navigate('Journey') : openNextLesson}
              style={({ pressed }) => [
                styles.homeButton,
                styles.homeButtonPrimaryGlow,
                primaryDisabled && styles.disabled,
                pressed && !primaryDisabled && styles.homeButtonPressed,
              ]}
            >
              <Text style={styles.homeButtonText}>{primaryLabel}</Text>
            </Pressable>
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

          <View style={{ height: 10 }} />
        </View>
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
