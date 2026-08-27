import { render } from '@testing-library/react-native';

import { StatusPill, type StatusPillTone } from '../../src/components/StatusPill';

describe('StatusPill', () => {
  it.each<StatusPillTone>(['success', 'warning', 'error', 'info', 'neutral'])(
    'renders the %s state as visible text',
    (tone) => {
      const view = render(<StatusPill label={`${tone} state`} tone={tone} />);
      expect(view.getByText(`${tone} state`)).toBeTruthy();
    },
  );

  it('can expose a concise standalone accessibility label', () => {
    const view = render(
      <StatusPill
        label="Completed"
        tone="success"
        accessibilityLabel="Lesson status: Completed"
      />,
    );
    expect(view.getByLabelText('Lesson status: Completed')).toBeTruthy();
  });
});
