import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/yolo_dog_detection_decoder.dart';

void main() {
  test('decodes post-NMS [1,300,6] dog detections', () {
    final data = Float32List(300 * 6);
    data[0] = 64;
    data[1] = 128;
    data[2] = 320;
    data[3] = 512;
    data[4] = 0.9;
    data[5] = yoloDogClassId.toDouble();

    data[6] = 0;
    data[7] = 0;
    data[8] = 640;
    data[9] = 640;
    data[10] = 0.99;
    data[11] = 0;

    final detections = decodeYoloDogDetections(
      data,
      const <int>[1, 300, 6],
    );

    expect(detections, hasLength(1));
    expect(detections.single.confidence, closeTo(0.9, 0.0001));
    expect(detections.single.box.left, closeTo(0.1, 0.0001));
    expect(detections.single.box.top, closeTo(0.2, 0.0001));
    expect(detections.single.box.width, closeTo(0.4, 0.0001));
    expect(detections.single.box.height, closeTo(0.6, 0.0001));
  });

  test('raw [1,84,N] predictions apply dog score and NMS', () {
    const predictions = 3;
    final data = Float32List(84 * predictions);

    void setPrediction(
      int index, {
      required double centerX,
      required double centerY,
      required double width,
      required double height,
      required double confidence,
    }) {
      data[index] = centerX;
      data[predictions + index] = centerY;
      data[predictions * 2 + index] = width;
      data[predictions * 3 + index] = height;
      data[predictions * (4 + yoloDogClassId) + index] = confidence;
    }

    setPrediction(
      0,
      centerX: 320,
      centerY: 320,
      width: 256,
      height: 256,
      confidence: 0.92,
    );
    setPrediction(
      1,
      centerX: 326,
      centerY: 324,
      width: 250,
      height: 250,
      confidence: 0.81,
    );
    setPrediction(
      2,
      centerX: 100,
      centerY: 100,
      width: 80,
      height: 80,
      confidence: 0.70,
    );

    final detections = decodeYoloDogDetections(
      data,
      const <int>[1, 84, predictions],
    );

    expect(detections, hasLength(2));
    expect(detections.first.confidence, closeTo(0.92, 0.0001));
    expect(detections.last.confidence, closeTo(0.70, 0.0001));
  });

  test('tiny boxes are rejected instead of becoming tracker evidence', () {
    final data = Float32List(300 * 6);
    data[0] = 100;
    data[1] = 100;
    data[2] = 102;
    data[3] = 102;
    data[4] = 0.95;
    data[5] = yoloDogClassId.toDouble();

    expect(
      decodeYoloDogDetections(data, const <int>[1, 300, 6]),
      isEmpty,
    );
  });

  test('low-confidence dog predictions are ignored', () {
    final data = Float32List(300 * 6);
    data[0] = 64;
    data[1] = 64;
    data[2] = 300;
    data[3] = 300;
    data[4] = yoloMinimumDogConfidence - 0.01;
    data[5] = yoloDogClassId.toDouble();

    expect(
      decodeYoloDogDetections(data, const <int>[1, 300, 6]),
      isEmpty,
    );
  });

  test('unsupported shapes fail closed', () {
    expect(
      () => decodeYoloDogDetections(
        Float32List(10),
        const <int>[1, 10, 1],
      ),
      throwsArgumentError,
    );
  });

  test('shape-compatible output with corrupt value count fails closed', () {
    expect(
      () => decodeYoloDogDetections(
        Float32List(12),
        const <int>[1, 300, 6],
      ),
      throwsArgumentError,
    );
  });
}
