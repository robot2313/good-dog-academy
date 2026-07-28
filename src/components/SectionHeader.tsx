import { StyleSheet, Text, View } from 'react-native';

import { colorTokens, spacingTokens, typographyTokens } from '../theme/tokens';

type SectionHeaderProps = {
  readonly title: string;
  readonly eyebrow?: string;
  readonly supportingText?: string;
  readonly inverse?: boolean;
};

export function SectionHeader({
  title,
  eyebrow,
  supportingText,
  inverse = false,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <View style={componentStyles.container}>
      {eyebrow ? (
        <Text style={[componentStyles.eyebrow, inverse && componentStyles.inverseAccent]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        style={[componentStyles.title, inverse && componentStyles.inverse]}
      >
        {title}
      </Text>
      {supportingText ? (
        <Text style={[componentStyles.supporting, inverse && componentStyles.inverseSupporting]}>
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
}

const componentStyles = StyleSheet.create({
  container: {
    gap: spacingTokens.xs,
  },
  eyebrow: {
    ...typographyTokens.label,
    color: colorTokens.brand.primary,
    letterSpacing: 1.1,
  },
  title: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.text.primary,
  },
  supporting: {
    ...typographyTokens.supporting,
    color: colorTokens.text.secondary,
  },
  inverse: {
    color: colorTokens.text.inverse,
  },
  inverseAccent: {
    color: colorTokens.brand.gold,
  },
  inverseSupporting: {
    color: 'rgba(255,255,255,0.78)',
  },
});
