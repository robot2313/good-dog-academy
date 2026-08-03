import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../components/ErrorState';
import { LessonActionBar } from '../../components/LessonActionBar';
import { LessonScaffold } from '../../components/LessonScaffold';
import { LoadingState } from '../../components/LoadingState';
import { PremiumCard } from '../../components/PremiumCard';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';
import type { RootStackParamList } from '../../types/navigation';
import { LessonLibraryCard } from '../lessons/library/LessonLibraryCard';
import { useLessonLibraryData } from '../lessons/library/LessonLibraryContext';
import { LessonLibraryService } from '../lessons/library/LessonLibraryService';
import { DogTroubleshooterService } from './DogTroubleshooterService';
import { troubleshooterConcerns, type TroubleshooterConcernId } from './troubleshooterCatalogue';

export type DogTroubleshooterScreenProps = NativeStackScreenProps<RootStackParamList, 'Troubleshooter'>;

export function DogTroubleshooterScreen({ navigation }: DogTroubleshooterScreenProps): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords, loading, error, retry } = useLessonLibraryData();
  const [selectedConcern, setSelectedConcern] = useState<TroubleshooterConcernId | null>(null);
  const selectedDogId = selectedDog?.id ?? null;
  const dogName = selectedDog?.name.trim() || 'your dog';
  const service = useMemo(() => new DogTroubleshooterService(
    new LessonLibraryService(catalogue, selectedDogId, progressRecords),
  ), [catalogue, progressRecords, selectedDogId]);

  const footer = <LessonActionBar
    back={selectedConcern
      ? { label: 'Change problem', onPress: () => setSelectedConcern(null) }
      : { label: 'Back', onPress: navigation.goBack }}
  />;

  if (loading) {
    return <LessonScaffold footer={footer}><LoadingState message={`Finding suitable lessons for ${dogName}...`} /></LessonScaffold>;
  }
  if (error) {
    return <LessonScaffold footer={footer}><ErrorState message="The troubleshooter could not read the saved lesson progress safely." onRetry={retry} /></LessonScaffold>;
  }

  let result = null;
  try {
    result = selectedConcern ? service.recommend(selectedConcern) : null;
  } catch {
    return <LessonScaffold footer={footer}><ErrorState message="The troubleshooter could not prepare a recommendation." onRetry={retry} /></LessonScaffold>;
  }
  const primary = result?.primary ?? null;

  return (
    <LessonScaffold footer={footer}>
      <Text style={screenStyles.eyebrow}>DOG TROUBLESHOOTER</Text>
      <Text accessibilityRole="header" style={screenStyles.title}>
        {result ? `A training path for ${dogName}` : `What is ${dogName} struggling with?`}
      </Text>
      <Text style={screenStyles.intro}>
        {result
          ? `These suggestions use ${dogName}'s real lesson progress. They are training guidance, not a medical or behavioural diagnosis.`
          : 'Choose the closest match. We will use saved progress to find a practical lesson to try next.'}
      </Text>

      {!result ? (
        <View accessibilityRole="list" style={screenStyles.concernList}>
          {troubleshooterConcerns.map((concern) => (
            <PremiumCard
              key={concern.id}
              accessibilityLabel={`${concern.title}. ${concern.description}`}
              onPress={() => setSelectedConcern(concern.id)}
              style={screenStyles.concernCard}
            >
              <Text style={screenStyles.concernTitle}>{concern.title}</Text>
              <Text style={screenStyles.concernDescription}>{concern.description}</Text>
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={screenStyles.choose}>Choose this problem {'>'}</Text>
            </PremiumCard>
          ))}
        </View>
      ) : (
        <View style={screenStyles.results}>
          <PremiumCard tone="selected">
            <Text style={screenStyles.resultLabel}>YOU SELECTED</Text>
            <Text style={screenStyles.selectedTitle}>{result.concern.title}</Text>
            <Text style={screenStyles.concernDescription}>{result.concern.description}</Text>
          </PremiumCard>

          {result.concern.safetyMessage ? (
            <View accessibilityRole="alert" style={screenStyles.safetyCard}>
              <Text style={screenStyles.safetyTitle}>Safety first</Text>
              <Text style={screenStyles.safetyText}>{result.concern.safetyMessage}</Text>
            </View>
          ) : null}

          {primary ? (
            <View style={screenStyles.recommendationGroup}>
              <Text accessibilityRole="header" style={screenStyles.sectionTitle}>Best place to start</Text>
              <Text style={screenStyles.reason}>{primary.reason}</Text>
              <LessonLibraryCard
                lesson={primary.lesson}
                onPress={() => navigation.navigate('LessonSummary', { lessonId: primary.lesson.id })}
              />
            </View>
          ) : (
            <PremiumCard><Text style={screenStyles.concernDescription}>No matching lesson is currently available.</Text></PremiumCard>
          )}

          {result.alternatives.length > 0 ? (
            <View style={screenStyles.recommendationGroup}>
              <Text accessibilityRole="header" style={screenStyles.sectionTitle}>Other useful lessons</Text>
              {result.alternatives.map((recommendation) => (
                <View key={recommendation.lesson.id} style={screenStyles.alternative}>
                  <Text style={screenStyles.reason}>{recommendation.reason}</Text>
                  <LessonLibraryCard
                    lesson={recommendation.lesson}
                    onPress={() => navigation.navigate('LessonSummary', { lessonId: recommendation.lesson.id })}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </LessonScaffold>
  );
}

const screenStyles = StyleSheet.create({
  eyebrow: { ...typographyTokens.label, color: colorTokens.text.accent, letterSpacing: 1.2 },
  title: { ...typographyTokens.pageTitle, color: colorTokens.text.primary },
  intro: { ...typographyTokens.body, color: colorTokens.text.secondary },
  concernList: { gap: spacingTokens.sm },
  concernCard: { borderRadius: radiusTokens.lg },
  concernTitle: { ...typographyTokens.cardTitle, color: colorTokens.text.primary },
  concernDescription: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  choose: { ...typographyTokens.label, color: colorTokens.text.accent, marginTop: spacingTokens.xxs },
  results: { gap: spacingTokens.lg },
  resultLabel: { ...typographyTokens.label, color: colorTokens.text.accent, letterSpacing: 1 },
  selectedTitle: { ...typographyTokens.sectionTitle, color: colorTokens.text.primary },
  safetyCard: { borderRadius: radiusTokens.lg, padding: spacingTokens.md, gap: spacingTokens.xs, backgroundColor: colorTokens.status.errorSurface, borderWidth: 1, borderColor: '#5A3A38' },
  safetyTitle: { ...typographyTokens.cardTitle, color: colorTokens.status.errorText },
  safetyText: { ...typographyTokens.supporting, color: colorTokens.text.primary },
  recommendationGroup: { gap: spacingTokens.sm },
  sectionTitle: { ...typographyTokens.sectionTitle, color: colorTokens.text.primary },
  reason: { ...typographyTokens.supporting, color: colorTokens.text.accent },
  alternative: { gap: spacingTokens.xs },
});
