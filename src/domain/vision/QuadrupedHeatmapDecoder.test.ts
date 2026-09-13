import {
  decodeQuadrupedHeatmaps,
  QUADRUPED_HEATMAP_SIZE,
  QUADRUPED_KEYPOINT_COUNT,
} from './QuadrupedHeatmapDecoder';

const channelSize = QUADRUPED_HEATMAP_SIZE * QUADRUPED_HEATMAP_SIZE;

function heatmaps(): Float32Array {
  const data = new Float32Array(QUADRUPED_KEYPOINT_COUNT * channelSize);
  for (let channel = 0; channel < QUADRUPED_KEYPOINT_COUNT; channel += 1) {
    const x = 8 + (channel % 8) * 5;
    const y = 10 + Math.floor(channel / 8) * 14;
    data[channel * channelSize + y * QUADRUPED_HEATMAP_SIZE + x] = 0.9;
  }
  return data;
}

describe('decodeQuadrupedHeatmaps', () => {
  it('decodes all 17 channels into normalised pose keypoints', () => {
    const result = decodeQuadrupedHeatmaps(heatmaps());

    expect(Object.keys(result.keypoints)).toHaveLength(17);
    expect(result.keypoints.left_eye.x).toBeCloseTo(8 / 64, 2);
    expect(result.keypoints.left_eye.y).toBeCloseTo(10 / 64, 2);
    expect(result.keypoints.left_eye.confidence).toBeCloseTo(0.9, 2);
    expect(result.keypoints.right_back_paw.confidence).toBeGreaterThan(0.85);
  });

  it('rejects unexpected ONNX output sizes instead of decoding corrupt evidence', () => {
    expect(() => decodeQuadrupedHeatmaps(new Float32Array(42))).toThrow('Expected');
  });
});
