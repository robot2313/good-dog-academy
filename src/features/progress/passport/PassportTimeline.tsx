import { StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '../../../components/PremiumCard';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../../theme/tokens';
import { formatHistoryLocalDate } from '../history/TrainingSessionCard';
import type { PassportTimelineItem, PassportTimelineTone } from './DogLearningPassportTypes';

type PassportTimelineProps = {
  readonly items: readonly PassportTimelineItem[];
  readonly onOpenSession: (sessionId: string) => void;
};

export function PassportTimeline({ items, onOpenSession }: PassportTimelineProps): React.JSX.Element {
  if (items.length === 0) {
    return (
      <PremiumCard style={componentStyles.emptyCard}>
        <Text accessibilityRole="header" style={componentStyles.emptyTitle}>No evidence recorded yet</Text>
        <Text style={componentStyles.detail}>Complete a lesson or report a Help Me Now result and it will appear here.</Text>
      </PremiumCard>
    );
  }

  return (
    <View accessibilityRole="list" style={componentStyles.list}>
      {items.map((item) => {
        const date = formatHistoryLocalDate(item.localDate);
        const sessionId = item.sessionId;
        const accessibilityLabel = `${item.title}. ${item.detail}. ${date}`;
        return (
          <PremiumCard
            accessibilityLabel={accessibilityLabel}
            key={item.id}
            onPress={sessionId ? () => onOpenSession(sessionId) : undefined}
            style={componentStyles.item}
          >
            <View style={componentStyles.headingRow}>
              <View style={[componentStyles.marker, markerStyle(item.tone)]} />
              <View style={componentStyles.copy}>
                <Text style={componentStyles.kind}>{item.kind === 'help-now' ? 'REAL-WORLD CHECK' : 'GUIDED SESSION'}</Text>
                <Text style={componentStyles.title}>{item.title}</Text>
              </View>
              <Text style={componentStyles.date}>{date}</Text>
            </View>
            <Text style={componentStyles.detail}>{item.detail}</Text>
            {item.sessionId ? <Text style={componentStyles.action}>View session details</Text> : null}
          </PremiumCard>
        );
      })}
    </View>
  );
}

function markerStyle(tone: PassportTimelineTone) {
  if (tone === 'positive') return componentStyles.markerPositive;
  if (tone === 'caution') return componentStyles.markerCaution;
  return componentStyles.markerNeutral;
}

const componentStyles = StyleSheet.create({
  list: { gap: spacingTokens.sm },
  item: { borderRadius: radiusTokens.md, padding: spacingTokens.md, gap: spacingTokens.xxs },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacingTokens.sm },
  marker: { width: 12, height: 12, marginTop: spacingTokens.xs, borderRadius: radiusTokens.pill },
  markerPositive: { backgroundColor: colorTokens.status.successText },
  markerNeutral: { backgroundColor: colorTokens.status.infoText },
  markerCaution: { backgroundColor: colorTokens.status.warningText },
  copy: { flex: 1, minWidth: 0, gap: spacingTokens.xxs },
  kind: { ...typographyTokens.caption, color: colorTokens.text.accent, letterSpacing: 0.8 },
  title: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
  date: { ...typographyTokens.caption, flexShrink: 0, color: colorTokens.text.secondary },
  detail: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  action: { ...typographyTokens.label, color: colorTokens.brand.primary, marginTop: spacingTokens.xs },
  emptyCard: { borderRadius: radiusTokens.md, padding: spacingTokens.md },
  emptyTitle: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
});
