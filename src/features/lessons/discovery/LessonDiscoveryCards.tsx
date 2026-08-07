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
  layout = 'tile',
  onPress,
}: {
  readonly category: TrainingCategory;
  readonly lessonCount: number;
  readonly compact?: boolean;
  readonly layout?: 'tile' | 'row';
  readonly onPress: () => void;
}): React.JSX.Element {
  if (layout === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${category.label}. ${lessonCount} lessons. ${category.description}`}
        onPress={onPress}
        style={({ pressed }) => [styles.discoveryCategoryRow, pressed && styles.homeButtonPressed]}
      >
        <Image
          accessible={false}
          resizeMode="cover"
          source={getLessonImageSource(category.anchorLessonId, category.skill)}
          style={styles.discoveryCategoryRowImage}
        />
        <View style={styles.discoveryCategoryRowCopy}>
          <Text style={styles.discoveryCategoryRowTitle}>{category.label}</Text>
          <Text style={styles.discoveryCategoryRowCount}>{lessonCount} lessons</Text>
          <Text numberOfLines={2} style={styles.discoveryCategoryRowDescription}>{category.description}</Text>
        </View>
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.discoveryCategoryRowArrow}>›</Text>
      </Pressable>
    );
  }

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
  layout = 'card',
  onPress,
}: {
  readonly lesson: LessonLibraryItem;
  readonly layout?: 'card' | 'row';
  readonly onPress: () => void;
}): React.JSX.Element {
  if (layout === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Recommended lesson: ${lesson.title}. ${skillLabel(lesson.skill)}. ${lessonDifficultyLabels[lesson.difficulty]}. ${lesson.estimatedMinutes} minutes.`}
        onPress={onPress}
        style={({ pressed }) => [styles.discoveryRecommendedRow, pressed && styles.homeButtonPressed]}
      >
        <Image
          accessible={false}
          resizeMode="cover"
          source={getLessonImageSource(lesson.id, lesson.skill)}
          style={styles.discoveryRecommendedRowImage}
        />
        <View style={styles.discoveryRecommendedRowCopy}>
          <Text style={styles.discoveryRecommendedKicker}>{skillLabel(lesson.skill)}</Text>
          <Text numberOfLines={2} style={styles.discoveryRecommendedTitle}>{lesson.title}</Text>
          <Text numberOfLines={2} style={styles.discoveryRecommendedRowDescription}>{lesson.description}</Text>
          <Text style={styles.discoveryRecommendedMeta}>{lessonDifficultyLabels[lesson.difficulty]} · {lesson.estimatedMinutes} min</Text>
        </View>
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.discoveryRecommendedRowArrow}>›</Text>
      </Pressable>
    );
  }

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
  layout = 'image',
  onPress,
}: {
  readonly collection: LessonCollection;
  readonly lessonCount: number;
  readonly compact?: boolean;
  readonly layout?: 'image' | 'row';
  readonly onPress: () => void;
}): React.JSX.Element {
  if (layout === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${collection.label}. ${collection.ageLabel}. ${lessonCount} lessons. ${collection.description}`}
        onPress={onPress}
        style={({ pressed }) => [styles.discoveryStageRow, pressed && styles.homeButtonPressed]}
      >
        <Image
          accessible={false}
          resizeMode="cover"
          source={getLessonImageSource(collection.anchorLessonId)}
          style={styles.discoveryStageRowImage}
        />
        <View style={styles.discoveryStageRowCopy}>
          <Text style={styles.discoveryStageRowTitle}>{collection.label}</Text>
          <Text style={styles.discoveryStageRowAge}>{collection.ageLabel}</Text>
          <Text numberOfLines={3} style={styles.discoveryStageRowDescription}>{collection.description}</Text>
          <Text style={styles.discoveryStageRowCount}>{lessonCount} lessons</Text>
        </View>
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.discoveryStageRowArrow}>›</Text>
      </Pressable>
    );
  }

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
