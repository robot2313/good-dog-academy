import { StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '../../../components/PremiumCard';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../../theme/tokens';
import type { PassportEvidenceLevel, PassportSkillRecord } from './DogLearningPassportTypes';

export function PassportSkillCard({ record }: { readonly record: PassportSkillRecord }): React.JSX.Element {
  const level = evidenceLabel(record.evidenceLevel);
  const environments = record.reliableEnvironments.length > 0
    ? record.reliableEnvironments
    : record.improvingEnvironments;
  const environmentPrefix = record.reliableEnvironments.length > 0 ? 'Reliable in' : 'Improving in';
  const accessibilityLabel = [
    record.title,
    level,
    `${record.completedSessions} completed sessions`,
    `${record.completedLessons} completed lessons`,
    environments.length > 0 ? `${environmentPrefix} ${environments.join(', ')}` : null,
  ].filter(Boolean).join('. ');

  return (
    <PremiumCard accessibilityLabel={accessibilityLabel} style={componentStyles.card}>
      <View style={componentStyles.headingRow}>
        <Text style={componentStyles.title}>{record.title}</Text>
        <View style={[componentStyles.badge, badgeStyle(record.evidenceLevel)]}>
          <Text style={[componentStyles.badgeText, badgeTextStyle(record.evidenceLevel)]}>{level}</Text>
        </View>
      </View>
      <Text style={componentStyles.explanation}>{evidenceExplanation(record)}</Text>
      {record.evidenceLevel !== 'not-recorded' ? (
        <View style={componentStyles.metrics}>
          <Text style={componentStyles.metric}>{record.completedSessions} sessions</Text>
          <Text style={componentStyles.dot}>•</Text>
          <Text style={componentStyles.metric}>{record.completedLessons} lessons</Text>
          <Text style={componentStyles.dot}>•</Text>
          <Text style={componentStyles.metric}>{record.helpAttempts} real-world checks</Text>
        </View>
      ) : null}
      {environments.length > 0 ? (
        <View style={componentStyles.environments}>
          <Text style={componentStyles.environmentLabel}>{environmentPrefix}</Text>
          <View style={componentStyles.chips}>
            {environments.map((environment) => (
              <Text key={environment} style={componentStyles.chip}>{environment}</Text>
            ))}
          </View>
        </View>
      ) : null}
    </PremiumCard>
  );
}

function evidenceLabel(level: PassportEvidenceLevel): string {
  if (level === 'reliable') return 'Reliable here';
  if (level === 'growing') return 'Growing';
  if (level === 'started') return 'Started';
  return 'Not recorded';
}

function evidenceExplanation(record: PassportSkillRecord): string {
  if (record.evidenceLevel === 'reliable') return 'Reliability was explicitly reported in the environment shown below. New places still begin easier.';
  if (record.evidenceLevel === 'growing') return 'There is positive evidence from a lesson, session, or real-world check, but not enough to claim reliability.';
  if (record.evidenceLevel === 'started') return 'Practice is recorded, but a positive result has not been recorded yet.';
  return 'No completed lesson, session, or Help Me Now result has been recorded for this skill.';
}

function badgeStyle(level: PassportEvidenceLevel) {
  if (level === 'reliable') return componentStyles.badgeReliable;
  if (level === 'growing') return componentStyles.badgeGrowing;
  if (level === 'started') return componentStyles.badgeStarted;
  return componentStyles.badgeEmpty;
}

function badgeTextStyle(level: PassportEvidenceLevel) {
  if (level === 'reliable') return componentStyles.badgeReliableText;
  if (level === 'growing') return componentStyles.badgeGrowingText;
  if (level === 'started') return componentStyles.badgeStartedText;
  return componentStyles.badgeEmptyText;
}

const componentStyles = StyleSheet.create({
  card: { borderRadius: radiusTokens.md, padding: spacingTokens.md, gap: spacingTokens.xs },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacingTokens.sm },
  title: { ...typographyTokens.cardTitle, flex: 1, color: colorTokens.text.primary },
  badge: { flexShrink: 0, borderRadius: radiusTokens.pill, paddingHorizontal: spacingTokens.sm, paddingVertical: spacingTokens.xs, borderWidth: 1 },
  badgeText: { ...typographyTokens.caption, fontWeight: '900' },
  badgeReliable: { backgroundColor: colorTokens.status.successSurface, borderColor: colorTokens.status.successText },
  badgeReliableText: { color: colorTokens.status.successText },
  badgeGrowing: { backgroundColor: colorTokens.surface.selected, borderColor: colorTokens.brand.primary },
  badgeGrowingText: { color: colorTokens.brand.primary },
  badgeStarted: { backgroundColor: colorTokens.status.infoSurface, borderColor: colorTokens.status.infoText },
  badgeStartedText: { color: colorTokens.status.infoText },
  badgeEmpty: { backgroundColor: colorTokens.status.neutralSurface, borderColor: colorTokens.border.strong },
  badgeEmptyText: { color: colorTokens.status.neutralText },
  explanation: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacingTokens.xs },
  metric: { ...typographyTokens.caption, color: colorTokens.text.primary },
  dot: { ...typographyTokens.caption, color: colorTokens.text.accent },
  environments: { gap: spacingTokens.xs },
  environmentLabel: { ...typographyTokens.label, color: colorTokens.text.accent, textTransform: 'uppercase', letterSpacing: 0.7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacingTokens.xs },
  chip: { ...typographyTokens.caption, color: colorTokens.brand.primary, backgroundColor: colorTokens.surface.selected, borderRadius: radiusTokens.pill, paddingHorizontal: spacingTokens.sm, paddingVertical: spacingTokens.xs },
});
