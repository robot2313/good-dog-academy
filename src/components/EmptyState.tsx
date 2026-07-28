import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colorTokens, spacingTokens, typographyTokens } from '../theme/tokens';
import { AppButton } from './AppButton';
import { PremiumCard } from './PremiumCard';

type EmptyStateProps = {
  readonly title: string;
  readonly message: string;
  readonly illustration?: ReactNode;
  readonly actionTitle?: string;
  readonly onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  illustration,
  actionTitle,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  return (
    <PremiumCard tone="elevated" style={componentStyles.card}>
      {illustration ? <View style={componentStyles.illustration}>{illustration}</View> : null}
      <Text accessibilityRole="header" style={componentStyles.title}>{title}</Text>
      <Text style={componentStyles.message}>{message}</Text>
      {actionTitle && onAction ? (
        <View style={componentStyles.action}>
          <AppButton title={actionTitle} onPress={onAction} />
        </View>
      ) : null}
    </PremiumCard>
  );
}

const componentStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacingTokens.xl,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.text.primary,
    textAlign: 'center',
  },
  message: {
    ...typographyTokens.body,
    color: colorTokens.text.secondary,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacingTokens.xxs,
  },
});
