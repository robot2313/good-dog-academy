import {
  QUADRUPED_INPUT_MEAN,
  QUADRUPED_INPUT_SIZE,
  QUADRUPED_INPUT_STD,
  rgbBytesToQuadrupedTensor,
} from './QuadrupedInputTensor';

describe('rgbBytesToQuadrupedTensor', () => {
  it('creates channel-first normalized RGB input matching the upstream training contract', () => {
    const plane = QUADRUPED_INPUT_SIZE * QUADRUPED_INPUT_SIZE;
    const pixels = new Uint8Array(plane * 4);
    for (let i = 0; i < plane; i += 1) {
      pixels[i * 4] = 124;
      pixels[i * 4 + 1] = 116;
      pixels[i * 4 + 2] = 104;
      pixels[i * 4 + 3] = 255;
    }

    const tensor = rgbBytesToQuadrupedTensor(pixels, QUADRUPED_INPUT_SIZE, QUADRUPED_INPUT_SIZE, 4);

    expect(tensor).toHaveLength(3 * plane);
    expect(tensor[0]).toBeCloseTo((124 - QUADRUPED_INPUT_MEAN[0]) / QUADRUPED_INPUT_STD[0], 5);
    expect(tensor[plane]).toBeCloseTo((116 - QUADRUPED_INPUT_MEAN[1]) / QUADRUPED_INPUT_STD[1], 5);
    expect(tensor[plane * 2]).toBeCloseTo((104 - QUADRUPED_INPUT_MEAN[2]) / QUADRUPED_INPUT_STD[2], 5);
  });

  it('rejects images that are not the model input size', () => {
    expect(() => rgbBytesToQuadrupedTensor(new Uint8Array(3), 1, 1, 3)).toThrow('256x256');
  });
});
