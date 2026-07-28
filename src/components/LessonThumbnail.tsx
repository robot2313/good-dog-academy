import { Image, StyleSheet, Text, View } from 'react-native';

import type { BehaviourSkill } from '../domain/models';
import { lessonIllustrationForSkill } from '../features/lessons/coaching/LessonIllustration';
import { colorTokens, radiusTokens, typographyTokens } from '../theme/tokens';

type LessonThumbnailProps = {
  readonly skill: BehaviourSkill | null;
  readonly lessonTitle: string;
  readonly decorative?: boolean;
};

export function LessonThumbnail({
  skill,
  lessonTitle,
  decorative = false,
}: LessonThumbnailProps): React.JSX.Element {
  const accessibilityLabel = `${lessonTitle} lesson illustration`;

  if (!skill) {
    return (
      <View
        accessible={!decorative}
        accessibilityElementsHidden={decorative}
        accessibilityLabel={decorative ? undefined : accessibilityLabel}
        accessibilityRole={decorative ? undefined : 'image'}
        importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
        style={componentStyles.fallback}
      >
        <Text accessibilityElementsHidden style={componentStyles.fallbackMark}>G</Text>
      </View>
    );
  }

  return (
    <Image
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      resizeMode="cover"
      source={lessonIllustrationForSkill(skill).source}
      style={componentStyles.image}
    />
  );
}

const componentStyles = StyleSheet.create({
  image: {
    width: 88,
    height: 88,
    borderRadius: radiusTokens.lg,
    backgroundColor: colorTokens.surface.selected,
  },
  fallback: {
    width: 88,
    height: 88,
    borderRadius: radiusTokens.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.surface.selected,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
  },
  fallbackMark: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.brand.primary,
  },
});
