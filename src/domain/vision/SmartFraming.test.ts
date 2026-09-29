import { analyseSmartFraming } from './SmartFraming';

describe('analyseSmartFraming', () => {
  it('guides a dog that is too far left or right', () => {
    expect(analyseSmartFraming({ left: 0.02, top: 0.25, width: 0.3, height: 0.3 }, 0.9).instruction).toBe('Move the camera right.');
    expect(analyseSmartFraming({ left: 0.68, top: 0.25, width: 0.3, height: 0.3 }, 0.9).instruction).toBe('Move the camera left.');
  });

  it('guides size and vertical framing', () => {
    expect(analyseSmartFraming({ left: 0.30, top: 0.20, width: 0.85, height: 0.50 }, 0.9).instruction).toBe('Move the camera back.');
    expect(analyseSmartFraming({ left: 0.35, top: 0.25, width: 0.18, height: 0.18 }, 0.9).instruction).toBe('Move the camera closer.');
    expect(analyseSmartFraming({ left: 0.35, top: 0.01, width: 0.25, height: 0.25 }, 0.9).instruction).toBe('Move the camera down.');
  });

  it('fails closed when tracking is unavailable', () => {
    expect(analyseSmartFraming(null, 0).ready).toBe(false);
    expect(analyseSmartFraming(null, 0).instruction).toBe('Keep your dog in view.');
  });
});
