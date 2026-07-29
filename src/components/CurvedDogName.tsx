import {
  PixelRatio,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Defs,
  Path,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';
import {
  colorTokens,
  typographyTokens,
} from '../theme/tokens';

type CurvedDogNameProps = {
  dogName: string;
  size: number;
  compact?: boolean;
  standard?: boolean;
  profile?: boolean;
};

export function CurvedDogName({
  dogName,
  size,
  compact = false,
  standard = false,
  profile = false,
}: CurvedDogNameProps): React.JSX.Element | null {
  const trimmedName = dogName.trim();

  if (!trimmedName) {
    return null;
  }

  const fontScale = PixelRatio.getFontScale();
  const shouldUseStraightText =
    fontScale > 1.2 ||
    (compact && trimmedName.length > 12) ||
    (standard && trimmedName.length > 16) ||
    (profile && trimmedName.length > 18);

  if (shouldUseStraightText) {
    return (
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.straightContainer,
          { width: size },
        ]}
      >
        <Text
          accessible={false}
          numberOfLines={2}
          style={styles.straightText}
        >
          {trimmedName}
        </Text>
      </View>
    );
  }

  const fontSize = compact ? 14 : profile ? 18 : 16;
  const inset = Math.max(12, size * 0.08);
  const radius = (size - inset * 2) / 2;
  const centerY = size / 2;

  const path =
    `M ${inset} ${centerY} ` +
    `A ${radius} ${radius} 0 0 0 ${size - inset} ${centerY}`;

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <Defs>
          <Path
            id="dog-name-curve"
            d={path}
          />
        </Defs>

        <SvgText
          fill={colorTokens.text.primary}
          fontSize={fontSize}
          fontWeight="800"
          letterSpacing={0.4}
          textAnchor="middle"
        >
          <TextPath
            href="#dog-name-curve"
            startOffset="50%"
          >
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
  },
  straightText: {
    ...typographyTokens.cardTitle,
    color: colorTokens.text.primary,
    textAlign: 'center',
  },
});

