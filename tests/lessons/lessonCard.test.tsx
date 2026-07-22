import { fireEvent, render } from '@testing-library/react-native';

import { LessonCard } from '../../src/components/LessonCard';
import { foundationLesson } from '../support/lessonFixtures';

describe('LessonCard states and accessibility', () => {
  it('shows prerequisite guidance and no session action while locked', () => {
    const view = render(<LessonCard lesson={foundationLesson} status="locked" lockedMessage="Complete Name Response first." onComplete={jest.fn()} />);
    expect(view.getByText('Locked')).toBeTruthy();
    expect(view.getByText('Complete Name Response first.')).toBeTruthy();
    expect(view.queryByText('Finish session')).toBeNull();
  });

  it('exposes every feedback choice as a labelled button', () => {
    const onComplete = jest.fn();
    const view = render(<LessonCard lesson={foundationLesson} status="available" onComplete={onComplete} />);
    fireEvent.press(view.getByRole('button', { name: 'Finish session' }));
    expect(view.getByRole('button', { name: 'Session needs more practice' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Session went well' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Session went great' }));
    expect(onComplete).toHaveBeenCalledWith(5);
  });
});
