import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Soft paper-like backdrop for the Today / Home screen.
 */
export function HomeGradientBackground(): React.JSX.Element {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="home-gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E7ECDD" />
            <Stop offset="0.32" stopColor="#F3EFE4" />
            <Stop offset="0.72" stopColor="#F8F4EC" />
            <Stop offset="1" stopColor="#EFE7D9" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#home-gradient)" />
      </Svg>
    </View>
  );
}
