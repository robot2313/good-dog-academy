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
        <>
          <Image accessible={false} resizeMode="cover" source={imageSource} style={componentStyles.image} />
          <View pointerEvents="none" style={componentStyles.tone} />
          <View pointerEvents="none" style={componentStyles.skillPill}>
            <Text accessibilityElementsHidden style={componentStyles.skillMark}>
              {skillMark}
            </Text>
          </View>
        </>
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
    width: 88,
    height: 88,
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
  tone: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(38,28,10,0.12)',
  },
  skillPill: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    minWidth: 26,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: radiusTokens.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,8,8,0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  skillMark: {
    ...typographyTokens.caption,
    color: colorTokens.brand.primary,
    fontWeight: '900',
    fontSize: 10,
  },
  fallbackMark: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.brand.primary,
    fontWeight: '900',
    fontSize: 24,
  },
});
