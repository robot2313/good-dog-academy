import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { referencePalette } from '../theme/referenceStyles';

type LessonPhotoBannerProps = {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  /** compact = short strip (active session); regular = wide 16:9-ish banner. */
  readonly size?: 'regular' | 'compact';
  readonly decorative?: boolean;
};

/**
 * The reference wide photograph card: realistic photo, 12px radius, thin warm
 * border — the same treatment as the category banner on Lessons in Category.
 */
export function LessonPhotoBanner({
  source,
  accessibilityLabel,
  size = 'regular',
  decorative = false,
}: LessonPhotoBannerProps): React.JSX.Element {
  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[componentStyles.frame, size === 'compact' ? componentStyles.compact : componentStyles.regular]}
    >
      <Image accessible={false} resizeMode="cover" source={source} style={componentStyles.image} />
    </View>
  );
}

const componentStyles = StyleSheet.create({
  frame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: referencePalette.line,
    overflow: 'hidden',
    backgroundColor: referencePalette.surface,
  },
  regular: { width: '100%', aspectRatio: 16 / 9 },
  compact: { width: '100%', height: 92 },
  image: { width: '100%', height: '100%' },
});
