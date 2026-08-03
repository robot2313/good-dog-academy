import { StyleSheet, Text, View } from 'react-native';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../theme/tokens';

export type StatusPillTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type StatusPillProps = {
  readonly label: string;
  readonly tone?: StatusPillTone;
  readonly accessibilityLabel?: string;
};

export function StatusPill({
  label,
  tone = 'neutral',
  accessibilityLabel,
}: StatusPillProps): React.JSX.Element {
  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      style={[componentStyles.pill, componentStyles[tone]]}
    >
      <Text style={[componentStyles.text, componentStyles[`${tone}Text`]]}>
        {label}
      </Text>
    </View>
  );
}

const componentStyles = StyleSheet.create({
  pill: {
    flexShrink: 0,
    minHeight: 28,
    borderRadius: radiusTokens.pill,
    borderWidth: 1,
    paddingHorizontal: spacingTokens.sm,
    paddingVertical: spacingTokens.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typographyTokens.caption,
    fontWeight: '800',
  },
  success: {
    backgroundColor: colorTokens.status.successSurface,
    borderColor: colorTokens.brand.primary,
  },
  successText: {
    color: colorTokens.status.successText,
  },
  warning: {
    backgroundColor: colorTokens.status.warningSurface,
    borderColor: colorTokens.brand.gold,
  },
  warningText: {
    color: colorTokens.status.warningText,
  },
  error: {
    backgroundColor: colorTokens.status.errorSurface,
    borderColor: '#5A3A38',
  },
  errorText: {
    color: colorTokens.status.errorText,
  },
  info: {
    backgroundColor: colorTokens.status.infoSurface,
    borderColor: '#2A3A48',
  },
  infoText: {
    color: colorTokens.status.infoText,
  },
  neutral: {
    backgroundColor: colorTokens.status.neutralSurface,
    borderColor: colorTokens.border.strong,
  },
  neutralText: {
    color: colorTokens.status.neutralText,
  },
});
