import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_input_tensor.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/yolo_detector_input_tensor.dart';

void main() {
  test('detector input is channel-first RGB normalized to zero through one', () {
    final plane = yoloDetectorTensorSize * yoloDetectorTensorSize;
    final pixels = Uint8List(plane * 4);
    for (var index = 0; index < plane; index++) {
      final source = index * 4;
      pixels[source] = 255;
      pixels[source + 1] = 128;
      pixels[source + 2] = 0;
      pixels[source + 3] = 255;
    }

    final tensor = rgbBytesToYoloDetectorTensor(
      pixels,
      width: yoloDetectorTensorSize,
      height: yoloDetectorTensorSize,
      channels: 4,
    );

    expect(tensor, hasLength(3 * plane));
    expect(tensor[0], 1);
    expect(tensor[plane], closeTo(128 / 255, 0.00001));
    expect(tensor[plane * 2], 0);
  });

  test('detector and pose tensor contracts stay deliberately different', () {
    final detectorPlane = yoloDetectorTensorSize * yoloDetectorTensorSize;
    final detectorPixels = Uint8List(detectorPlane * 3);
    detectorPixels[0] = 124;
    detectorPixels[1] = 116;
    detectorPixels[2] = 104;
    final detector = rgbBytesToYoloDetectorTensor(
      detectorPixels,
      width: yoloDetectorTensorSize,
      height: yoloDetectorTensorSize,
      channels: 3,
    );

    final posePlane = quadrupedInputSize * quadrupedInputSize;
    final posePixels = Uint8List(posePlane * 3);
    posePixels[0] = 124;
    posePixels[1] = 116;
    posePixels[2] = 104;
    final pose = rgbBytesToQuadrupedTensor(
      posePixels,
      width: quadrupedInputSize,
      height: quadrupedInputSize,
      channels: 3,
    );

    expect(detector[0], closeTo(124 / 255, 0.00001));
    expect(pose[0], 124);
  });

  test('rejects dimensions other than 640 by 640', () {
    expect(
      () => rgbBytesToYoloDetectorTensor(
        Uint8List(3),
        width: 1,
        height: 1,
        channels: 3,
      ),
      throwsArgumentError,
    );
  });

  test('rejects unsupported channel counts and corrupt byte lengths', () {
    final plane = yoloDetectorTensorSize * yoloDetectorTensorSize;
    expect(
      () => rgbBytesToYoloDetectorTensor(
        Uint8List(plane),
        width: yoloDetectorTensorSize,
        height: yoloDetectorTensorSize,
        channels: 1,
      ),
      throwsArgumentError,
    );
    expect(
      () => rgbBytesToYoloDetectorTensor(
        Uint8List(plane * 3 - 1),
        width: yoloDetectorTensorSize,
        height: yoloDetectorTensorSize,
        channels: 3,
      ),
      throwsArgumentError,
    );
  });
}
