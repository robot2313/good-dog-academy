import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from '../../src/hooks/useReducedMotion';

describe('useReducedMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults safely, then uses the device preference and live updates', async () => {
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const addEventListener = jest.spyOn(AccessibilityInfo, 'addEventListener')
      .mockReturnValue({
        remove,
      } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);

    const hook = renderHook(() => useReducedMotion());
    expect(hook.result.current).toBe(true);
    await waitFor(() => expect(hook.result.current).toBe(false));

    const listener = addEventListener.mock.calls[0][1] as unknown as (
      enabled: boolean,
    ) => void;
    act(() => listener(true));
    expect(hook.result.current).toBe(true);
    hook.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('keeps motion reduced when the device query fails', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValue(new Error('unavailable'));
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);

    const hook = renderHook(() => useReducedMotion());
    await act(async () => Promise.resolve());
    expect(hook.result.current).toBe(true);
  });
});
