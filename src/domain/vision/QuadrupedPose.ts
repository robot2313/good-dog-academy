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

  const requiredJointConfidences = {
    shoulder: shoulder.confidence,
    hip: hip.confidence,
    frontPaw: frontPaw.confidence,
    backPaw: backPaw.confidence,
    neck: neck.confidence,
    tailRoot: tailRoot.confidence,
  };

  const weakestRequiredJoint = Object.entries(requiredJointConfidences)
    .sort((a, b) => a[1] - b[1])[0];

  const requiredConfidence = weakestRequiredJoint?.[1] ?? 0;
  const weakestName = weakestRequiredJoint?.[0] ?? 'unknown';

  const pawFloor = average([frontPaw.y, backPaw.y]);
  const bodyTop = Math.min(shoulder.y, hip.y, neck.y, tailRoot.y);
  const bodyHeight = pawFloor - bodyTop;

  const safeBodyHeight = Math.max(bodyHeight, 0.000001);

  const shoulderClearance = clamp01(
    (frontPaw.y - shoulder.y) / safeBodyHeight,
  );

  const hipClearance = clamp01(
    (backPaw.y - hip.y) / safeBodyHeight,
  );

  const torsoLevel = clamp01(
    1 - Math.abs(shoulder.y - hip.y) / safeBodyHeight,
  );

  const neckHipLevel = clamp01(
    1 - Math.abs(neck.y - hip.y) / safeBodyHeight,
  );

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

  const downCompression = clamp01(
    1 - average([shoulderClearance, hipClearance]),
  );

  const downScore = clamp01(
    0.46 * downCompression +
    0.30 * torsoLevel +
    0.24 * neckHipLevel,
  );

  const jointDebug =
    `weak=${weakestName}:${requiredConfidence.toFixed(2)} | ` +
    `shoulder=${shoulder.confidence.toFixed(2)} ` +
    `hip=${hip.confidence.toFixed(2)} ` +
    `frontPaw=${frontPaw.confidence.toFixed(2)} ` +
    `backPaw=${backPaw.confidence.toFixed(2)} ` +
    `neck=${neck.confidence.toFixed(2)} ` +
    `tailRoot=${tailRoot.confidence.toFixed(2)}`;

  // Candidate V2 posture geometry.
  // This deliberately relies mainly on leg/body clearance:
  // standing = both ends elevated
  // sitting = front elevated, rear compressed
  // down = both ends compressed
  const v2StandScore = clamp01(
    0.50 * shoulderClearance +
    0.50 * hipClearance
  );

  const v2SitScore = clamp01(
    0.55 * shoulderClearance +
    0.45 * (1 - hipClearance)
  );

  const v2DownScore = clamp01(
    1 - (0.50 * shoulderClearance + 0.50 * hipClearance)
  );

  // V3: use one coherent visible side instead of averaging
  // left/right joints. The far side of a dog is often occluded.
  const leftSideConfidence = average([
    point(pose, 'left_shoulder').confidence,
    point(pose, 'left_elbow').confidence,
    point(pose, 'left_front_paw').confidence,
    point(pose, 'left_hip').confidence,
    point(pose, 'left_knee').confidence,
    point(pose, 'left_back_paw').confidence,
  ]);

  const rightSideConfidence = average([
    point(pose, 'right_shoulder').confidence,
    point(pose, 'right_elbow').confidence,
    point(pose, 'right_front_paw').confidence,
    point(pose, 'right_hip').confidence,
    point(pose, 'right_knee').confidence,
    point(pose, 'right_back_paw').confidence,
  ]);

  const useLeftSide = leftSideConfidence >= rightSideConfidence;

  const sideShoulder = point(
    pose,
    useLeftSide ? 'left_shoulder' : 'right_shoulder',
  );
  const sideFrontPaw = point(
    pose,
    useLeftSide ? 'left_front_paw' : 'right_front_paw',
  );
  const sideHip = point(
    pose,
    useLeftSide ? 'left_hip' : 'right_hip',
  );
  const sideBackPaw = point(
    pose,
    useLeftSide ? 'left_back_paw' : 'right_back_paw',
  );

  const torsoDx = sideHip.x - sideShoulder.x;
  const torsoDy = sideHip.y - sideShoulder.y;
  const torsoLength = Math.max(
    0.05,
    Math.sqrt(torsoDx * torsoDx + torsoDy * torsoDy),
  );

  const v3FrontDrop = clamp01(
    (sideFrontPaw.y - sideShoulder.y) / torsoLength,
  );

  const v3RearDrop = clamp01(
    (sideBackPaw.y - sideHip.y) / torsoLength,
  );

  const v3StandScore = clamp01(
    0.5 * v3FrontDrop +
    0.5 * v3RearDrop
  );

  const v3SitScore = clamp01(
    0.60 * v3FrontDrop +
    0.40 * (1 - v3RearDrop)
  );

  const v3DownScore = clamp01(
    1 - (
      0.5 * v3FrontDrop +
      0.5 * v3RearDrop
    )
  );

  // V4 chooses the best visible pair separately for the
  // front leg, rear leg and torso. It also measures how far
  // the hips have dropped below the shoulders, which is a
  // strong sitting cue.

  const leftFrontConfidence = Math.min(
    point(pose, 'left_shoulder').confidence,
    point(pose, 'left_front_paw').confidence,
  );

  const rightFrontConfidence = Math.min(
    point(pose, 'right_shoulder').confidence,
    point(pose, 'right_front_paw').confidence,
  );

  const useLeftFront = leftFrontConfidence >= rightFrontConfidence;

  const v4Shoulder = point(
    pose,
    useLeftFront ? 'left_shoulder' : 'right_shoulder',
  );

  const v4FrontPaw = point(
    pose,
    useLeftFront ? 'left_front_paw' : 'right_front_paw',
  );

  const leftRearConfidence = Math.min(
    point(pose, 'left_hip').confidence,
    point(pose, 'left_back_paw').confidence,
  );

  const rightRearConfidence = Math.min(
    point(pose, 'right_hip').confidence,
    point(pose, 'right_back_paw').confidence,
  );

  const useLeftRear = leftRearConfidence >= rightRearConfidence;

  const v4Hip = point(
    pose,
    useLeftRear ? 'left_hip' : 'right_hip',
  );

  const v4BackPaw = point(
    pose,
    useLeftRear ? 'left_back_paw' : 'right_back_paw',
  );

  const leftTorsoConfidence = Math.min(
    point(pose, 'left_shoulder').confidence,
    point(pose, 'left_hip').confidence,
  );

  const rightTorsoConfidence = Math.min(
    point(pose, 'right_shoulder').confidence,
    point(pose, 'right_hip').confidence,
  );

  const useLeftTorso = leftTorsoConfidence >= rightTorsoConfidence;

  const torsoShoulder = point(
    pose,
    useLeftTorso ? 'left_shoulder' : 'right_shoulder',
  );

  const torsoHip = point(
    pose,
    useLeftTorso ? 'left_hip' : 'right_hip',
  );

  const torsoDxV4 = torsoHip.x - torsoShoulder.x;
  const torsoDyV4 = torsoHip.y - torsoShoulder.y;

  const torsoLengthV4 = Math.max(
    0.05,
    Math.sqrt(
      torsoDxV4 * torsoDxV4 +
      torsoDyV4 * torsoDyV4,
    ),
  );

  const v4FrontDrop = clamp01(
    (v4FrontPaw.y - v4Shoulder.y) / torsoLengthV4,
  );

  const v4RearDrop = clamp01(
    (v4BackPaw.y - v4Hip.y) / torsoLengthV4,
  );

  const v4HipDrop = clamp01(
    (torsoHip.y - torsoShoulder.y) / torsoLengthV4,
  );

  const v4Posture =
    v4HipDrop >= 0.20
      ? 'SIT'
      : v4FrontDrop <= 0.45 && v4RearDrop <= 0.45
        ? 'DOWN'
        : v4FrontDrop >= 0.45 && v4RearDrop >= 0.45
          ? 'STAND'
          : 'UNKNOWN';


  // V5 diagnostics --------------------------------------------------
  // Uses visible-side limb geometry in addition to body height.
  // This is diagnostic only and does NOT control lesson scoring.

  const v5LeftScore = average([
    point(pose, 'left_shoulder').confidence,
    point(pose, 'left_elbow').confidence,
    point(pose, 'left_front_paw').confidence,
    point(pose, 'left_hip').confidence,
    point(pose, 'left_knee').confidence,
    point(pose, 'left_back_paw').confidence,
  ]);

  const v5RightScore = average([
    point(pose, 'right_shoulder').confidence,
    point(pose, 'right_elbow').confidence,
    point(pose, 'right_front_paw').confidence,
    point(pose, 'right_hip').confidence,
    point(pose, 'right_knee').confidence,
    point(pose, 'right_back_paw').confidence,
  ]);

  const v5Left = v5LeftScore >= v5RightScore;

  const v5Shoulder = point(
    pose,
    v5Left ? 'left_shoulder' : 'right_shoulder',
  );
  const v5Elbow = point(
    pose,
    v5Left ? 'left_elbow' : 'right_elbow',
  );
  const v5FrontPaw = point(
    pose,
    v5Left ? 'left_front_paw' : 'right_front_paw',
  );
  const v5Hip = point(
    pose,
    v5Left ? 'left_hip' : 'right_hip',
  );
  const v5Knee = point(
    pose,
    v5Left ? 'left_knee' : 'right_knee',
  );
  const v5BackPaw = point(
    pose,
    v5Left ? 'left_back_paw' : 'right_back_paw',
  );

  const dist = (
    a: PoseKeypoint,
    b: PoseKeypoint,
  ): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const angle = (
    a: PoseKeypoint,
    b: PoseKeypoint,
    c: PoseKeypoint,
  ): number => {
    const abx = a.x - b.x;
    const aby = a.y - b.y;
    const cbx = c.x - b.x;
    const cby = c.y - b.y;

    const dot = abx * cbx + aby * cby;
    const mag1 = Math.sqrt(abx * abx + aby * aby);
    const mag2 = Math.sqrt(cbx * cbx + cby * cby);

    if (mag1 < 0.0001 || mag2 < 0.0001) return 0;

    const cosine = Math.max(
      -1,
      Math.min(1, dot / (mag1 * mag2)),
    );

    return Math.acos(cosine) * 180 / Math.PI;
  };

  const v5TorsoLength = Math.max(
    0.05,
    dist(v5Shoulder, v5Hip),
  );

  const v5FrontAngle = angle(
    v5Shoulder,
    v5Elbow,
    v5FrontPaw,
  );

  const v5RearAngle = angle(
    v5Hip,
    v5Knee,
    v5BackPaw,
  );

  const v5ShoulderClearance =
    (v5FrontPaw.y - v5Shoulder.y) / v5TorsoLength;

  const v5HipClearance =
    (v5BackPaw.y - v5Hip.y) / v5TorsoLength;

  const v5HipDrop =
    (v5Hip.y - v5Shoulder.y) / v5TorsoLength;

  // Viewpoint safety gate.
  // A very small horizontal shoulder-to-hip separation often means
  // the dog is too front-on for reliable 2D posture classification.
  const v5SideSpan =
    Math.abs(v5Hip.x - v5Shoulder.x) / v5TorsoLength;

  let v5Posture = 'UNKNOWN';

  if (v5SideSpan < 0.35) {
    v5Posture = 'UNKNOWN_VIEW';
  } else {
    const rearFolded =
      v5RearAngle < 120 || v5HipClearance < 0.45;

    const frontExtended =
      v5FrontAngle > 120 &&
      v5ShoulderClearance > 0.45;

    const rearExtended =
      v5RearAngle > 120 &&
      v5HipClearance > 0.45;

    const bodyLow =
      v5ShoulderClearance < 0.48 &&
      v5HipClearance < 0.48;

    if (
      v5HipDrop > 0.18 &&
      rearFolded &&
      frontExtended
    ) {
      v5Posture = 'SIT';
    } else if (bodyLow) {
      v5Posture = 'DOWN';
    } else if (
      frontExtended &&
      rearExtended
    ) {
      v5Posture = 'STAND';
    }
  }

  const v5Debug =
    `V5 ${v5Left ? 'L' : 'R'} ` +
    `frontAng=${v5FrontAngle.toFixed(0)} ` +
    `rearAng=${v5RearAngle.toFixed(0)} ` +
    `frontClr=${v5ShoulderClearance.toFixed(2)} ` +
    `rearClr=${v5HipClearance.toFixed(2)} ` +
    `hipDrop=${v5HipDrop.toFixed(2)} ` +
    `side=${v5SideSpan.toFixed(2)} ` +
    `=>${v5Posture}`;
  





  // V6 -------------------------------------------------------------
  // Breed-tolerant posture diagnostics.
  //
  // Instead of assuming "low body = down", V6 looks at whether
  // the limbs point vertically toward the floor or sideways.



  const v6FrontDirect = Math.max(
    0.0001,
    dist(v5Shoulder, v5FrontPaw),
  );

  const v6RearDirect = Math.max(
    0.0001,
    dist(v5Hip, v5BackPaw),
  );

  const v6FrontVertical = clamp01(
    Math.abs(v5FrontPaw.y - v5Shoulder.y) / v6FrontDirect,
  );

  const v6RearVertical = clamp01(
    Math.abs(v5BackPaw.y - v5Hip.y) / v6RearDirect,
  );

  const v6FrontChain =
    dist(v5Shoulder, v5Elbow) +
    dist(v5Elbow, v5FrontPaw);

  const v6RearChain =
    dist(v5Hip, v5Knee) +
    dist(v5Knee, v5BackPaw);

  const v6FrontExtension = clamp01(
    v6FrontDirect / Math.max(0.0001, v6FrontChain),
  );

  const v6RearExtension = clamp01(
    v6RearDirect / Math.max(0.0001, v6RearChain),
  );

  let v6Posture = 'UNKNOWN';

  // Sitting:
  // front leg remains mainly vertical while rear limb/body compresses.
  if (
    v6FrontVertical >= 0.72 &&
    v5HipDrop >= 0.18 &&
    (
      v6RearVertical < 0.72 ||
      v6RearExtension < 0.82
    )
  ) {
    v6Posture = 'SIT';
  }

  // Standing:
  // both visible limbs point predominantly downward.
  else if (
    v6FrontVertical >= 0.68 &&
    v6RearVertical >= 0.62
  ) {
    v6Posture = 'STAND';
  }

  // Down:
  // at least the front body/limb geometry is strongly non-vertical,
  // usually because the legs are reaching forward/sideways.
  else if (
    v6FrontVertical <= 0.62 &&
    v6RearVertical <= 0.68
  ) {
    v6Posture = 'DOWN';
  }

  const v6Debug =
    `V6 ` +
    `frontVert=${v6FrontVertical.toFixed(2)} ` +
    `rearVert=${v6RearVertical.toFixed(2)} ` +
    `frontExt=${v6FrontExtension.toFixed(2)} ` +
    `rearExt=${v6RearExtension.toFixed(2)} ` +
    `=>${v6Posture}`;

  const scoreDebug =
    `OLD stand=${standScore.toFixed(2)} ` +
    `sit=${sitScore.toFixed(2)} ` +
    `down=${downScore.toFixed(2)} | ` +
    `V2 stand=${v2StandScore.toFixed(2)} ` +
    `sit=${v2SitScore.toFixed(2)} ` +
    `down=${v2DownScore.toFixed(2)} | ` +
    `V3 ${useLeftSide ? 'L' : 'R'} ` +
    `front=${v3FrontDrop.toFixed(2)} ` +
    `rear=${v3RearDrop.toFixed(2)} ` +
    `stand=${v3StandScore.toFixed(2)} ` +
    `sit=${v3SitScore.toFixed(2)} ` +
    `down=${v3DownScore.toFixed(2)} | ` +
    `V4 hipDrop=${v4HipDrop.toFixed(2)} ` +
    `front=${v4FrontDrop.toFixed(2)} ` +
    `rear=${v4RearDrop.toFixed(2)} ` +
    `=>${v4Posture} | ` +
    v5Debug + ' | ' + v6Debug;

  if (requiredConfidence < policy.minJointConfidence) {
    return {
      posture: 'unknown',
      confidence: null,
      reason: `${jointDebug} | ${scoreDebug}`,
    };
  }

  if (bodyHeight < policy.minBodyHeight) {
    return {
      posture: 'unknown',
      confidence: null,
      reason: `body_scale=${bodyHeight.toFixed(3)} | ${scoreDebug}`,
    };
  }

  const candidates: Array<{ posture: DogPostureEvidence; score: number }> = [
    { posture: 'stand_like', score: standScore },
    { posture: 'sit_like', score: sitScore },
    { posture: 'down_like', score: downScore },
  ];

  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const second = candidates[1];

  if (!best || !second) {
    return {
      posture: 'unknown',
      confidence: null,
      reason: `no_candidate | ${scoreDebug}`,
    };
  }

  const margin = best.score - second.score;
  const confidence =
    clamp01(best.score * 0.82 + margin * 0.18) * requiredConfidence;

  if (
    confidence < policy.minClassificationConfidence ||
    margin < 0.08
  ) {
    return {
      posture: 'unknown',
      confidence,
      reason: `ambiguous_geometry | ${scoreDebug}`,
    };
  }

  return {
    posture: best.posture,
    confidence,
    reason: `classified_geometry | ${scoreDebug}`,
  };
}

