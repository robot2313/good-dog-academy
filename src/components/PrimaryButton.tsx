import { AppButton } from './AppButton';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ title, onPress, disabled = false, accessibilityLabel }: PrimaryButtonProps): React.JSX.Element {
  return <AppButton
    title={title}
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={accessibilityLabel}
  />;
}
