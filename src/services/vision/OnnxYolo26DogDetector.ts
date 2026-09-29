import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import * as jpeg from 'jpeg-js';

import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogDetection, NormalizedDogBox } from '../../domain/vision/DogTracking';
import { ensureYolo26DogDetectorFile } from './Yolo26DogDetectorModelFile';
import type { DogDetector, DogDetectorResult } from './DogDetector';

const INPUT_SIZE = 640;
const DOG_CLASS_ID = 16;
const MIN_DOG_CONFIDENCE = 0.25;
const MAX_DETECTIONS = 8;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function iou(a: NormalizedDogBox, b: NormalizedDogBox): number {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function nonMaxSuppression(detections: DogDetection[]): DogDetection[] {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: DogDetection[] = [];

  for (const candidate of sorted) {
    if (kept.some((existing) => iou(existing.box, candidate.box) > 0.55)) continue;
    kept.push(candidate);
    if (kept.length >= MAX_DETECTIONS) break;
  }

  return kept;
}

function toNormalizedBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): NormalizedDogBox | null {
  const left = clamp01(Math.min(x1, x2) / INPUT_SIZE);
  const top = clamp01(Math.min(y1, y2) / INPUT_SIZE);
  const right = clamp01(Math.max(x1, x2) / INPUT_SIZE);
  const bottom = clamp01(Math.max(y1, y2) / INPUT_SIZE);
  const width = right - left;
  const height = bottom - top;

  if (width < 0.01 || height < 0.01) return null;
  return { left, top, width, height };
}

function decodeYolo26Output(
  data: Float32Array,
  dims: readonly number[],
): DogDetection[] {
  // YOLO26 supports both:
  // (1,300,6): xyxy + confidence + class id, and
  // (1,84,8400): xywh + 80 class scores requiring external NMS.
  if (dims.length === 3 && dims[1] === 300 && dims[2] === 6) {
    const detections: DogDetection[] = [];

    for (let i = 0; i < 300; i += 1) {
      const offset = i * 6;
      const confidence = data[offset + 4] ?? 0;
      const classId = Math.round(data[offset + 5] ?? -1);
      if (classId !== DOG_CLASS_ID || confidence < MIN_DOG_CONFIDENCE) continue;

      const box = toNormalizedBox(
        data[offset] ?? 0,
        data[offset + 1] ?? 0,
        data[offset + 2] ?? 0,
        data[offset + 3] ?? 0,
      );

      if (box) {
        detections.push({
          box,
          confidence: clamp01(confidence),
          source: 'dedicated_detector',
        });
      }
    }

    return detections.sort((a, b) => b.confidence - a.confidence).slice(0, MAX_DETECTIONS);
  }

  if (dims.length === 3 && dims[1] === 84) {
    const predictions = dims[2] ?? 0;
    const detections: DogDetection[] = [];

    for (let i = 0; i < predictions; i += 1) {
      const cx = data[i] ?? 0;
      const cy = data[predictions + i] ?? 0;
      const width = data[predictions * 2 + i] ?? 0;
      const height = data[predictions * 3 + i] ?? 0;
      const confidence = data[predictions * (4 + DOG_CLASS_ID) + i] ?? 0;

      if (confidence < MIN_DOG_CONFIDENCE) continue;

      const box = toNormalizedBox(
        cx - width / 2,
        cy - height / 2,
        cx + width / 2,
        cy + height / 2,
      );

      if (box) {
        detections.push({
          box,
          confidence: clamp01(confidence),
          source: 'dedicated_detector',
        });
      }
    }

    return nonMaxSuppression(detections);
  }

  throw new Error(
    'Unsupported YOLO26 detection output shape: [' + dims.join(', ') + '].',
  );
}

async function prepareDetectorTensor(frame: CameraFrame): Promise<{
  tensor: Float32Array;
  file: File;
}> {
  if (!frame.uri) throw new Error('Camera frame has no local image URI.');
  if (frame.width <= 0 || frame.height <= 0) {
    throw new Error('Camera frame dimensions are invalid.');
  }

  // Full-frame resize is intentional: the detector must see dogs at frame
  // edges. Bounding boxes are mapped back to normalized frame coordinates.
  const result = await ImageManipulator.manipulateAsync(
    frame.uri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
  );

  const file = new File(result.uri);

  try {
    const bytes = await file.bytes();
    const decoded = jpeg.decode(bytes, {
      useTArray: true,
      formatAsRGBA: true,
      tolerantDecoding: true,
      maxResolutionInMP: 1,
      maxMemoryUsageInMB: 32,
    });

    if (decoded.width !== INPUT_SIZE || decoded.height !== INPUT_SIZE) {
      throw new Error(
        'YOLO26 input was ' + decoded.width + 'x' + decoded.height + ', expected 640x640.',
      );
    }

    const pixels = decoded.data as Uint8Array;
    const plane = INPUT_SIZE * INPUT_SIZE;
    const tensor = new Float32Array(plane * 3);

    for (let pixel = 0; pixel < plane; pixel += 1) {
      const source = pixel * 4;
      tensor[pixel] = (pixels[source] ?? 0) / 255;
      tensor[plane + pixel] = (pixels[source + 1] ?? 0) / 255;
      tensor[plane * 2 + pixel] = (pixels[source + 2] ?? 0) / 255;
    }

    return { tensor, file };
  } catch (error) {
    try { await Promise.resolve(file.delete()); } catch {}
    throw error;
  }
}

export class OnnxYolo26DogDetector implements DogDetector {
  private session: InferenceSession | null = null;
  private executionProvider: 'xnnpack' | 'cpu' = 'xnnpack';

  async warmup(): Promise<void> {
    if (this.session) return;

    const model = await ensureYolo26DogDetectorFile();

    try {
      this.session = await InferenceSession.create(model.uri, {
        executionProviders: ['xnnpack', 'cpu'],
        graphOptimizationLevel: 'all',
        intraOpNumThreads: 1,
        interOpNumThreads: 1,
      });
      this.executionProvider = 'xnnpack';
    } catch {
      this.session = await InferenceSession.create(model.uri, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all',
      });
      this.executionProvider = 'cpu';
    }

    if (this.session.inputNames.length !== 1 || this.session.outputNames.length < 1) {
      await this.dispose();
      throw new Error('YOLO26 detector model input/output metadata is invalid.');
    }
  }

  async detect(frame: CameraFrame): Promise<DogDetectorResult> {
    await this.warmup();

    const session = this.session;
    if (!session) throw new Error('YOLO26 detector session is unavailable.');

    const prepared = await prepareDetectorTensor(frame);

    try {
      const inputName = session.inputNames[0];
      const outputName = session.outputNames[0];
      if (!inputName || !outputName) {
        throw new Error('YOLO26 detector input/output names are unavailable.');
      }

      const input = new Tensor(
        'float32',
        prepared.tensor,
        [1, 3, INPUT_SIZE, INPUT_SIZE],
      );

      const startedAt = Date.now();
      const outputs = await session.run({ [inputName]: input }, [outputName]);
      const inferenceMs = Date.now() - startedAt;
      const output = outputs[outputName];

      if (!(output instanceof Tensor) || !(output.data instanceof Float32Array)) {
        throw new Error('YOLO26 detector returned an unsupported tensor.');
      }

      return {
        detections: decodeYolo26Output(output.data, output.dims),
        inferenceMs,
        model: 'YOLO26n-COCO-640/' + this.executionProvider,
      };
    } finally {
      try { await Promise.resolve(prepared.file.delete()); } catch {}
    }
  }

  async dispose(): Promise<void> {
    const session = this.session;
    this.session = null;
    if (session) await session.release();
  }
}
