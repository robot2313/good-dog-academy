import type { PropsWithChildren } from 'react';
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { referenceScreenStyles, referenceStyles } from '../theme/referenceStyles';

export type PremiumCardTone = 'default' | 'elevated' | 'selected' | 'forest';

type PremiumCardProps = PropsWithChildren<{
  readonly tone?: PremiumCardTone;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly accessibilityRole?: AccessibilityRole;
  readonly style?: StyleProp<ViewStyle>;
}>;

/**
 * The reference card: white (or a soft green wash when selected), 12px radius,
 * hairline warm border, no heavy shadow. `forest` is kept as an alias of the
 * selected wash so older callers keep working without dark panels reappearing.
 */
export function PremiumCard({
  children,
  tone = 'default',
  onPress,
  accessibilityLabel,
  accessibilityRole,
  style,
}: PremiumCardProps): React.JSX.Element {
  const toneStyle = tone === 'selected' || tone === 'forest'
    ? referenceScreenStyles.cardSelected
    : tone === 'elevated'
      ? referenceScreenStyles.cardWarm
      : referenceScreenStyles.card;
  const cardStyle = [toneStyle, style];

  if (!onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole} style={cardStyle}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      onPress={onPress}
      style={({ pressed }) => [...cardStyle, pressed && referenceStyles.pressed]}
    >
      {children}
    </Pressable>
  );
}
