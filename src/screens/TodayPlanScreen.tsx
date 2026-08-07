import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { IdentityHeader } from '../components/IdentityHeader';
import { LoadingState } from '../components/LoadingState';
import { TodayPlanLessonCard } from '../features/daily-plan/TodayPlanLessonCard';
import { useTodayPlan } from '../features/daily-plan/useTodayPlan';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

export type TodayPlanScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Plan'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function TodayPlanScreen({ navigation }: TodayPlanScreenProps): React.JSX.Element {
  const { plan, loading, error, selectedDogName, retry } = useTodayPlan();

  if (loading) {
    return <AppScreen scroll={false}><LoadingState message="Preparing today’s training…" /></AppScreen>;
  }

  if (error || !plan) {
    return (
      <AppScreen>
        <Text style={styles.screenLabel}>TODAY</Text>
        <Text accessibilityRole="header" style={styles.pageTitle}>Today’s Plan</Text>
        <ErrorState message="We couldn’t load today’s training plan." onRetry={retry} />
      </AppScreen>
    );
  }

  const allComplete = plan.status === 'completed'
    || (plan.items.length > 0 && plan.completedItemCount === plan.items.length);
  const progressWidth = `${plan.items.length > 0 ? Math.round((plan.completedItemCount / plan.items.length) * 100) : 0}%` as `${number}%`;

  return (
    <AppScreen>
      <IdentityHeader />
      <View style={styles.referenceScreenHeader}>
        <Text style={styles.referenceScreenTitle}>Today</Text>
        <Text style={styles.referenceScreenIntro}>
          {allComplete
            ? `Great work — ${selectedDogName ?? 'your dog'} has finished today’s plan.`
            : `A focused plan for ${selectedDogName ?? 'your dog'}, built from current progress.`}
        </Text>
      </View>

      <View style={styles.todaySummaryCard}>
        <View style={styles.todaySummaryTopRow}>
          <View>
            <Text style={styles.todaySummaryKicker}>TODAY’S PLAN</Text>
            <Text style={styles.todaySummaryTitle}>{plan.completedItemCount} of {plan.items.length} complete</Text>
          </View>
          <View style={styles.todaySummaryMinutes}>
            <Text style={styles.todaySummaryMinutesValue}>{plan.estimatedMinutes}</Text>
            <Text style={styles.todaySummaryMinutesLabel}>MIN</Text>
          </View>
        </View>
        <View style={styles.todaySummaryTrack}>
          <View
            style={[
              styles.todaySummaryFill,
              { width: progressWidth },
            ]}
          />
        </View>
        <Text style={styles.todaySummaryBody}>
          {allComplete
            ? 'You can revisit any lesson or choose something new from the Library.'
            : 'Keep sessions short, positive and easy enough for your dog to succeed.'}
        </Text>
      </View>

      <View style={styles.todayLessonList}>
        {plan.items.map((item) => (
          <TodayPlanLessonCard
            key={item.lessonId}
            item={item}
            planOpen={!allComplete}
            onOpen={() => navigation.navigate('LessonSummary', {
              lessonId: item.lessonId,
              dailyPlanId: plan.id,
            })}
          />
        ))}
      </View>
    </AppScreen>
  );
}
