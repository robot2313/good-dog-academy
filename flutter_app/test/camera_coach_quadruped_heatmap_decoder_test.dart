import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_heatmap_decoder.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';

Float32List _heatmaps() {
  final channelSize = quadrupedHeatmapSize * quadrupedHeatmapSize;
  final data = Float32List(quadrupedKeypointCount * channelSize);
  for (var channel = 0; channel < quadrupedKeypointCount; channel++) {
    final x = 8 + (channel % 8) * 5;
    final y = 10 + (channel ~/ 8) * 14;
    data[channel * channelSize + y * quadrupedHeatmapSize + x] = 0.9;
  }
  return data;
}

void main() {
  test('decodes all 17 heatmap channels into normalized keypoints', () {
    final result = decodeQuadrupedHeatmaps(_heatmaps());

    expect(result.keypoints, hasLength(17));
    final leftEye = result.point(QuadrupedJoint.leftEye);
    expect(leftEye.x, closeTo(8 / 64, 0.01));
    expect(leftEye.y, closeTo(10 / 64, 0.01));
    expect(leftEye.confidence, closeTo(0.9, 0.01));
    expect(
      result.point(QuadrupedJoint.rightBackPaw).confidence,
      greaterThan(0.85),
    );
  });

  test('accepts both supported ONNX heatmap shapes', () {
    expect(
      isExpectedQuadrupedHeatmapShape(const <int>[1, 17, 64, 64]),
      isTrue,
    );
    expect(
      isExpectedQuadrupedHeatmapShape(const <int>[17, 64, 64]),
      isTrue,
    );
  });

  test('rejects unexpected output shapes', () {
    expect(
      isExpectedQuadrupedHeatmapShape(const <int>[1, 17, 32, 32]),
      isFalse,
    );
    expect(
      isExpectedQuadrupedHeatmapShape(const <int>[1, 18, 64, 64]),
      isFalse,
    );
    expect(
      isExpectedQuadrupedHeatmapShape(const <int>[17, 64]),
      isFalse,
    );
  });

  test('rejects corrupt heatmap value counts instead of decoding evidence', () {
    expect(
      () => decodeQuadrupedHeatmaps(Float32List(42)),
      throwsArgumentError,
    );
  });
}
