import { render } from '@testing-library/react-native';

import { productionLessonDefinitions } from '../../src/features/lessons/catalogue/definitions';
import { LessonCoachingGuide } from '../../src/features/lessons/coaching/LessonCoachingGuide';
import { getLessonImageSource } from '../../src/features/lessons/coaching/lessonImageManifest';

jest.mock('../../src/features/lessons/coaching/lessonImageManifest', () => ({
  __esModule: true,
  getLessonImageSource: jest.fn(() => 1),
}));

const mockedGetLessonImageSource = getLessonImageSource as jest.MockedFunction<
  typeof getLessonImageSource
>;

describe('LessonIllustration callers pass the real lesson id', () => {
  beforeEach(() => {
    mockedGetLessonImageSource.mockClear();
  });

  it('LessonCoachingGuide resolves the image using the actual lesson id', () => {
    const lesson = productionLessonDefinitions[0];
    render(<LessonCoachingGuide lesson={lesson} />);
    expect(mockedGetLessonImageSource).toHaveBeenCalledWith(lesson.id, lesson.skill);
  });

  it('passes each lesson its own id rather than a shared value', () => {
    const lessonA = productionLessonDefinitions[0];
    const lessonB = productionLessonDefinitions[1];

    render(<LessonCoachingGuide lesson={lessonA} />);
    expect(mockedGetLessonImageSource).toHaveBeenLastCalledWith(lessonA.id, lessonA.skill);

    mockedGetLessonImageSource.mockClear();
    render(<LessonCoachingGuide lesson={lessonB} />);
    expect(mockedGetLessonImageSource).toHaveBeenLastCalledWith(lessonB.id, lessonB.skill);

    expect(lessonA.id).not.toBe(lessonB.id);
  });
});
