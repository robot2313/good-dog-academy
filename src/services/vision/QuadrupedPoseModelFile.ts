import { File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';

export const QUADRUPED_MODEL_UPSTREAM_COMMIT = '52f0329b5c9af513b5a8f2820aaea6bbd945d0c0';
export const QUADRUPED_MODEL_EXPECTED_BYTES = 13_083_695;
export const QUADRUPED_MODEL_FILENAME = `quadpose-${QUADRUPED_MODEL_UPSTREAM_COMMIT.slice(0, 12)}.onnx`;

const MODEL_URL = `https://raw.githubusercontent.com/EstevanSL/snapml-quadruped-pose/${QUADRUPED_MODEL_UPSTREAM_COMMIT}/lens/AnimalPoseTracking/Models/quadpose.onnx`;

export async function ensureQuadrupedPoseModelFile(): Promise<File> {
  const model = new File(Paths.cache, QUADRUPED_MODEL_FILENAME);
  if (model.exists && model.size === QUADRUPED_MODEL_EXPECTED_BYTES) return model;

  if (model.exists) {
    try { model.delete(); } catch { /* overwrite below */ }
  }

  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Quadruped pose model download failed with HTTP ${response.status}.`);
  const bytes = await response.bytes();
  if (bytes.length !== QUADRUPED_MODEL_EXPECTED_BYTES) {
    throw new Error(`Quadruped pose model size mismatch: expected ${QUADRUPED_MODEL_EXPECTED_BYTES}, received ${bytes.length}.`);
  }

  model.write(bytes);
  if (!model.exists || model.size !== QUADRUPED_MODEL_EXPECTED_BYTES) {
    throw new Error('Quadruped pose model was downloaded but could not be verified in writable storage.');
  }
  return model;
}
