import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../components/AppButton';
import { DogIdentityHero } from '../components/DogIdentityHero';
import {
  LifeStageCard,
  RecommendedLessonCard,
  TrainingCategoryCard,
} from '../features/lessons/discovery/LessonDiscoveryCards';
import {
  lessonCollections,
  recommendedLessons,
  trainingCategories,
} from '../features/lessons/discovery';
import { LessonLibraryScreen } from '../features/lessons/library/LessonLibraryScreen';
import { LessonLibraryService } from '../features/lessons/library/LessonLibraryService';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';

export function AcademyScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { catalogue, selectedDog, progressRecords } = useLessonLibraryData();
  const dogName = selectedDog?.name ?? 'My Dog';
  const photoUri = selectedDog?.photoUri ?? null;
  const selectedDogId = selectedDog?.id ?? null;
  const service = useMemo(
    () => new LessonLibraryService(catalogue, selectedDogId, progressRecords),
    [catalogue, progressRecords, selectedDogId],
  );

  let recommendations = [] as ReturnType<typeof recommendedLessons>;
  try {
    recommendations = recommendedLessons(service.getAllLessons(), 4);
  } catch {
    recommendations = [];
  }

  const categoryCounts = new Map(
    trainingCategories.map((category) => [
      category.skill,
      catalogue.definitions.filter((lesson) => lesson.skill === category.skill && lesson.isActive).length,
    ]),
  );

  return (
    <LessonLibraryScreen
      allowLockedSelection
      hero={(
        <View style={styles.academyDiscoveryHero}>
          <DogIdentityHero
            dogName={dogName}
            photoUri={photoUri}
            eyebrow="ACADEMY"
            title="Choose Your Training"
            supportingText={`Follow ${dogName}'s recommended Journey, use smart recommendations, or choose any category and lesson yourself.`}
            size="compact"
          />

          <View style={styles.discoveryPathRow}>
            <AppButton
              title="Your Journey"
              accessibilityLabel={`${dogName}'s recommended training journey`}
              onPress={() => navigation.navigate('Journey')}
            />
            <AppButton
              title="Recommended"
              variant="secondary"
              accessibilityLabel={`Recommended lessons for ${dogName}`}
              onPress={() => navigation.navigate('LessonBrowse', { recommended: true })}
            />
          </View>

          <View style={styles.discoverySection}>
            <View style={styles.discoverySectionHeader}>
              <View style={styles.discoverySectionHeaderCopy}>
                <Text style={styles.discoverySectionKicker}>PICKED FOR YOU</Text>
                <Text accessibilityRole="header" style={styles.discoverySectionTitle}>Recommended next</Text>
              </View>
              <Text style={styles.discoverySectionLink} onPress={() => navigation.navigate('LessonBrowse', { recommended: true })}>See all</Text>
            </View>
            {recommendations.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.discoveryHorizontalContent}
              >
                {recommendations.map((lesson) => (
                  <RecommendedLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onPress={() => navigation.navigate('LessonSummary', { lessonId: lesson.id })}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.discoveryEmptyText}>Recommendations will appear after your dog’s lesson progress is ready.</Text>
            )}
          </View>

          <View style={styles.discoverySection}>
            <View style={styles.discoverySectionHeaderCopy}>
              <Text style={styles.discoverySectionKicker}>CHOOSE YOUR OWN PATH</Text>
              <Text accessibilityRole="header" style={styles.discoverySectionTitle}>Browse by category</Text>
              <Text style={styles.discoverySectionIntro}>Open a training area, then choose any lesson that suits what is happening now.</Text>
            </View>
            <View style={styles.discoveryCategoryGrid}>
              {trainingCategories.map((category) => (
                <TrainingCategoryCard
                  key={category.skill}
                  category={category}
                  lessonCount={categoryCounts.get(category.skill) ?? 0}
                  onPress={() => navigation.navigate('LessonBrowse', { skill: category.skill })}
                />
              ))}
            </View>
          </View>

          <View style={styles.discoverySection}>
            <View style={styles.discoverySectionHeaderCopy}>
              <Text style={styles.discoverySectionKicker}>LESSONS FOR YOUR DOG</Text>
              <Text accessibilityRole="header" style={styles.discoverySectionTitle}>Browse by life stage</Text>
              <Text style={styles.discoverySectionIntro}>These are curated collections, not a replacement for veterinary advice or your dog’s individual limits.</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.discoveryHorizontalContent}
            >
              {lessonCollections.map((collection) => (
                <LifeStageCard
                  key={collection.id}
                  collection={collection}
                  lessonCount={collection.lessonIds.length}
                  onPress={() => navigation.navigate('LessonBrowse', { collectionId: collection.id })}
                />
              ))}
            </ScrollView>
          </View>

          <AppButton
            title="Troubleshoot a Problem"
            variant="secondary"
            accessibilityLabel={`Troubleshoot a training problem for ${dogName}`}
            onPress={() => navigation.navigate('Troubleshooter')}
          />

          <View style={styles.discoveryLibraryIntro}>
            <Text style={styles.discoverySectionKicker}>FULL CATALOGUE</Text>
            <Text accessibilityRole="header" style={styles.pageTitle}>Lesson Library</Text>
            <Text style={styles.libraryDogContext}>Search, filter and open all {catalogue.definitions.length} lessons for {dogName}.</Text>
          </View>
        </View>
      )}
    />
  );
}
