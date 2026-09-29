import {
  QUADRUPED_INPUT_SIZE,
  rgbBytesToQuadrupedTensor,
} from './QuadrupedInputTensor';

describe('rgbBytesToQuadrupedTensor', () => {
  it('creates channel-first raw RGB input matching the upstream training contract', () => {
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
    expect(tensor[0]).toBe(124);
    expect(tensor[plane]).toBe(116);
    expect(tensor[plane * 2]).toBe(104);
  });

  it('rejects images that are not the model input size', () => {
    expect(() => rgbBytesToQuadrupedTensor(new Uint8Array(3), 1, 1, 3)).toThrow('256x256');
  });
});
