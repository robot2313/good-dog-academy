import {
  expectedCueResponseForLesson,
  supportsAutomaticPostureScoring,
} from './ExpectedCueResponse';

describe('ExpectedCueResponse', () => {
  it('does not infer posture scoring from a four-paws-down lesson', () => {
    expect(expectedCueResponseForLesson('jumping-four-paws-down')).toBeNull();
    expect(supportsAutomaticPostureScoring('jumping-four-paws-down')).toBe(false);
  });

  it('does not reduce a multi-position settle lesson to one posture', () => {
    expect(expectedCueResponseForLesson('impulse-control-settle-on-mat')).toBeNull();
  });

  it('keeps attention and recall outcomes owner-confirmed instead of guessing from posture', () => {
    expect(expectedCueResponseForLesson('focus-check-in')).toBeNull();
    expect(expectedCueResponseForLesson('recall-foundations')).toBeNull();
  });

  it('treats unknown lessons as ineligible by default', () => {
    expect(expectedCueResponseForLesson('future-unconfigured-lesson')).toBeNull();
  });
});
