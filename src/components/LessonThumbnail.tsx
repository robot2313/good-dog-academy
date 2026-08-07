import { Image, StyleSheet, Text, View } from 'react-native';

import type { BehaviourSkill } from '../domain/models';
import { getLessonImageSource } from '../features/lessons/coaching/lessonImageManifest';
import { colorTokens, radiusTokens, typographyTokens } from '../theme/tokens';

type LessonThumbnailProps = {
  readonly lessonId?: string | null;
  readonly skill: BehaviourSkill | null;
  readonly lessonTitle: string;
  readonly decorative?: boolean;
};

export function LessonThumbnail({
  lessonId = null,
  skill,
  lessonTitle,
  decorative = false,
}: LessonThumbnailProps): React.JSX.Element {
  const accessibilityLabel = `${lessonTitle} lesson photograph`;

  const skillMark = skill ? skill.split('-').map((w) => w[0]?.toUpperCase()).join('') : 'G';
  const imageSource = skill ? getLessonImageSource(lessonId, skill) : null;

  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={componentStyles.badge}
    >
      {imageSource ? (
        <Image accessible={false} resizeMode="cover" source={imageSource} style={componentStyles.image} />
      ) : (
        <Text accessibilityElementsHidden style={componentStyles.fallbackMark}>
          {skillMark}
        </Text>
      )}
    </View>
  );
}

const componentStyles = StyleSheet.create({
  badge: {
    width: 64,
    height: 64,
    borderRadius: radiusTokens.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.surface.elevated,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackMark: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.brand.primary,
    fontWeight: '900',
    fontSize: 24,
  },
});
