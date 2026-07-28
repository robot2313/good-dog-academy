import { render } from '@testing-library/react-native';

import { LessonThumbnail } from '../../src/components/LessonThumbnail';

describe('LessonThumbnail', () => {
  it('uses the bundled skill illustration with a concise label', () => {
    const view = render(<LessonThumbnail skill="recall" lessonTitle="Name Response" />);
    expect(view.getByRole('image', {
      name: 'Name Response lesson illustration',
    })).toBeTruthy();
  });

  it('renders a safe visual fallback when no skill is available', () => {
    const view = render(<LessonThumbnail skill={null} lessonTitle="Unknown lesson" />);
    expect(view.getByRole('image', {
      name: 'Unknown lesson lesson illustration',
    })).toBeTruthy();
  });

  it('hides a decorative thumbnail from accessibility', () => {
    const view = render(
      <LessonThumbnail decorative skill="focus" lessonTitle="Marker Word" />,
    );
    expect(view.queryByRole('image')).toBeNull();
  });
});
