import 'dart:typed_data';

import '../../domain/dog_tracking.dart';

const yoloDetectorInputSize = 640;
const yoloDogClassId = 16;
const yoloMinimumDogConfidence = 0.25;
const yoloMaximumDogDetections = 8;
const yoloNmsIouThreshold = 0.55;

List<DogDetection> decodeYoloDogDetections(
  Float32List data,
  List<int> dimensions,
) {
  if (dimensions.length == 3 &&
      dimensions[0] == 1 &&
      dimensions[1] == 300 &&
      dimensions[2] == 6) {
    const expected = 300 * 6;
    if (data.length != expected) {
      throw ArgumentError(
        'Expected $expected YOLO detection values, '
        'received ${data.length}.',
      );
    }

    final detections = <DogDetection>[];
    for (var index = 0; index < 300; index++) {
      final offset = index * 6;
      final confidence = data[offset + 4];
      final classId = data[offset + 5].round();
      if (classId != yoloDogClassId ||
          confidence < yoloMinimumDogConfidence) {
        continue;
      }

      final box = _normalizedBox(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3],
      );
      if (box == null) continue;

      detections.add(
        DogDetection(
          box: box,
          confidence: confidence.clamp(0.0, 1.0),
          source: DogDetectionSource.dedicatedDetector,
        ),
      );
    }

    detections.sort((a, b) => b.confidence.compareTo(a.confidence));
    return List<DogDetection>.unmodifiable(
      detections.take(yoloMaximumDogDetections),
    );
  }

  if (dimensions.length == 3 &&
      dimensions[0] == 1 &&
      dimensions[1] == 84) {
    final predictions = dimensions[2];
    if (predictions <= 0) {
      throw ArgumentError('YOLO prediction count must be positive.');
    }
    final expected = 84 * predictions;
    if (data.length != expected) {
      throw ArgumentError(
        'Expected $expected YOLO prediction values, '
        'received ${data.length}.',
      );
    }

    final detections = <DogDetection>[];
    for (var index = 0; index < predictions; index++) {
      final centerX = data[index];
      final centerY = data[predictions + index];
      final width = data[predictions * 2 + index];
      final height = data[predictions * 3 + index];
      final confidence =
          data[predictions * (4 + yoloDogClassId) + index];

      if (confidence < yoloMinimumDogConfidence) continue;

      final box = _normalizedBox(
        centerX - width / 2,
        centerY - height / 2,
        centerX + width / 2,
        centerY + height / 2,
      );
      if (box == null) continue;

      detections.add(
        DogDetection(
          box: box,
          confidence: confidence.clamp(0.0, 1.0),
          source: DogDetectionSource.dedicatedDetector,
        ),
      );
    }
    return _nonMaxSuppression(detections);
  }

  throw ArgumentError(
    'Unsupported YOLO detection output shape: '
    '[${dimensions.join(', ')}].',
  );
}

List<DogDetection> _nonMaxSuppression(List<DogDetection> detections) {
  final sorted = [...detections]
    ..sort((a, b) => b.confidence.compareTo(a.confidence));
  final kept = <DogDetection>[];

  for (final candidate in sorted) {
    final overlaps = kept.any(
      (existing) => _intersectionOverUnion(existing.box, candidate.box) >
          yoloNmsIouThreshold,
    );
    if (overlaps) continue;
    kept.add(candidate);
    if (kept.length >= yoloMaximumDogDetections) break;
  }

  return List<DogDetection>.unmodifiable(kept);
}

double _intersectionOverUnion(
  NormalizedDogBox a,
  NormalizedDogBox b,
) {
  final left = a.left > b.left ? a.left : b.left;
  final top = a.top > b.top ? a.top : b.top;
  final aRight = a.left + a.width;
  final bRight = b.left + b.width;
  final right = aRight < bRight ? aRight : bRight;
  final aBottom = a.top + a.height;
  final bBottom = b.top + b.height;
  final bottom = aBottom < bBottom ? aBottom : bBottom;

  final intersectionWidth = (right - left).clamp(0.0, 1.0);
  final intersectionHeight = (bottom - top).clamp(0.0, 1.0);
  final intersection = intersectionWidth * intersectionHeight;
  final union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

NormalizedDogBox? _normalizedBox(
  double x1,
  double y1,
  double x2,
  double y2,
) {
  final leftPx = x1 < x2 ? x1 : x2;
  final topPx = y1 < y2 ? y1 : y2;
  final rightPx = x1 > x2 ? x1 : x2;
  final bottomPx = y1 > y2 ? y1 : y2;

  final left = (leftPx / yoloDetectorInputSize).clamp(0.0, 1.0);
  final top = (topPx / yoloDetectorInputSize).clamp(0.0, 1.0);
  final right = (rightPx / yoloDetectorInputSize).clamp(0.0, 1.0);
  final bottom = (bottomPx / yoloDetectorInputSize).clamp(0.0, 1.0);
  final width = right - left;
  final height = bottom - top;

  if (width < 0.01 || height < 0.01) return null;
  return NormalizedDogBox(
    left: left,
    top: top,
    width: width,
    height: height,
  );
}
