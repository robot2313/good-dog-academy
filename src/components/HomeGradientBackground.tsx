import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Full-screen cinematic backdrop for the Today / Home screen.
 *
 * A single vertical gradient that stays black to dark grey the whole way down —
 * cinematic and warm, with no light-grey/silver lower section — so gold text
 * and controls read cleanly over it from top to bottom.
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
            <Stop offset="0" stopColor="#000000" />
            <Stop offset="0.45" stopColor="#090909" />
            <Stop offset="0.75" stopColor="#171717" />
            <Stop offset="1" stopColor="#292929" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#home-gradient)" />
      </Svg>
    </View>
  );
}
