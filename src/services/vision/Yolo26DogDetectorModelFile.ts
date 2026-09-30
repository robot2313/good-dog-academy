import { File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';

export const YOLO26_DETECTOR_RELEASE = 'v8.4.0';
export const YOLO26_DETECTOR_FILENAME = 'yolo26n-640.onnx';
export const YOLO26_DETECTOR_EXPECTED_MIN_BYTES = 9_000_000;
export const YOLO26_DETECTOR_EXPECTED_MAX_BYTES = 12_000_000;
export const YOLO26_DETECTOR_URL =
  'https://github.com/ultralytics/assets/releases/download/v8.4.0/yolo26n.onnx';

/**
 * The model is pinned to an upstream release URL and checked for a plausible
 * artifact size before being cached. A cryptographic digest is deliberately
 * not invented here; add the official release digest when one is published
 * for this exact ONNX artifact.
 *
 * Commercial/proprietary distribution requires licensing review against the
 * applicable Ultralytics model terms before release.
 */
export async function ensureYolo26DogDetectorFile(): Promise<File> {
  const model = new File(Paths.cache, YOLO26_DETECTOR_FILENAME);
  if (
    model.exists &&
    model.size >= YOLO26_DETECTOR_EXPECTED_MIN_BYTES &&
    model.size <= YOLO26_DETECTOR_EXPECTED_MAX_BYTES
  ) {
    return model;
  }

  if (model.exists) {
    try { model.delete(); } catch { /* recreate below */ }
  }

  const response = await fetch(YOLO26_DETECTOR_URL);
  if (!response.ok) {
    throw new Error('YOLO26 detector download failed with HTTP ' + response.status + '.');
  }

  const bytes = await response.bytes();
  if (
    bytes.length < YOLO26_DETECTOR_EXPECTED_MIN_BYTES ||
    bytes.length > YOLO26_DETECTOR_EXPECTED_MAX_BYTES
  ) {
    throw new Error(
      'YOLO26 detector size validation failed: received ' + bytes.length + ' bytes.',
    );
  }

  model.write(bytes);
  if (!model.exists || model.size !== bytes.length) {
    throw new Error('YOLO26 detector was downloaded but could not be verified in cache.');
  }

  return model;
}
