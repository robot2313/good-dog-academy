import { Text, View } from 'react-native';

import { LessonThumbnail } from '../../components/LessonThumbnail';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StatusPill, type StatusPillTone } from '../../components/StatusPill';
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
  const statusLabel = item.lessonAvailable ? status : 'Unavailable';
  const statusTone: StatusPillTone = !item.lessonAvailable
    ? 'error'
    : item.completed
      ? 'success'
      : planOpen
        ? 'warning'
        : 'neutral';

  return (
    <PremiumCard
      tone={item.completed ? 'selected' : 'elevated'}
      style={styles.todayPlanLessonCard}
    >
      <View style={styles.todayPlanLessonTopRow}>
        <Text style={styles.todayPlanSkillLabel}>{skill}</Text>
        <StatusPill label={statusLabel} tone={statusTone} />
      </View>
      <View style={styles.todayPlanLessonVisualRow}>
        <LessonThumbnail
          decorative
          skill={item.skill}
          lessonTitle={item.title}
        />
        <View style={styles.todayPlanLessonCopy}>
          <Text accessibilityRole="header" style={styles.todayPlanLessonTitle}>
            {item.title}
          </Text>
          <Text style={styles.todayPlanLessonDescription}>{item.description}</Text>
        </View>
      </View>
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
    </PremiumCard>
  );
}

function formatSkill(skill: TodayPlanItemView['skill']): string {
  return skill
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
