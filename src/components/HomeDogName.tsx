import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';

/**
 * The selected dog's name, rendered as an elegant signature on a shallow
 * "smile" arc directly beneath the Home hero photo: the two ends lift gently
 * toward the circle while the middle dips, so the name cleanly wraps under the
 * photo.
 *
 * The path is an explicit quadratic curve (unambiguous, unlike SVG arc sweep
 * flags) with the control point below the endpoints. The bounding box reserves
 * a full ascender of headroom above the highest glyphs (at the arc ends) plus
 * padding, so the name is never clipped at the top.
 *
 * Styling note / known limitation: the project bundles no script typeface
 * (`expo-font` is unused), so the most elegant available treatment is used — a
 * large italic display weight in warm metallic gold with a subtle dark shadow.
 * Long names scale down gradually; very long names or large accessibility font
 * scales fall back to straight (non-arced) gold text so nothing is clipped.
 */

const GOLD = '#1D6337';
const SHADOW = 'rgba(0,0,0,0.5)';

type HomeDogNameProps = {
  readonly dogName: string;
  readonly width: number;
};

function fontSizeForName(name: string, width: number): number {
  const widthCap = (width / Math.max(name.length, 1)) * 1.5;
  const lengthBase =
    name.length <= 6 ? 58
      : name.length <= 9 ? 52
        : name.length <= 12 ? 46
          : 42;
  return Math.max(34, Math.min(lengthBase, Math.round(widthCap)));
}

export function HomeDogName({ dogName, width }: HomeDogNameProps): React.JSX.Element | null {
  const trimmedName = dogName.trim();
  if (!trimmedName) {
    return null;
  }

  const fontScale = PixelRatio.getFontScale();
  const useStraight = fontScale > 1.3 || trimmedName.length > 16;
  const fontSize = fontSizeForName(trimmedName, width);

  if (useStraight) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={trimmedName}
        style={[styles.straightContainer, { width }]}
      >
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[styles.straightText, { fontSize: Math.min(fontSize, 44) }]}
        >
          {trimmedName}
        </Text>
      </View>
    );
  }

  const inset = Math.max(18, width * 0.08);
  const chord = width - inset * 2;
  const depth = Math.min(22, Math.max(10, chord * 0.06));
  const ascent = fontSize * 0.78;
  const descent = fontSize * 0.24;
  const pad = 8;
  // Endpoints (arc ends) carry the tallest glyphs; reserve an ascender + pad.
  const endY = ascent + pad;
  // Control point below the ends makes the middle dip: a shallow smile.
  const controlY = endY + depth * 2;
  const height = endY + depth + descent + pad;
  const path = `M ${inset} ${endY} Q ${width / 2} ${controlY} ${width - inset} ${endY}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={trimmedName}
      style={[styles.container, { width, height }]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <Path id="home-dog-name-curve" d={path} />
        </Defs>
        <SvgText
          fill={SHADOW}
          fontSize={fontSize}
          fontStyle="italic"
          fontWeight="700"
          textAnchor="middle"
          x={1.5}
          y={1.5}
        >
          <TextPath href="#home-dog-name-curve" startOffset="50%">
            {trimmedName}
          </TextPath>
        </SvgText>
        <SvgText
          fill={GOLD}
          fontSize={fontSize}
          fontStyle="italic"
          fontWeight="700"
          textAnchor="middle"
        >
          <TextPath href="#home-dog-name-curve" startOffset="50%">
            {trimmedName}
          </TextPath>
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  straightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  straightText: {
    color: GOLD,
    fontStyle: 'italic',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
