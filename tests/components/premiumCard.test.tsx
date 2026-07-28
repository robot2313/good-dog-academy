import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PremiumCard } from '../../src/components/PremiumCard';

describe('PremiumCard', () => {
  it('renders a static content surface without inventing an action', () => {
    const view = render(<PremiumCard><Text>Training guidance</Text></PremiumCard>);

    expect(view.getByText('Training guidance')).toBeTruthy();
    expect(view.queryByRole('button')).toBeNull();
  });

  it('becomes an accessible button only when an action is supplied', () => {
    const onPress = jest.fn();
    const view = render(
      <PremiumCard accessibilityLabel="Open recall lesson" onPress={onPress} tone="elevated">
        <Text>Recall</Text>
      </PremiumCard>,
    );

    fireEvent.press(view.getByRole('button', { name: 'Open recall lesson' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
