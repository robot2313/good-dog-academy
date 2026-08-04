import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '../../components/PremiumCard';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';
import { LessonLibraryCard } from '../lessons/library/LessonLibraryCard';
import type { TroubleshooterOutcome } from '../../domain/models';
import { outcomeOptions, type ResolvedTroubleshooterResult } from './troubleshooterTypes';

type TroubleshooterResultViewProps = {
  readonly dogName: string;
  readonly result: ResolvedTroubleshooterResult;
  readonly savingOutcome: boolean;
  readonly saveError: string | null;
  readonly onReportOutcome: (outcome: TroubleshooterOutcome) => void;
  readonly onOpenLesson: (lessonId: string) => void;
};

export function TroubleshooterResultView({
  dogName,
  result,
  savingOutcome,
  saveError,
  onReportOutcome,
  onOpenLesson,
}: TroubleshooterResultViewProps): React.JSX.Element {
  if (result.safetyOverride) {
    return (
      <View style={styles.results}>
        <View accessibilityRole="alert" style={styles.safetyCard}>
          <Text accessibilityRole="header" style={styles.safetyTitle}>{result.safetyOverride.title}</Text>
          <Text style={styles.body}>{result.safetyOverride.message}</Text>
          <NumberedList items={result.safetyOverride.actions} />
        </View>
        <InfoSection title="Why this was chosen">
          <Text style={styles.body}>{result.selectionExplanation}</Text>
        </InfoSection>
        <Text style={styles.reviewNote}>This guidance is educational and is not a medical or behavioural diagnosis.</Text>
      </View>
    );
  }

  const primaryLesson = result.primaryLesson;

  return (
    <View style={styles.results}>
      <PremiumCard tone="selected">
        <Text style={styles.eyebrow}>PERSONALISED PLAN · LEVEL {result.fallbackLevel}</Text>
        <Text accessibilityRole="header" style={styles.planTitle}>{result.concern.title}</Text>
        <Text style={styles.body}>A practical starting plan for {dogName}.</Text>
      </PremiumCard>

      {result.progressMessage ? (
        <View accessibilityRole="alert" style={styles.progressCard}>
          <Text style={styles.progressTitle}>Based on the last result</Text>
          <Text style={styles.body}>{result.progressMessage}</Text>
        </View>
      ) : null}

      <InfoSection title="What may be happening">
        <Text style={styles.body}>{result.likelyObstacle}</Text>
      </InfoSection>

      <InfoSection title="Why this happens">
        {result.protocol.explanation.map((paragraph) => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}
      </InfoSection>

      <InfoSection title="Change this first" tone="highlight">
        <Text style={styles.primaryAdjustment}>{result.primaryAdjustment}</Text>
      </InfoSection>

      <InfoSection title="Try this now" tone="exercise">
        <View style={styles.exerciseHeading}>
          <Text style={styles.exerciseTitle}>{result.exercise.title}</Text>
          <Text style={styles.timePill}>{result.exercise.minutes}</Text>
        </View>
        <Text style={styles.subheading}>Management and set up</Text>
        <BulletList items={result.exercise.setup} />
        <Text style={styles.subheading}>Steps</Text>
        <NumberedList items={result.exercise.steps} />
        <Text style={styles.repetitions}>{result.exercise.repetitions}</Text>
      </InfoSection>

      <InfoSection title="Watch for this">
        <BulletList items={result.protocol.difficultySigns} />
      </InfoSection>

      <InfoSection title="Success means">
        <BulletList items={result.protocol.successCriteria} />
      </InfoSection>

      <InfoSection title="Stop or make it easier if" tone="warning">
        <BulletList items={result.protocol.stopConditions} />
      </InfoSection>

      <InfoSection title="If this does not help — level 2">
        <NumberedList items={result.protocol.fallbackLevel2} />
      </InfoSection>

      <InfoSection title="If it still does not help — level 3" tone="warning">
        <NumberedList items={result.protocol.fallbackLevel3} />
        <Text style={styles.professionalText}>{result.protocol.professionalEscalation}</Text>
      </InfoSection>

      <InfoSection title="Why this recommendation was chosen">
        <Text style={styles.body}>{result.selectionExplanation}</Text>
        {result.protocol.why.map((reason) => <Text key={reason} style={styles.body}>• {reason}</Text>)}
      </InfoSection>

      {primaryLesson ? (
        <InfoSection title="Related lesson — optional">
          <Text style={styles.lessonReason}>{primaryLesson.reason}</Text>
          <LessonLibraryCard
            lesson={primaryLesson.lesson}
            onPress={() => onOpenLesson(primaryLesson.lesson.id)}
          />
        </InfoSection>
      ) : null}

      <InfoSection title="How did this level go?" tone="exercise">
        <Text style={styles.body}>Your answer changes what the Troubleshooter recommends next time.</Text>
        <View accessibilityRole="list" style={styles.outcomeList}>
          {outcomeOptions.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Report result: ${option.label}`}
              disabled={savingOutcome}
              key={option.id}
              onPress={() => onReportOutcome(option.id)}
              style={({ pressed }) => [styles.outcomeButton, pressed && styles.pressed, savingOutcome && styles.disabled]}
            >
              <Text style={styles.outcomeText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {savingOutcome ? <Text accessibilityRole="alert" style={styles.statusText}>Saving result…</Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={styles.errorText}>{saveError}</Text> : null}
      </InfoSection>

      <Text style={styles.reviewNote}>Educational guidance only. Content is marked for professional veterinary-behaviour review before production release.</Text>
    </View>
  );
}

function InfoSection({ children, title, tone = 'default' }: React.PropsWithChildren<{
  readonly title: string;
  readonly tone?: 'default' | 'highlight' | 'exercise' | 'warning';
}>): React.JSX.Element {
  return (
    <View style={[styles.section, styles[`${tone}Section`]]}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { readonly items: readonly string[] }): React.JSX.Element {
  return <View style={styles.list}>{items.map((item) => <Text key={item} style={styles.body}>• {item}</Text>)}</View>;
}

function NumberedList({ items }: { readonly items: readonly string[] }): React.JSX.Element {
  return <View style={styles.list}>{items.map((item, index) => <Text key={item} style={styles.body}>{index + 1}. {item}</Text>)}</View>;
}

const styles = StyleSheet.create({
  results: { gap: spacingTokens.md },
  section: { gap: spacingTokens.sm, padding: spacingTokens.lg, borderRadius: radiusTokens.xl, backgroundColor: colorTokens.surface.primary, borderWidth: 1, borderColor: colorTokens.border.subtle },
  defaultSection: {},
  highlightSection: { backgroundColor: colorTokens.surface.selected, borderColor: colorTokens.brand.primary },
  exerciseSection: { backgroundColor: colorTokens.status.infoSurface, borderColor: colorTokens.status.infoText },
  warningSection: { backgroundColor: colorTokens.status.warningSurface, borderColor: colorTokens.status.warningText },
  eyebrow: { ...typographyTokens.label, color: colorTokens.text.accent, letterSpacing: 1 },
  planTitle: { ...typographyTokens.sectionTitle, color: colorTokens.text.primary },
  sectionTitle: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
  body: { ...typographyTokens.body, color: colorTokens.text.primary },
  primaryAdjustment: { ...typographyTokens.cardTitle, color: colorTokens.brand.forest },
  list: { gap: spacingTokens.xs },
  exerciseHeading: { gap: spacingTokens.xs },
  exerciseTitle: { ...typographyTokens.sectionTitle, color: colorTokens.text.primary },
  timePill: { ...typographyTokens.label, alignSelf: 'flex-start', color: colorTokens.status.infoText, backgroundColor: colorTokens.surface.elevated, borderRadius: radiusTokens.pill, paddingHorizontal: spacingTokens.sm, paddingVertical: spacingTokens.xs },
  subheading: { ...typographyTokens.label, color: colorTokens.text.accent, letterSpacing: 0.8, marginTop: spacingTokens.xs, textTransform: 'uppercase' },
  repetitions: { ...typographyTokens.supporting, color: colorTokens.status.infoText, fontWeight: '800' },
  professionalText: { ...typographyTokens.body, color: colorTokens.status.warningText, fontWeight: '800' },
  lessonReason: { ...typographyTokens.supporting, color: colorTokens.text.accent },
  safetyCard: { borderRadius: radiusTokens.xl, padding: spacingTokens.lg, gap: spacingTokens.sm, backgroundColor: colorTokens.status.errorSurface, borderWidth: 2, borderColor: colorTokens.status.errorText },
  safetyTitle: { ...typographyTokens.sectionTitle, color: colorTokens.status.errorText },
  progressCard: { borderRadius: radiusTokens.xl, padding: spacingTokens.lg, gap: spacingTokens.xs, backgroundColor: colorTokens.status.successSurface, borderWidth: 1, borderColor: colorTokens.status.successText },
  progressTitle: { ...typographyTokens.cardTitle, color: colorTokens.status.successText },
  outcomeList: { gap: spacingTokens.sm },
  outcomeButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacingTokens.md, paddingVertical: spacingTokens.sm, borderRadius: radiusTokens.pill, backgroundColor: colorTokens.surface.elevated, borderWidth: 1, borderColor: colorTokens.border.strong },
  outcomeText: { ...typographyTokens.body, color: colorTokens.brand.primary, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  statusText: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  errorText: { ...typographyTokens.supporting, color: colorTokens.status.errorText, fontWeight: '700' },
  reviewNote: { ...typographyTokens.caption, color: colorTokens.text.secondary, textAlign: 'center', paddingHorizontal: spacingTokens.sm },
});
