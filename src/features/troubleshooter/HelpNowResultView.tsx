import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TroubleshooterOutcome } from '../../domain/models';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';
import type { ResolvedTroubleshooterResult } from './troubleshooterTypes';

type HelpNowResultViewProps = {
  readonly dogName: string;
  readonly result: ResolvedTroubleshooterResult;
  readonly savingOutcome: boolean;
  readonly saveError: string | null;
  readonly reportedOutcome: TroubleshooterOutcome | null;
  readonly onReportOutcome: (outcome: TroubleshooterOutcome) => void;
  readonly onOpenFullPlan: () => void;
  readonly onStartOver: () => void;
};

const immediateOutcomes: readonly { id: TroubleshooterOutcome; label: string }[] = Object.freeze([
  { id: 'worse', label: 'It got worse' },
  { id: 'no-change', label: 'No change' },
  { id: 'slightly-better', label: 'A little better' },
  { id: 'successful-once', label: 'That worked' },
]);

export function HelpNowResultView({
  dogName,
  result,
  savingOutcome,
  saveError,
  reportedOutcome,
  onReportOutcome,
  onOpenFullPlan,
  onStartOver,
}: HelpNowResultViewProps): React.JSX.Element {
  const [actionIndex, setActionIndex] = useState(0);

  if (result.safetyOverride) {
    return (
      <View style={styles.results}>
        <View accessibilityRole="alert" style={styles.safetyCard}>
          <Text style={styles.safetyKicker}>TRAINING STOPS HERE</Text>
          <Text accessibilityRole="header" style={styles.safetyTitle}>{result.safetyOverride.title}</Text>
          <Text style={styles.body}>{result.safetyOverride.message}</Text>
        </View>
        <View style={styles.safetyActions}>
          {result.safetyOverride.actions.map((action, index) => (
            <View key={action} style={styles.safetyActionRow}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{index + 1}</Text></View>
              <Text style={styles.safetyActionText}>{action}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.reviewNote}>Educational guidance only. This is not a medical or behavioural diagnosis.</Text>
      </View>
    );
  }

  const actions = immediateActions(result);
  const finalAction = actionIndex === actions.length - 1;

  return (
    <View style={styles.results}>
      {result.progressMessage ? (
        <View accessibilityRole="alert" style={styles.progressCard}>
          <Text style={styles.progressTitle}>Based on your last try</Text>
          <Text style={styles.body}>{result.progressMessage}</Text>
        </View>
      ) : null}

      <View style={styles.actionCard}>
        <View style={styles.actionTopRow}>
          <Text style={styles.actionKicker}>{actionIndex === 0 ? 'DO THIS NOW' : 'NEXT SAFE STEP'}</Text>
          <Text accessibilityLabel={`Step ${actionIndex + 1} of ${actions.length}`} style={styles.counter}>
            {actionIndex + 1}/{actions.length}
          </Text>
        </View>
        <Text accessibilityRole="header" style={styles.actionTitle}>{actions[actionIndex]}</Text>
        <Text style={styles.actionContext}>Keep this step easy enough that {dogName} can move away, recover, and choose to engage.</Text>

        <View style={styles.actionButtons}>
          {actionIndex > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous safe step"
              onPress={() => setActionIndex((current) => Math.max(0, current - 1))}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </Pressable>
          ) : null}
          {!finalAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done, show next safe step"
              onPress={() => setActionIndex((current) => Math.min(actions.length - 1, current + 1))}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Done - next step</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View accessibilityRole="alert" style={styles.stopCard}>
        <Text style={styles.stopTitle}>Stop or create more space if</Text>
        <Text style={styles.body}>{result.protocol.stopConditions[0]}</Text>
      </View>

      {finalAction && reportedOutcome ? (
        <View accessibilityRole="alert" style={styles.savedCard}>
          <Text accessibilityRole="header" style={styles.savedTitle}>Result saved</Text>
          <Text style={styles.body}>{outcomeConfirmation(reportedOutcome, dogName)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start another Help Me Now check"
            onPress={onStartOver}
            style={({ pressed }) => [styles.savedButton, pressed && styles.pressed]}
          >
            <Text style={styles.savedButtonText}>Start another check</Text>
          </Pressable>
        </View>
      ) : finalAction ? (
        <View style={styles.outcomeCard}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>What happened?</Text>
          <Text style={styles.body}>Your answer helps choose an easier or more useful plan next time.</Text>
          <View accessibilityRole="list" style={styles.outcomes}>
            {immediateOutcomes.map((outcome) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Report result: ${outcome.label}`}
                accessibilityState={{ disabled: savingOutcome }}
                disabled={savingOutcome}
                key={outcome.id}
                onPress={() => onReportOutcome(outcome.id)}
                style={({ pressed }) => [styles.outcomeButton, pressed && styles.pressed, savingOutcome && styles.disabled]}
              >
                <Text style={styles.outcomeButtonText}>{outcome.label}</Text>
              </Pressable>
            ))}
          </View>
          {savingOutcome ? <Text accessibilityRole="alert" style={styles.statusText}>Saving result...</Text> : null}
          {saveError ? <Text accessibilityRole="alert" style={styles.errorText}>{saveError}</Text> : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="See the full explanation and fallback plan"
        onPress={onOpenFullPlan}
        style={({ pressed }) => [styles.fullPlanButton, pressed && styles.pressed]}
      >
        <Text style={styles.fullPlanButtonText}>See full explanation and fallback plan</Text>
      </Pressable>

      <Text style={styles.reviewNote}>Educational guidance only. Content requires professional veterinary-behaviour review before production release.</Text>
    </View>
  );
}

function immediateActions(result: ResolvedTroubleshooterResult): readonly string[] {
  const candidates = [result.primaryAdjustment, ...result.exercise.setup, ...result.exercise.steps];
  return Object.freeze(candidates.filter((action, index) => action.trim() && candidates.indexOf(action) === index));
}

function outcomeConfirmation(outcome: TroubleshooterOutcome, dogName: string): string {
  switch (outcome) {
    case 'worse': return `Stop this attempt and give ${dogName} more space. The result is recorded so the next plan can be safer and easier.`;
    case 'no-change': return `No change has been recorded. The next plan will use a different fallback step instead of repeating the same thing.`;
    case 'slightly-better': return `A little better is useful progress. Repeat this same level in the same place before making anything harder.`;
    case 'successful-once': return `That success has been recorded. Repeat the same easy setup before increasing distance, duration, or distraction.`;
    case 'successful-three-times': return `Three successes have been recorded. Increase only one small difficulty factor next time.`;
    case 'reliable': return `This is recorded as reliable here. Start easier again when the environment changes.`;
  }
}

const styles = StyleSheet.create({
  results: { gap: spacingTokens.sm },
  body: { ...typographyTokens.body, color: colorTokens.text.primary },
  actionCard: { gap: spacingTokens.sm, borderRadius: radiusTokens.hero, padding: spacingTokens.md, backgroundColor: colorTokens.brand.forest },
  actionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacingTokens.sm },
  actionKicker: { ...typographyTokens.label, color: '#F0D6A6', letterSpacing: 1.1 },
  counter: { ...typographyTokens.label, color: colorTokens.text.inverse, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radiusTokens.pill, paddingHorizontal: spacingTokens.sm, paddingVertical: spacingTokens.xs },
  actionTitle: { ...typographyTokens.pageTitle, color: colorTokens.text.inverse },
  actionContext: { ...typographyTokens.supporting, color: 'rgba(255,255,255,0.74)' },
  actionButtons: { flexDirection: 'row', gap: spacingTokens.sm },
  primaryButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: spacingTokens.md, backgroundColor: '#FFFFFF' },
  primaryButtonText: { ...typographyTokens.body, color: colorTokens.brand.forest, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: spacingTokens.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  secondaryButtonText: { ...typographyTokens.body, color: colorTokens.text.inverse, fontWeight: '800' },
  stopCard: { gap: spacingTokens.xxs, borderRadius: radiusTokens.xl, padding: spacingTokens.md, backgroundColor: colorTokens.status.warningSurface, borderWidth: 1, borderColor: '#ECD4A8' },
  stopTitle: { ...typographyTokens.cardTitle, color: colorTokens.status.warningText },
  outcomeCard: { gap: spacingTokens.xs, borderRadius: radiusTokens.xl, padding: spacingTokens.md, backgroundColor: colorTokens.surface.primary, borderWidth: 1, borderColor: colorTokens.border.subtle },
  savedCard: { gap: spacingTokens.xs, borderRadius: radiusTokens.xl, padding: spacingTokens.md, backgroundColor: colorTokens.status.successSurface, borderWidth: 1, borderColor: '#CFE2C8' },
  savedTitle: { ...typographyTokens.sectionTitle, color: colorTokens.status.successText },
  savedButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: spacingTokens.md, backgroundColor: colorTokens.brand.primary },
  savedButtonText: { ...typographyTokens.body, color: colorTokens.text.inverse, fontWeight: '900' },
  sectionTitle: { ...typographyTokens.sectionTitle, color: colorTokens.text.primary },
  outcomes: { gap: spacingTokens.sm },
  outcomeButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: spacingTokens.md, backgroundColor: colorTokens.surface.primary, borderWidth: 1, borderColor: colorTokens.brand.primary },
  outcomeButtonText: { ...typographyTokens.body, color: colorTokens.brand.primary, fontWeight: '900' },
  fullPlanButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: spacingTokens.md, borderWidth: 1, borderColor: colorTokens.border.subtle, backgroundColor: colorTokens.surface.primary },
  fullPlanButtonText: { ...typographyTokens.supporting, color: colorTokens.brand.primary, fontWeight: '900', textAlign: 'center' },
  safetyCard: { gap: spacingTokens.xs, borderRadius: radiusTokens.hero, padding: spacingTokens.md, backgroundColor: colorTokens.status.errorSurface, borderWidth: 1, borderColor: '#E2C3BB' },
  safetyKicker: { ...typographyTokens.label, color: colorTokens.status.errorText, letterSpacing: 1.3 },
  safetyTitle: { ...typographyTokens.pageTitle, color: colorTokens.status.errorText },
  safetyActions: { gap: spacingTokens.sm },
  safetyActionRow: { minHeight: 56, flexDirection: 'row', alignItems: 'flex-start', gap: spacingTokens.xs, borderRadius: radiusTokens.lg, padding: spacingTokens.sm, backgroundColor: colorTokens.surface.primary, borderWidth: 1, borderColor: colorTokens.border.subtle },
  stepBadge: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: radiusTokens.pill, backgroundColor: colorTokens.status.errorText },
  stepBadgeText: { ...typographyTokens.label, color: colorTokens.text.inverse },
  safetyActionText: { ...typographyTokens.body, flex: 1, color: colorTokens.text.primary },
  progressCard: { gap: spacingTokens.xxs, borderRadius: radiusTokens.xl, padding: spacingTokens.md, backgroundColor: colorTokens.status.successSurface, borderWidth: 1, borderColor: '#CFE2C8' },
  progressTitle: { ...typographyTokens.cardTitle, color: colorTokens.status.successText },
  statusText: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  errorText: { ...typographyTokens.supporting, color: colorTokens.status.errorText, fontWeight: '800' },
  reviewNote: { ...typographyTokens.caption, color: colorTokens.text.secondary, textAlign: 'center', paddingHorizontal: spacingTokens.sm },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
