import {
  classifyQuadrupedPosture,
  QUADRUPED_JOINTS,
  type QuadrupedJointName,
  type QuadrupedPose,
} from './QuadrupedPose';

function pose(overrides: Partial<Record<QuadrupedJointName, { x: number; y: number; confidence: number }>>): QuadrupedPose {
  const keypoints = Object.fromEntries(
    QUADRUPED_JOINTS.map((name, index) => [name, {
      x: 0.35 + (index % 3) * 0.1,
      y: 0.5,
      confidence: 0.95,
    }]),
  ) as QuadrupedPose['keypoints'];

  for (const [name, value] of Object.entries(overrides)) {
    if (value) keypoints[name as QuadrupedJointName] = value;
  }
  return { keypoints };
}

const standingPose = () => pose({
  neck: { x: 0.42, y: 0.24, confidence: 0.95 },
  tail_root: { x: 0.67, y: 0.31, confidence: 0.95 },
  left_shoulder: { x: 0.43, y: 0.30, confidence: 0.95 },
  right_shoulder: { x: 0.47, y: 0.30, confidence: 0.95 },
  left_hip: { x: 0.63, y: 0.32, confidence: 0.95 },
  right_hip: { x: 0.67, y: 0.32, confidence: 0.95 },
  left_front_paw: { x: 0.43, y: 0.85, confidence: 0.95 },
  right_front_paw: { x: 0.47, y: 0.85, confidence: 0.95 },
  left_back_paw: { x: 0.63, y: 0.86, confidence: 0.95 },
  right_back_paw: { x: 0.67, y: 0.86, confidence: 0.95 },
});

const sittingPose = () => pose({
  neck: { x: 0.42, y: 0.24, confidence: 0.95 },
  tail_root: { x: 0.67, y: 0.67, confidence: 0.95 },
  left_shoulder: { x: 0.43, y: 0.30, confidence: 0.95 },
  right_shoulder: { x: 0.47, y: 0.30, confidence: 0.95 },
  left_hip: { x: 0.63, y: 0.68, confidence: 0.95 },
  right_hip: { x: 0.67, y: 0.68, confidence: 0.95 },
  left_front_paw: { x: 0.43, y: 0.85, confidence: 0.95 },
  right_front_paw: { x: 0.47, y: 0.85, confidence: 0.95 },
  left_back_paw: { x: 0.62, y: 0.86, confidence: 0.95 },
  right_back_paw: { x: 0.68, y: 0.86, confidence: 0.95 },
});

describe('classifyQuadrupedPosture', () => {
  it('classifies a clear standing geometry', () => {
    const result = classifyQuadrupedPosture(standingPose());
    expect(result.posture).toBe('stand_like');
    expect(result.confidence).not.toBeNull();
    expect(result.reason).toBe('classified_geometry');
  });

  it('classifies a clear sitting geometry', () => {
    const result = classifyQuadrupedPosture(sittingPose());
    expect(result.posture).toBe('sit_like');
    expect(result.confidence).not.toBeNull();
    expect(result.reason).toBe('classified_geometry');
  });

  it('fails closed when a required joint is unreliable', () => {
    const lowConfidence = standingPose();
    lowConfidence.keypoints.left_front_paw.confidence = 0.2;
    const result = classifyQuadrupedPosture(lowConfidence);
    expect(result).toEqual({ posture: 'unknown', confidence: null, reason: 'insufficient_joint_confidence' });
  });

  it('fails closed when the dog occupies too little vertical image space', () => {
    const tiny = standingPose();
    for (const name of QUADRUPED_JOINTS) {
      tiny.keypoints[name] = { ...tiny.keypoints[name], y: 0.5 + (tiny.keypoints[name].y - 0.5) * 0.08 };
    }
    const result = classifyQuadrupedPosture(tiny);
    expect(result.posture).toBe('unknown');
    expect(result.reason).toBe('insufficient_body_scale');
  });
});
