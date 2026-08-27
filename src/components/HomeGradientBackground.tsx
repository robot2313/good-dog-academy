import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Soft cream backdrop used by the Home screen. */
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
            <Stop offset="0" stopColor="#FFFDF8" />
            <Stop offset="0.45" stopColor="#FBF8F0" />
            <Stop offset="1" stopColor="#F5F0E6" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#home-gradient)" />
      </Svg>
    </View>
  );
}
