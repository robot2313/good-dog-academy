import type { DogPostureEvidence } from '../models/TrainingEvidence';

export const QUADRUPED_JOINTS = [
  'left_eye',
  'right_eye',
  'nose',
  'neck',
  'tail_root',
  'left_shoulder',
  'left_elbow',
  'left_front_paw',
  'right_shoulder',
  'right_elbow',
  'right_front_paw',
  'left_hip',
  'left_knee',
  'left_back_paw',
  'right_hip',
  'right_knee',
  'right_back_paw',
] as const;

export type QuadrupedJointName = typeof QUADRUPED_JOINTS[number];

export type PoseKeypoint = {
  x: number;
  y: number;
  confidence: number;
};

export type QuadrupedPose = {
  keypoints: Record<QuadrupedJointName, PoseKeypoint>;
};

export type PostureClassification = {
  posture: DogPostureEvidence;
  confidence: number | null;
  reason: string;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function point(pose: QuadrupedPose, name: QuadrupedJointName): PoseKeypoint {
  return pose.keypoints[name];
}

function pairAverage(pose: QuadrupedPose, a: QuadrupedJointName, b: QuadrupedJointName): PoseKeypoint {
  const left = point(pose, a);
  const right = point(pose, b);
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    confidence: Math.min(left.confidence, right.confidence),
  };
}

export type QuadrupedPosturePolicy = {
  minJointConfidence: number;
  minClassificationConfidence: number;
  minBodyHeight: number;
};

export const DEFAULT_QUADRUPED_POSTURE_POLICY: QuadrupedPosturePolicy = {
  minJointConfidence: 0.68,
  minClassificationConfidence: 0.58,
  minBodyHeight: 0.12,
};

export function classifyQuadrupedPosture(
  pose: QuadrupedPose,
  policy: QuadrupedPosturePolicy = DEFAULT_QUADRUPED_POSTURE_POLICY,
): PostureClassification {
  const shoulder = pairAverage(pose, 'left_shoulder', 'right_shoulder');
  const hip = pairAverage(pose, 'left_hip', 'right_hip');
  const frontPaw = pairAverage(pose, 'left_front_paw', 'right_front_paw');
  const backPaw = pairAverage(pose, 'left_back_paw', 'right_back_paw');
  const neck = point(pose, 'neck');
  const tailRoot = point(pose, 'tail_root');

  const requiredConfidence = Math.min(
    shoulder.confidence,
    hip.confidence,
    frontPaw.confidence,
    backPaw.confidence,
    neck.confidence,
    tailRoot.confidence,
  );

  if (requiredConfidence < policy.minJointConfidence) {
    return { posture: 'unknown', confidence: null, reason: 'insufficient_joint_confidence' };
  }

  const pawFloor = average([frontPaw.y, backPaw.y]);
  const bodyTop = Math.min(shoulder.y, hip.y, neck.y, tailRoot.y);
  const bodyHeight = pawFloor - bodyTop;
  if (bodyHeight < policy.minBodyHeight) {
    return { posture: 'unknown', confidence: null, reason: 'insufficient_body_scale' };
  }

  const shoulderClearance = clamp01((frontPaw.y - shoulder.y) / bodyHeight);
  const hipClearance = clamp01((backPaw.y - hip.y) / bodyHeight);
  const torsoLevel = clamp01(1 - Math.abs(shoulder.y - hip.y) / bodyHeight);
  const neckHipLevel = clamp01(1 - Math.abs(neck.y - hip.y) / bodyHeight);

  const standScore = clamp01(
    0.38 * shoulderClearance +
    0.38 * hipClearance +
    0.24 * torsoLevel,
  );

  const sitRearCompression = clamp01(1 - hipClearance);
  const sitScore = clamp01(
    0.46 * shoulderClearance +
    0.38 * sitRearCompression +
    0.16 * torsoLevel,
  );

  const downCompression = clamp01(1 - average([shoulderClearance, hipClearance]));
  const downScore = clamp01(
    0.46 * downCompression +
    0.30 * torsoLevel +
    0.24 * neckHipLevel,
  );

  const candidates: Array<{ posture: DogPostureEvidence; score: number }> = [
    { posture: 'stand_like', score: standScore },
    { posture: 'sit_like', score: sitScore },
    { posture: 'down_like', score: downScore },
  ].sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const second = candidates[1];
  if (!best || !second) return { posture: 'unknown', confidence: null, reason: 'no_candidate' };

  const margin = best.score - second.score;
  const confidence = clamp01(best.score * 0.82 + margin * 0.18) * requiredConfidence;
  if (confidence < policy.minClassificationConfidence || margin < 0.08) {
    return { posture: 'unknown', confidence, reason: 'ambiguous_geometry' };
  }

  return { posture: best.posture, confidence, reason: 'classified_geometry' };
}
