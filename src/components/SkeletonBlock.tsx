import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { colorTokens, radiusTokens } from '../theme/tokens';

type SkeletonBlockProps = {
  readonly accessibilityLabel?: string;
  readonly height?: number;
  readonly width?: ViewStyle['width'];
  readonly style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({
  accessibilityLabel = 'Loading content',
  height = 20,
  width = '100%',
  style,
}: SkeletonBlockProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.72);
      return undefined;
    }

    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.45,
        duration: 800,
        useNativeDriver: true,
      }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        testID="skeleton-block"
        style={[
          componentStyles.block,
          { height, opacity, width },
          style,
        ]}
      />
    </View>
  );
}

const componentStyles = StyleSheet.create({
  block: {
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.border.strong,
  },
});
