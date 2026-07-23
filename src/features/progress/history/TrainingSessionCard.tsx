import type { PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';
import { Pressable, Text, View } from 'react-native';

import type { BehaviourSkill, TrainingOutcome } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import type {
  TrainingHistoryEntry,
  TrainingHistoryRatingBand,
} from './TrainingHistoryTypes';

type TrainingSessionCardProps = {
  entry: TrainingHistoryEntry;
  onPress: () => void;
};

export function TrainingSessionCard({
  entry,
  onPress,
}: TrainingSessionCardProps): React.JSX.Element {
  const dateLabel = formatHistoryLocalDate(entry.localDate);
  const skillLabel = formatHistorySkill(entry.skill);
  const outcomeLabel = historyOutcomeLabel(entry.outcome);
  const ratingLabel = formatRatingBand(entry.ratingBand);
  const notes = entry.notes.trim();
  const accessibilityLabel = [
    entry.lessonTitle,
    skillLabel,
    `Completed ${dateLabel}`,
    `${entry.durationMinutes} minutes`,
    `Outcome: ${outcomeLabel}`,
    `Rating range ${ratingLabel}`,
    notes ? `Notes: ${notes}` : null,
  ].filter(Boolean).join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens session details"
      onPress={onPress}
      style={sessionCardStyle}
    >
      <View style={styles.historyCardTopRow}>
        <Text style={styles.historySkillLabel}>{skillLabel}</Text>
        <View style={outcomeBadgeStyle(entry.outcome)}>
          <Text style={styles.historyOutcomeText}>{outcomeLabel}</Text>
        </View>
      </View>
      <Text style={styles.historySessionTitle}>{entry.lessonTitle}</Text>
      <View style={styles.historyMetadataRow}>
        <Text style={styles.historyMetadataText}>{dateLabel}</Text>
        <Text style={styles.historyMetadataDot}>•</Text>
        <Text style={styles.historyMetadataText}>{entry.durationMinutes} min</Text>
        <Text style={styles.historyMetadataDot}>•</Text>
        <Text style={styles.historyMetadataText}>Rating {ratingLabel}</Text>
      </View>
      {notes ? <Text numberOfLines={2} style={styles.historyNotesPreview}>{notes}</Text> : null}
      <Text style={styles.historyCardAction}>View session details</Text>
    </Pressable>
  );
}

export function historyOutcomeLabel(outcome: TrainingOutcome): string {
  if (outcome === 'success') return 'Successful';
  if (outcome === 'partial-success') return 'Partly successful';
  return 'Unsuccessful';
}

export function formatHistorySkill(skill: BehaviourSkill | null): string {
  if (!skill) return 'Skill unavailable';
  return skill
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatHistoryLocalDate(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return localDate;
  const date = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ));
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRatingBand(band: TrainingHistoryRatingBand): string {
  return band.replace('-', '–');
}

function sessionCardStyle({
  pressed,
}: PressableStateCallbackType): StyleProp<ViewStyle> {
  return [styles.historySessionCard, pressed && styles.pressed];
}

function outcomeBadgeStyle(
  outcome: TrainingOutcome,
): StyleProp<ViewStyle> {
  if (outcome === 'success') {
    return [styles.historyOutcomeBadge, styles.historyOutcomeSuccess];
  }
  if (outcome === 'partial-success') {
    return [styles.historyOutcomeBadge, styles.historyOutcomePartial];
  }
  return [styles.historyOutcomeBadge, styles.historyOutcomeUnsuccessful];
}
