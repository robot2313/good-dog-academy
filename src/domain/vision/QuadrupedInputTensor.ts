export const QUADRUPED_INPUT_SIZE = 256;
export const QUADRUPED_INPUT_CHANNELS = 3;
export const QUADRUPED_INPUT_MEAN = [123.675, 116.28, 103.53] as const;
export const QUADRUPED_INPUT_STD = [58.395, 57.12, 57.375] as const;

export function rgbBytesToQuadrupedTensor(
  pixels: Uint8Array,
  width: number,
  height: number,
  channels: 3 | 4,
): Float32Array {
  if (width !== QUADRUPED_INPUT_SIZE || height !== QUADRUPED_INPUT_SIZE) {
    throw new Error(`Quadruped pose input must be ${QUADRUPED_INPUT_SIZE}x${QUADRUPED_INPUT_SIZE}.`);
  }

  const expected = width * height * channels;
  if (pixels.length !== expected) {
    throw new Error(`Expected ${expected} image bytes, received ${pixels.length}.`);
  }

  const plane = width * height;
  const output = new Float32Array(QUADRUPED_INPUT_CHANNELS * plane);
  for (let pixel = 0; pixel < plane; pixel += 1) {
    const source = pixel * channels;
    output[pixel] = ((pixels[source] ?? 0) - QUADRUPED_INPUT_MEAN[0]) / QUADRUPED_INPUT_STD[0];
    output[plane + pixel] = ((pixels[source + 1] ?? 0) - QUADRUPED_INPUT_MEAN[1]) / QUADRUPED_INPUT_STD[1];
    output[plane * 2 + pixel] = ((pixels[source + 2] ?? 0) - QUADRUPED_INPUT_MEAN[2]) / QUADRUPED_INPUT_STD[2];
  }
  return output;
}
