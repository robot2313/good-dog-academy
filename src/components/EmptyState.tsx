import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { referenceScreenStyles } from '../theme/referenceStyles';
import { AppButton } from './AppButton';

type EmptyStateProps = {
  readonly title: string;
  readonly message: string;
  readonly illustration?: ReactNode;
  readonly actionTitle?: string;
  readonly onAction?: () => void;
};

export function EmptyState({ title, message, illustration, actionTitle, onAction }: EmptyStateProps): React.JSX.Element {
  return (
    <View style={referenceScreenStyles.emptyCard}>
      {illustration ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{illustration}</View> : null}
      <Text accessibilityRole="header" style={referenceScreenStyles.emptyTitle}>{title}</Text>
      <Text style={referenceScreenStyles.emptyBody}>{message}</Text>
      {actionTitle && onAction ? (
        <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
          <AppButton title={actionTitle} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
