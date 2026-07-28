import { Animated } from 'react-native';
import { render } from '@testing-library/react-native';

import { SkeletonBlock } from '../../src/components/SkeletonBlock';
import { useReducedMotion } from '../../src/hooks/useReducedMotion';

jest.mock('../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: jest.fn(),
}));

const mockUseReducedMotion = jest.mocked(useReducedMotion);

describe('SkeletonBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps an accessible loading description', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const view = render(<SkeletonBlock accessibilityLabel="Loading lesson cards" />);
    expect(view.getByRole('progressbar', { name: 'Loading lesson cards' })).toBeTruthy();
  });

  it('does not start a repeating animation when reduced motion is enabled', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const loop = jest.spyOn(Animated, 'loop');
    render(<SkeletonBlock />);
    expect(loop).not.toHaveBeenCalled();
    loop.mockRestore();
  });

  it('starts and cleans up animation when motion is allowed', () => {
    mockUseReducedMotion.mockReturnValue(false);
    const start = jest.fn();
    const stop = jest.fn();
    const loop = jest.spyOn(Animated, 'loop').mockReturnValue({
      start,
      stop,
      reset: jest.fn(),
    } as unknown as Animated.CompositeAnimation);
    const view = render(<SkeletonBlock />);

    expect(start).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
    loop.mockRestore();
  });
});
