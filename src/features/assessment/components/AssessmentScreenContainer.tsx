import type { PropsWithChildren } from 'react';
import { AppScreen } from '../../../components/AppScreen';
import { IdentityHeader } from '../../../components/IdentityHeader';
import { ProgressIndicator } from '../../../components/ProgressIndicator';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';

export function AssessmentScreenContainer({ current, onBack, children }: PropsWithChildren<{ current: number; onBack?: () => void }>): React.JSX.Element {
  return (
    <AppScreen>
      <IdentityHeader eyebrow="Getting to know" />
      {onBack ? <SecondaryTextButton title="Back" onPress={onBack} /> : null}
      <ProgressIndicator current={current} total={5} />
      {children}
    </AppScreen>
  );
}
