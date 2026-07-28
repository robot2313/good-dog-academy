import type { PropsWithChildren } from 'react';
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
} from '../theme/tokens';

export type PremiumCardTone = 'default' | 'elevated' | 'selected' | 'forest';

type PremiumCardProps = PropsWithChildren<{
  readonly tone?: PremiumCardTone;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly accessibilityRole?: AccessibilityRole;
  readonly style?: StyleProp<ViewStyle>;
}>;

export function PremiumCard({
  children,
  tone = 'default',
  onPress,
  accessibilityLabel,
  accessibilityRole,
  style,
}: PremiumCardProps): React.JSX.Element {
  const cardStyle = [
    componentStyles.card,
    componentStyles[tone],
    style,
  ];

  if (!onPress) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        style={cardStyle}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      onPress={onPress}
      style={({ pressed }) => [
        ...cardStyle,
        pressed && componentStyles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const componentStyles = StyleSheet.create({
  card: {
    borderRadius: radiusTokens.xl,
    padding: spacingTokens.lg,
    gap: spacingTokens.sm,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
  },
  default: {
    backgroundColor: colorTokens.surface.primary,
  },
  elevated: {
    backgroundColor: colorTokens.surface.elevated,
    ...shadowTokens.low,
  },
  selected: {
    backgroundColor: colorTokens.surface.selected,
    borderColor: colorTokens.brand.primary,
  },
  forest: {
    backgroundColor: colorTokens.brand.forest,
    borderColor: colorTokens.brand.forest,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
