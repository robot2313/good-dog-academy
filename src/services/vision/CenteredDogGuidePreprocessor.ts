import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';

import {
  QUADRUPED_INPUT_SIZE,
  rgbBytesToQuadrupedTensor,
} from '../../domain/vision/QuadrupedInputTensor';
import type { CameraFrame } from '../camera/CameraFrameSource';

export type NormalizedCropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PreparedQuadrupedInput = {
  data: Float32Array;
  dimensions: readonly [1, 3, 256, 256];
  crop: NormalizedCropRect;
};

export interface QuadrupedFramePreprocessor {
  prepare(frame: CameraFrame): Promise<PreparedQuadrupedInput>;
}

function centeredSquareCrop(width: number, height: number): {
  originX: number;
  originY: number;
  width: number;
  height: number;
} {
  const side = Math.min(width, height);
  return {
    originX: Math.max(0, Math.floor((width - side) / 2)),
    originY: Math.max(0, Math.floor((height - side) / 2)),
    width: side,
    height: side,
  };
}

export class CenteredDogGuidePreprocessor implements QuadrupedFramePreprocessor {
  async prepare(frame: CameraFrame): Promise<PreparedQuadrupedInput> {
    if (!frame.uri) throw new Error('Camera frame has no local image URI.');
    if (frame.width <= 0 || frame.height <= 0) throw new Error('Camera frame dimensions are invalid.');

    const crop = centeredSquareCrop(frame.width, frame.height);
    const result = await ImageManipulator.manipulateAsync(
      frame.uri,
      [
        { crop },
        { resize: { width: QUADRUPED_INPUT_SIZE, height: QUADRUPED_INPUT_SIZE } },
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );

    const outputFile = new File(result.uri);
    try {
      const bytes = await outputFile.bytes();
      const decoded = jpeg.decode(bytes, {
        useTArray: true,
        formatAsRGBA: true,
        tolerantDecoding: true,
        maxResolutionInMP: 1,
        maxMemoryUsageInMB: 32,
      });

      if (decoded.width !== QUADRUPED_INPUT_SIZE || decoded.height !== QUADRUPED_INPUT_SIZE) {
        throw new Error(`Preprocessed image was ${decoded.width}x${decoded.height}, expected 256x256.`);
      }

      return {
        data: rgbBytesToQuadrupedTensor(
          decoded.data as Uint8Array,
          decoded.width,
          decoded.height,
          4,
        ),
        dimensions: [1, 3, 256, 256],
        crop: {
          left: crop.originX / frame.width,
          top: crop.originY / frame.height,
          width: crop.width / frame.width,
          height: crop.height / frame.height,
        },
      };
    } finally {
      try {
        await Promise.resolve(outputFile.delete());
      } catch {
        // Cache cleanup failure must not turn otherwise valid pose evidence into an app error.
      }
    }
  }
}
