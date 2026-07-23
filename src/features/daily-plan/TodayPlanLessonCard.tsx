import { Text, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { styles } from '../../theme/styles';
import type { TodayPlanItemView } from './TodayPlanTypes';

type TodayPlanLessonCardProps = {
  readonly item: TodayPlanItemView;
  readonly planOpen: boolean;
  readonly onOpen: () => void;
};

export function TodayPlanLessonCard({
  item,
  planOpen,
  onOpen,
}: TodayPlanLessonCardProps): React.JSX.Element {
  const skill = formatSkill(item.skill);
  const status = item.completed
    ? 'Completed today'
    : planOpen
      ? 'Ready to practise'
      : 'Plan closed';

  return (
    <View
      style={styles.todayPlanLessonCard}
    >
      <View style={styles.todayPlanLessonTopRow}>
        <Text style={styles.todayPlanSkillLabel}>{skill}</Text>
        <View style={[
          styles.todayPlanStatusBadge,
          item.completed && styles.todayPlanStatusBadgeCompleted,
          !item.lessonAvailable && styles.todayPlanStatusBadgeUnavailable,
        ]}>
          <Text style={styles.todayPlanStatusText}>
            {item.lessonAvailable ? status : 'Unavailable'}
          </Text>
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.todayPlanLessonTitle}>
        {item.title}
      </Text>
      <Text style={styles.todayPlanLessonDescription}>{item.description}</Text>
      <Text style={styles.todayPlanLessonMetadata}>
        {item.role === 'primary' ? 'Main lesson' : 'Reinforcement'} · {item.plannedMinutes} min
        {item.difficultyLevel ? ` · Level ${item.difficultyLevel}` : ''}
      </Text>
      {item.lessonAvailable && planOpen ? (
        <PrimaryButton
          title={item.completed ? 'Practise again' : 'View lesson'}
          accessibilityLabel={`${item.completed ? 'Practise' : 'View'} ${item.title}`}
          onPress={onOpen}
        />
      ) : item.lessonAvailable ? (
        <View accessible style={styles.todayPlanClosedNotice}>
          <Text style={styles.todayPlanClosedText}>
            Open this lesson from the Academy if you want to practise it again.
          </Text>
        </View>
      ) : (
        <View accessible accessibilityRole="alert" style={styles.todayPlanUnavailableNotice}>
          <Text style={styles.todayPlanUnavailableText}>
            Browse the Academy for a current lesson instead.
          </Text>
        </View>
      )}
    </View>
  );
}

function formatSkill(skill: TodayPlanItemView['skill']): string {
  return skill
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
