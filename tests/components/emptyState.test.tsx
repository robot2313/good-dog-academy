import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('presents a heading, guidance, optional illustration, and action', () => {
    const onAction = jest.fn();
    const view = render(
      <EmptyState
        title="No sessions yet"
        message="Complete a guided lesson and it will appear here."
        illustration={<Text accessibilityLabel="Resting dog illustration">Dog art</Text>}
        actionTitle="Browse lessons"
        onAction={onAction}
      />,
    );

    expect(view.getByRole('header', { name: 'No sessions yet' })).toBeTruthy();
    expect(view.getByText(/Complete a guided lesson/)).toBeTruthy();
    expect(view.getByLabelText('Resting dog illustration')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Browse lessons' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render an incomplete action', () => {
    const view = render(
      <EmptyState title="Nothing here" message="Try again later." actionTitle="Missing handler" />,
    );
    expect(view.queryByRole('button')).toBeNull();
  });
});
