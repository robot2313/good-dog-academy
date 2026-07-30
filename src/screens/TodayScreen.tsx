import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Metric } from '../components/Metric';
import { PremiumCard } from '../components/PremiumCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionHeader } from '../components/SectionHeader';
import { TodayPlanLessonCard } from '../features/daily-plan/TodayPlanLessonCard';
import { useTodayPlan } from '../features/daily-plan/useTodayPlan';
import type { TodayPlanError } from '../features/daily-plan/TodayPlanError';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

export type TodayScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Today'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function TodayScreen({ navigation }: TodayScreenProps): React.JSX.Element {
  const { plan, selectedDogName, loading, error, retry } = useTodayPlan();
  const onboardingDog = getOnboardingDog();
  const dogName = selectedDogName ?? onboardingDog?.name ?? 'My Dog';
  const photoUri = onboardingDog?.photoUri ?? null;

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <LoadingState message="Preparing today's training plan…" />
      </AppScreen>
    );
  }

  if (error?.code === 'NO_ELIGIBLE_LESSONS') {
    return (
      <AppScreen>
        <Text style={styles.eyebrowDark}>TODAY'S PRIVATE PLAN</Text>
        <Text accessibilityRole="header" style={styles.pageTitle}>
          No Daily Plan lessons today
        </Text>
        <EmptyState
          title="Keep training at your dog's pace"
          message="There are no suitable Daily Plan lessons available right now. Browse the Academy to review guidance or choose another available lesson."
          actionTitle="Browse all 30 lessons"
          onAction={() => navigation.navigate('Academy')}
        />
      </AppScreen>
    );
  }

  if (error || !plan) {
    return (
      <AppScreen>
        <Text style={styles.eyebrowDark}>TODAY'S PRIVATE PLAN</Text>
        <Text accessibilityRole="header" style={styles.pageTitle}>
          Today's training plan
        </Text>
        <ErrorState
          message={todayPlanErrorMessage(error)}
          onRetry={retry}
        />
        <PrimaryButton
          title="Browse all 30 lessons"
          onPress={() => navigation.navigate('Academy')}
        />
      </AppScreen>
    );
  }

  const planComplete =
    plan.status === 'completed'
    || (
      plan.items.length > 0
      && plan.completedItemCount === plan.items.length
    );
  const planHeading = plan.items.length === 1
    ? 'One focused lesson today.'
    : `${plan.items.length} focused lessons today.`;

  return (
    <AppScreen>
      <DogIdentityHero
        dogName={dogName}
        photoUri={photoUri}
        eyebrow="TODAY'S PRIVATE PLAN"
        title={planComplete ? "Today's plan is complete." : planHeading}
        supportingText="Build reliability through short, successful sessions selected for your dog."
        size="standard"
        status={(
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>
              {planComplete ? 'COMPLETE' : 'READY'}
            </Text>
          </View>
        )}
      />
      <PremiumCard tone="forest">
        <View style={styles.metricRow}>
          <Metric value={`${plan.completedItemCount}/${plan.items.length}`} label="completed" />
          <Metric value={`${plan.estimatedMinutes} min`} label="planned" />
          <Metric value={plan.items.length} label={plan.items.length === 1 ? 'lesson' : 'lessons'} />
        </View>
      </PremiumCard>
      <View style={styles.todayPlanSectionHeader}>
        <SectionHeader
          title="Today's lessons"
          supportingText="Complete these guided sessions in any comfortable order."
        />
      </View>
      {plan.stale ? (
        <View accessible accessibilityRole="alert" style={styles.todayPlanStaleCard}>
          <Text style={styles.todayPlanStaleTitle}>Part of this plan is out of date</Text>
          <Text style={styles.todayPlanStaleText}>
            An older saved lesson is no longer in the Academy. It has been left visible but cannot be opened.
          </Text>
        </View>
      ) : null}
      {plan.items.map((item) => (
        <TodayPlanLessonCard
          key={item.lessonId}
          item={item}
          planOpen={plan.status === 'planned'}
          onOpen={() => navigation.navigate('LessonSummary', {
            lessonId: item.lessonId,
            dailyPlanId: plan.id,
          })}
        />
      ))}
      <PremiumCard tone="elevated">
        <Text accessibilityRole="header" style={styles.sectionTitle}>Explore the Academy</Text>
        <Text style={styles.body}>
          Search all 30 lessons, review coaching guidance, or practise another available skill.
        </Text>
        <PrimaryButton
          title="Browse all 30 lessons"
          onPress={() => navigation.navigate('Academy')}
        />
      </PremiumCard>
    </AppScreen>
  );
}

function todayPlanErrorMessage(error: TodayPlanError | null): string {
  if (error?.code === 'INVALID_TIMEZONE') {
    return 'Your device timezone could not be validated. Check the device date and timezone settings, then try again.';
  }
  if (error?.code === 'CORRUPT_STORED_DATA') {
    return 'Today’s plan could not be read safely. Your saved training data was not changed.';
  }
  if (
    error?.code === 'OWNER_NOT_FOUND'
    || error?.code === 'DOG_NOT_FOUND'
    || error?.code === 'DOG_OWNERSHIP_MISMATCH'
    || error?.code === 'PLAN_OWNERSHIP_MISMATCH'
  ) {
    return 'Today’s plan is not available for the selected dog.';
  }
  return 'Today’s training plan could not be loaded. Please try again.';
}

function getOnboardingDog() {
  try {
    const { status } = useOnboarding();
    return status?.state === 'complete' ? status.dog : null;
  } catch {
    return null;
  }
}
