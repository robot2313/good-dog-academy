import { render } from '@testing-library/react-native';

import {
  LessonIllustration,
  lessonIllustrationForSkill,
} from '../../src/features/lessons/coaching/LessonIllustration';
import { getLessonImageSource } from '../../src/features/lessons/coaching/lessonImageManifest';
import { styles } from '../../src/theme/styles';

const frame = styles.lessonIllustrationFrame as Record<string, unknown>;
const image = styles.lessonIllustration as Record<string, unknown>;
const card = styles.lessonIllustrationCard as Record<string, unknown>;

describe('lesson illustration layout', () => {
  it('gives the frame the full card width and a 3:2 landscape ratio (no fixed height)', () => {
    expect(frame.width).toBe('100%');
    expect(frame.aspectRatio).toBe(3 / 2);
    // A fixed numeric height would fight the aspect ratio and crop the landscape image.
    expect('height' in frame).toBe(false);
  });

  it('fills the frame with the image and centres it inside a dark fallback background', () => {
    expect(image.width).toBe('100%');
    expect(image.height).toBe('100%');
    expect(frame.backgroundColor).toBe('#E3EBDD');
    expect(frame.alignItems).toBe('center');
    expect(frame.justifyContent).toBe('center');
  });

  it('clips to rounded corners without transforms or absolute positioning', () => {
    expect(frame.overflow).toBe('hidden');
    expect(card.overflow).toBe('hidden');
    expect(typeof card.borderRadius).toBe('number');
    for (const style of [card, frame, image]) {
      expect('transform' in style).toBe(false);
      expect(style.position).not.toBe('absolute');
      expect('translateX' in style).toBe(false);
      expect('translateY' in style).toBe(false);
      expect('scale' in style).toBe(false);
    }
    // No negative margins pulling the image out of the frame.
    for (const key of ['marginTop', 'marginLeft', 'marginRight', 'marginBottom']) {
      expect(Number(image[key] ?? 0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('renders the lesson-specific image resolved by lesson id as an editorial full-bleed crop', () => {
    const lessonId = 'recall-name-response';
    const skill = 'recall' as const;
    const label = lessonIllustrationForSkill(skill).accessibilityLabel;

    const view = render(
      <LessonIllustration skill={skill} lessonId={lessonId} commonMistake="Some mistake" />,
    );
    const rendered = view.getByLabelText(label);

    expect(rendered.props.source).toBe(getLessonImageSource(lessonId, skill));
    expect(rendered.props.resizeMode).toBe('cover');
  });

  it('preserves the accessibility label on the illustration image', () => {
    const label = lessonIllustrationForSkill('reactivity').accessibilityLabel;
    const view = render(
      <LessonIllustration skill="reactivity" lessonId="reactivity-safe-distance" />,
    );
    expect(view.getByLabelText(label)).toBeTruthy();
    expect(label.length).toBeGreaterThan(0);
  });
});
