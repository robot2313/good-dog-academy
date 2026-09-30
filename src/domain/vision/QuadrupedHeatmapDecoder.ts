import { QUADRUPED_JOINTS, type QuadrupedPose } from './QuadrupedPose';

export const QUADRUPED_HEATMAP_SIZE = 64;
export const QUADRUPED_POSE_INPUT_SIZE = 256;
export const QUADRUPED_KEYPOINT_COUNT = 17;

const GAUSSIAN_KERNEL = (() => {
  const values = [-2, -1, 0, 1, 2].map((x) => Math.exp(-(x * x) / 2));
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
})();

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function index(channel: number, y: number, x: number): number {
  return channel * QUADRUPED_HEATMAP_SIZE * QUADRUPED_HEATMAP_SIZE + y * QUADRUPED_HEATMAP_SIZE + x;
}

function blurChannel(input: Float32Array, channel: number): Float64Array {
  const size = QUADRUPED_HEATMAP_SIZE;
  const horizontal = new Float64Array(size * size);
  const output = new Float64Array(size * size);
  let sourcePeak = -Infinity;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = input[index(channel, y, x)] ?? 0;
      sourcePeak = Math.max(sourcePeak, value);
      let total = 0;
      for (let k = -2; k <= 2; k += 1) {
        const sampleX = clamp(x + k, 0, size - 1);
        total += (input[index(channel, y, sampleX)] ?? 0) * (GAUSSIAN_KERNEL[k + 2] ?? 0);
      }
      horizontal[y * size + x] = total;
    }
  }

  let blurredPeak = -Infinity;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let total = 0;
      for (let k = -2; k <= 2; k += 1) {
        const sampleY = clamp(y + k, 0, size - 1);
        total += (horizontal[sampleY * size + x] ?? 0) * (GAUSSIAN_KERNEL[k + 2] ?? 0);
      }
      output[y * size + x] = total;
      blurredPeak = Math.max(blurredPeak, total);
    }
  }

  if (blurredPeak > 1e-10 && Number.isFinite(sourcePeak)) {
    const scale = sourcePeak / blurredPeak;
    for (let i = 0; i < output.length; i += 1) output[i] = (output[i] ?? 0) * scale;
  }

  return output;
}

function decodeChannel(input: Float32Array, channel: number): { x: number; y: number; confidence: number } {
  const size = QUADRUPED_HEATMAP_SIZE;
  const blurred = blurChannel(input, channel);
  let best = -Infinity;
  let bestX = 0;
  let bestY = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = blurred[y * size + x] ?? 0;
      if (value > best) {
        best = value;
        bestX = x;
        bestY = y;
      }
    }
  }

  let refinedX = bestX;
  let refinedY = bestY;
  if (bestX >= 1 && bestX < size - 1 && bestY >= 1 && bestY < size - 1) {
    const logValue = (x: number, y: number) => Math.log(Math.max(blurred[y * size + x] ?? 0, 1e-10));
    const centre = logValue(bestX, bestY);
    const dx = 0.5 * (logValue(bestX + 1, bestY) - logValue(bestX - 1, bestY));
    const dy = 0.5 * (logValue(bestX, bestY + 1) - logValue(bestX, bestY - 1));
    const dxx = logValue(bestX + 1, bestY) - 2 * centre + logValue(bestX - 1, bestY);
    const dyy = logValue(bestX, bestY + 1) - 2 * centre + logValue(bestX, bestY - 1);
    const dxy = 0.25 * (
      logValue(bestX + 1, bestY + 1) - logValue(bestX - 1, bestY + 1) -
      logValue(bestX + 1, bestY - 1) + logValue(bestX - 1, bestY - 1)
    );
    const determinant = dxx * dyy - dxy * dxy;

    if (Math.abs(determinant) >= 1e-12 && dxx < 0 && dyy < 0) {
      const offsetX = -(dyy * dx - dxy * dy) / determinant;
      const offsetY = -(dxx * dy - dxy * dx) / determinant;
      if (Math.abs(offsetX) <= 1 && Math.abs(offsetY) <= 1) {
        refinedX += clamp(offsetX, -0.5, 0.5);
        refinedY += clamp(offsetY, -0.5, 0.5);
      }
    }
  }

  // Coordinates stay in the model crop's normalised [0,1] space. The crop
  // mapper/native adapter is responsible for mapping them back into the frame.
  return {
    x: clamp((refinedX * 4) / QUADRUPED_POSE_INPUT_SIZE, 0, 1),
    y: clamp((refinedY * 4) / QUADRUPED_POSE_INPUT_SIZE, 0, 1),
    confidence: clamp(Number.isFinite(best) ? best : 0, 0, 1),
  };
}

export function decodeQuadrupedHeatmaps(data: Float32Array): QuadrupedPose {
  const expected = QUADRUPED_KEYPOINT_COUNT * QUADRUPED_HEATMAP_SIZE * QUADRUPED_HEATMAP_SIZE;
  if (data.length !== expected) {
    throw new Error(`Expected ${expected} quadruped heatmap values, received ${data.length}.`);
  }

  const entries = QUADRUPED_JOINTS.map((name, channel) => [name, decodeChannel(data, channel)] as const);
  return { keypoints: Object.fromEntries(entries) as QuadrupedPose['keypoints'] };
}
