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

  const skillMark = skill ? skill.split('-').map((w) => w[0]?.toUpperCase()).join('') : 'G';

  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={componentStyles.badge}
    >
      <Text accessibilityElementsHidden style={componentStyles.skillMark}>
        {skillMark}
      </Text>
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
    backgroundColor: colorTokens.surface.selected,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
  },
  skillMark: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.brand.primary,
    fontWeight: '900',
    fontSize: 24,
  },
});
