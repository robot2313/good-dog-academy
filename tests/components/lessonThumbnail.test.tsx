import { render } from '@testing-library/react-native';
import { Image } from 'react-native';

import { LessonThumbnail } from '../../src/components/LessonThumbnail';
import { getLessonImageSource } from '../../src/features/lessons/coaching/lessonImageManifest';

describe('LessonThumbnail', () => {
  it('uses the bundled skill illustration with a concise label', () => {
    const view = render(
      <LessonThumbnail
        lessonId="recall-name-response"
        skill="recall"
        lessonTitle="Name Response"
      />,
    );
    expect(view.getByRole('image', {
      name: 'Name Response lesson photograph',
    })).toBeTruthy();
    expect(view.UNSAFE_getByType(Image).props.source)
      .toBe(getLessonImageSource('recall-name-response', 'recall'));
    expect(view.UNSAFE_getByType(Image).props.resizeMode).toBe('cover');
  });

  it('renders a safe visual fallback when no skill is available', () => {
    const view = render(<LessonThumbnail skill={null} lessonTitle="Unknown lesson" />);
    expect(view.getByRole('image', {
      name: 'Unknown lesson lesson photograph',
    })).toBeTruthy();
  });

  it('hides a decorative thumbnail from accessibility', () => {
    const view = render(
      <LessonThumbnail decorative skill="focus" lessonTitle="Marker Word" />,
    );
    expect(view.queryByRole('image')).toBeNull();
  });
});
