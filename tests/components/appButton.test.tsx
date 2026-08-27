import { fireEvent, render } from '@testing-library/react-native';

import { AppButton } from '../../src/components/AppButton';

describe('AppButton', () => {
  it('exposes a labelled, pressable, phone-sized primary action', () => {
    const onPress = jest.fn();
    const view = render(<AppButton title="Continue training" onPress={onPress} />);
    const button = view.getByRole('button', { name: 'Continue training' });

    expect(button).toHaveStyle({ minHeight: 52 });
    expect(button.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports custom labels and visual variants without changing action semantics', () => {
    const view = render(
      <AppButton
        title="Remove"
        accessibilityLabel="Remove saved photo"
        variant="destructive"
        onPress={jest.fn()}
      />,
    );

    expect(view.getByRole('button', { name: 'Remove saved photo' })).toBeTruthy();
    expect(view.getByText('Remove')).toBeTruthy();
  });

  it('blocks disabled and loading actions', () => {
    const onPress = jest.fn();
    const disabled = render(<AppButton title="Disabled" disabled onPress={onPress} />);
    fireEvent.press(disabled.getByRole('button', { name: 'Disabled' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(disabled.getByRole('button').props.accessibilityState).toEqual({ disabled: true });
    disabled.unmount();

    const loading = render(<AppButton title="Saving session" loading onPress={onPress} />);
    expect(loading.getByRole('button', { name: 'Saving session' }).props.accessibilityState)
      .toEqual({ disabled: true });
  });
});
