import { Image, Pressable, Text, View } from 'react-native';

import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { lessonDifficultyLabels, skillLabel } from '../library/lessonLibraryPresentation';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';
import { styles } from '../../../theme/styles';
import type { LessonCollection, TrainingCategory } from './lessonDiscovery';

export function TrainingCategoryCard({
  category,
  lessonCount,
  compact = false,
  onPress,
}: {
  readonly category: TrainingCategory;
  readonly lessonCount: number;
  readonly compact?: boolean;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.label}. ${lessonCount} lessons. ${category.description}`}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.discoveryCategoryCardCompact : styles.discoveryCategoryCard,
        pressed && styles.homeButtonPressed,
      ]}
    >
      <Image
        accessible={false}
        resizeMode="cover"
        source={getLessonImageSource(category.anchorLessonId, category.skill)}
        style={styles.discoveryCategoryImage}
      />
      <View pointerEvents="none" style={styles.discoveryCategoryTone} />
      <View style={styles.discoveryCategoryCopy}>
        <Text numberOfLines={2} style={styles.discoveryCategoryTitle}>{compact ? category.shortLabel : category.label}</Text>
        <Text style={styles.discoveryCategoryCount}>{lessonCount} lessons</Text>
      </View>
    </Pressable>
  );
}

export function RecommendedLessonCard({
  lesson,
  onPress,
}: {
  readonly lesson: LessonLibraryItem;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Recommended lesson: ${lesson.title}. ${skillLabel(lesson.skill)}. ${lessonDifficultyLabels[lesson.difficulty]}. ${lesson.estimatedMinutes} minutes.`}
      onPress={onPress}
      style={({ pressed }) => [styles.discoveryRecommendedCard, pressed && styles.homeButtonPressed]}
    >
      <Image
        accessible={false}
        resizeMode="cover"
        source={getLessonImageSource(lesson.id, lesson.skill)}
        style={styles.discoveryRecommendedImage}
      />
      <View style={styles.discoveryRecommendedCopy}>
        <Text style={styles.discoveryRecommendedKicker}>{skillLabel(lesson.skill)}</Text>
        <Text numberOfLines={2} style={styles.discoveryRecommendedTitle}>{lesson.title}</Text>
        <Text style={styles.discoveryRecommendedMeta}>{lessonDifficultyLabels[lesson.difficulty]} · {lesson.estimatedMinutes} min</Text>
      </View>
    </Pressable>
  );
}

export function LifeStageCard({
  collection,
  lessonCount,
  compact = false,
  onPress,
}: {
  readonly collection: LessonCollection;
  readonly lessonCount: number;
  readonly compact?: boolean;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${collection.label}. ${collection.ageLabel}. ${lessonCount} lessons. ${collection.description}`}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.discoveryStageCardCompact : styles.discoveryStageCard,
        pressed && styles.homeButtonPressed,
      ]}
    >
      <Image
        accessible={false}
        resizeMode="cover"
        source={getLessonImageSource(collection.anchorLessonId)}
        style={styles.discoveryStageImage}
      />
      <View pointerEvents="none" style={styles.discoveryStageTone} />
      <View style={styles.discoveryStageCopy}>
        <Text style={styles.discoveryStageTitle}>{collection.label}</Text>
        <Text style={styles.discoveryStageAge}>{collection.ageLabel}</Text>
        {!compact ? <Text numberOfLines={3} style={styles.discoveryStageDescription}>{collection.description}</Text> : null}
        <Text style={styles.discoveryStageCount}>{lessonCount} lessons ›</Text>
      </View>
    </Pressable>
  );
}
