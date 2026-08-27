import { fireEvent, render } from '@testing-library/react-native';
import { Modal, Text } from 'react-native';

import { AppModal } from '../../src/components/AppModal';

describe('AppModal', () => {
  it('stays out of the accessibility tree while hidden', () => {
    const view = render(
      <AppModal visible={false} title="Training tip" onClose={jest.fn()}>
        <Text>Helpful content</Text>
      </AppModal>,
    );
    expect(view.queryByText('Helpful content')).toBeNull();
  });

  it('presents an accessible heading and close action', () => {
    const onClose = jest.fn();
    const view = render(
      <AppModal visible title="Training tip" onClose={onClose}>
        <Text>Reward the smallest good choice.</Text>
      </AppModal>,
    );

    expect(view.getByRole('header', { name: 'Training tip' })).toBeTruthy();
    expect(view.getByText(/Reward the smallest/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the same close callback for the Android back action', () => {
    const onClose = jest.fn();
    const view = render(
      <AppModal visible title="Confirmation" onClose={onClose}>
        <Text>Confirm carefully.</Text>
      </AppModal>,
    );

    view.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
