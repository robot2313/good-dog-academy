import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import { decodeQuadrupedHeatmaps } from '../../domain/vision/QuadrupedHeatmapDecoder';
import { QUADRUPED_JOINTS, type QuadrupedJointName, type QuadrupedPose } from '../../domain/vision/QuadrupedPose';
import type { CameraFrame } from '../camera/CameraFrameSource';
import {
  CenteredDogGuidePreprocessor,
  type NormalizedCropRect,
  type QuadrupedFramePreprocessor,
} from './CenteredDogGuidePreprocessor';
import { ensureQuadrupedPoseModelFile } from './QuadrupedPoseModelFile';
import type { QuadrupedPoseInference, QuadrupedPoseModel } from './QuadrupedPoseModel';

const TRACKED_JOINT_THRESHOLD = 0.3;
const CORE_JOINTS: QuadrupedJointName[] = [
  'nose',
  'neck',
  'left_shoulder',
  'right_shoulder',
  'left_hip',
  'right_hip',
  'tail_root',
];

function mapPoseFromCrop(pose: QuadrupedPose, crop: NormalizedCropRect): QuadrupedPose {
  const entries = QUADRUPED_JOINTS.map((name) => {
    const keypoint = pose.keypoints[name];
    return [name, {
      x: crop.left + keypoint.x * crop.width,
      y: crop.top + keypoint.y * crop.height,
      confidence: keypoint.confidence,
    }] as const;
  });
  return { keypoints: Object.fromEntries(entries) as QuadrupedPose['keypoints'] };
}

function poseDetectionSummary(pose: QuadrupedPose): { detected: boolean; confidence: number } {
  const confidences = QUADRUPED_JOINTS.map((name) => pose.keypoints[name].confidence);
  const confidentJoints = confidences.filter((value) => value >= TRACKED_JOINT_THRESHOLD).length;
  const confidentCore = CORE_JOINTS.filter((name) => pose.keypoints[name].confidence >= TRACKED_JOINT_THRESHOLD).length;
  const strongest = [...confidences].sort((a, b) => b - a).slice(0, 6);
  const confidence = strongest.length > 0
    ? strongest.reduce((total, value) => total + value, 0) / strongest.length
    : 0;

  // This is intentionally only a shadow-mode pose-presence heuristic. The
  // published pose model has no animal detector and can hallucinate skeletons
  // on non-animals, so this result must not enable production auto-scoring.
  return {
    detected: confidentJoints >= 6 && confidentCore >= 3,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

function isExpectedHeatmapShape(dims: readonly number[]): boolean {
  return (
    dims.length === 4 && dims[0] === 1 && dims[1] === 17 && dims[2] === 64 && dims[3] === 64
  ) || (
    dims.length === 3 && dims[0] === 17 && dims[1] === 64 && dims[2] === 64
  );
}

export class OnnxQuadrupedPoseModel implements QuadrupedPoseModel {
  private session: InferenceSession | null = null;

  constructor(
    private readonly preprocessor: QuadrupedFramePreprocessor = new CenteredDogGuidePreprocessor(),
  ) {}

  async warmup(): Promise<void> {
    if (this.session) return;
    const model = await ensureQuadrupedPoseModelFile();
    this.session = await InferenceSession.create(model.uri);
    if (this.session.inputNames.length !== 1) {
      await this.dispose();
      throw new Error(`Quadruped pose model expected one input, found ${this.session?.inputNames.length ?? 0}.`);
    }
    if (this.session.outputNames.length < 1) {
      await this.dispose();
      throw new Error('Quadruped pose model exposes no outputs.');
    }
  }

  async infer(frame: CameraFrame): Promise<QuadrupedPoseInference> {
    await this.warmup();
    const session = this.session;
    if (!session) throw new Error('Quadruped pose model session is unavailable.');

    const prepared = await this.preprocessor.prepare(frame);
    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];
    if (!inputName || !outputName) throw new Error('Quadruped pose model input/output metadata is incomplete.');

    const input = new Tensor('float32', prepared.data, [1, 3, 256, 256]);
    const startedAt = Date.now();
    const outputs = await session.run({ [inputName]: input }, [outputName]);
    const inferenceMs = Date.now() - startedAt;
    const output = outputs[outputName];
    if (!(output instanceof Tensor)) throw new Error('Quadruped pose model returned a non-tensor output.');
    if (!isExpectedHeatmapShape(output.dims)) {
      throw new Error(`Unexpected quadruped pose output shape: [${output.dims.join(', ')}].`);
    }
    if (!(output.data instanceof Float32Array)) {
      throw new Error(`Quadruped pose output must be float32, received ${output.type}.`);
    }

    const cropPose = decodeQuadrupedHeatmaps(output.data);
    const pose = mapPoseFromCrop(cropPose, prepared.crop);
    const detection = poseDetectionSummary(pose);

    return {
      dogDetected: detection.detected,
      detectionConfidence: detection.confidence,
      pose,
      inferenceMs,
    };
  }

  async dispose(): Promise<void> {
    const session = this.session;
    this.session = null;
    if (session) await session.release();
  }
}
