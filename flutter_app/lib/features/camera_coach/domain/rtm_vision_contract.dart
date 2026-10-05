import 'dart:math' as math;
import 'dart:typed_data';

import 'dog_tracking.dart';
import 'quadruped_pose.dart';

/// Contract for the pinned LibreRTMDett export, not generic RTMDet/YOLO.
/// Boxes and sigmoid are IN the graph; NMS is NOT. COCO dog index is 16.
List<DogDetection> decodeRtmDet(
  Float32List tensor,
  List<int> shape, {
  required int imageWidth,
  required int imageHeight,
}) {
  _checkTensor(tensor, shape, const [1, 8400, 84]);
  _checkImage(imageWidth, imageHeight);
  final ratio = math.min(640 / imageWidth, 640 / imageHeight);
  final candidates = <DogDetection>[];
  for (var row = 0; row < 8400; row++) {
    final offset = row * 84;
    for (var cls = 4; cls < 84; cls++) {
      final score = tensor[offset + cls];
      if (score < 0 || score > 1) {
        throw const FormatException(
          'RTMDet export must contain sigmoid scores',
        );
      }
    }
    final score = tensor[offset + 20];
    if (score <= 0.25) continue;
    final x1 = tensor[offset].clamp(0, 640) / ratio;
    final y1 = tensor[offset + 1].clamp(0, 640) / ratio;
    final x2 = tensor[offset + 2].clamp(0, 640) / ratio;
    final y2 = tensor[offset + 3].clamp(0, 640) / ratio;
    final left = (x1 / imageWidth).clamp(0.0, 1.0);
    final top = (y1 / imageHeight).clamp(0.0, 1.0);
    final right = (x2 / imageWidth).clamp(0.0, 1.0);
    final bottom = (y2 / imageHeight).clamp(0.0, 1.0);
    if (right <= left || bottom <= top) continue;
    candidates.add(
      DogDetection(
        box: NormalizedDogBox(
          left: left,
          top: top,
          width: right - left,
          height: bottom - top,
        ),
        confidence: score,
        source: DogDetectionSource.dedicatedDetector,
      ),
    );
  }
  candidates.sort((a, b) => b.confidence.compareTo(a.confidence));
  final kept = <DogDetection>[];
  for (final candidate in candidates) {
    if (kept.any((other) => _iou(candidate.box, other.box) > 0.65)) continue;
    kept.add(candidate);
    if (kept.length == 100) break;
  }
  return List.unmodifiable(kept);
}

/// Floating square, centered on the tracked ROI, with AP-10K padding 1.25.
/// It may extend beyond the frame: sample zero there, do not shift the crop.
class RtmPoseCrop {
  RtmPoseCrop(int width, int height, NormalizedDogBox box)
    : imageWidth = width,
      imageHeight = height {
    _checkImage(width, height);
    if (![box.left, box.top, box.width, box.height].every((v) => v.isFinite) ||
        box.left < 0 ||
        box.top < 0 ||
        box.width <= 0 ||
        box.height <= 0 ||
        box.left + box.width > 1.000001 ||
        box.top + box.height > 1.000001) {
      throw const FormatException('Invalid tracked dog ROI');
    }
    side = math.max(box.width * width, box.height * height) * 1.25;
    left = (box.left + box.width / 2) * width - side / 2;
    top = (box.top + box.height / 2) * height - side / 2;
  }
  final int imageWidth;
  final int imageHeight;
  late final double left;
  late final double top;
  late final double side;
}

class DecodedRtmPose {
  const DecodedRtmPose(this.pose, this.rawJointScores);
  final QuadrupedPose pose;

  /// Native min(max(x), max(y)); NOT calibrated probabilities, may exceed 1.
  final List<double> rawJointScores;
}

/// Provisioning concatenates x then y on axis 1 without changing predictions.
/// AP-10K order matches QuadrupedJoint exactly. No softmax, DARK or forced label.
DecodedRtmPose decodeRtmPose(
  Float32List tensor,
  List<int> shape,
  RtmPoseCrop crop,
) {
  _checkTensor(tensor, shape, const [1, 34, 512]);
  final points = <QuadrupedJoint, PoseKeypoint>{};
  final raw = <double>[];
  for (var joint = 0; joint < 17; joint++) {
    final xOffset = joint * 512;
    final yOffset = (joint + 17) * 512;
    var xi = 0;
    var yi = 0;
    for (var bin = 1; bin < 512; bin++) {
      if (tensor[xOffset + bin] > tensor[xOffset + xi]) xi = bin;
      if (tensor[yOffset + bin] > tensor[yOffset + yi]) yi = bin;
    }
    final score = math.min(tensor[xOffset + xi], tensor[yOffset + yi]);
    raw.add(score);
    final x = (crop.left + xi / 512 * crop.side) / crop.imageWidth;
    final y = (crop.top + yi / 512 * crop.side) / crop.imageHeight;
    final visible = score > 0 && x >= 0 && x <= 1 && y >= 0 && y <= 1;
    points[QuadrupedJoint.values[joint]] = PoseKeypoint(
      x: x,
      y: y,
      // Saturation only adapts the existing [0,1] quality-score interface.
      // It does not imply calibration. Padded/outside-frame points fail closed.
      confidence: visible ? score.clamp(0.0, 1.0) : 0,
    );
  }
  return DecodedRtmPose(
    QuadrupedPose(keypoints: points),
    List.unmodifiable(raw),
  );
}

/// RGB bytes -> normalized planar BGR detector input, top-left letterbox 114.
Float32List prepareRtmDetRgb(Uint8List rgb, int width, int height) {
  _checkRgb(rgb, width, height);
  final ratio = math.min(640 / width, 640 / height);
  final rw = (width * ratio).floor();
  final rh = (height * ratio).floor();
  if (rw == 0 || rh == 0) throw const FormatException('Degenerate letterbox');
  return _resample(
    rgb,
    width,
    height,
    640,
    (x, y) => (x < rw && y < rh)
        ? ((x + 0.5) * width / rw - 0.5, (y + 0.5) * height / rh - 0.5)
        : null,
    bgr: true,
    pad: 114,
    clampEdges: true,
  );
}

/// Zero-rotation OpenMMLab affine crop: input center maps to crop center.
Float32List prepareRtmPoseRgb(Uint8List rgb, RtmPoseCrop crop) {
  _checkRgb(rgb, crop.imageWidth, crop.imageHeight);
  return _resample(
    rgb,
    crop.imageWidth,
    crop.imageHeight,
    256,
    (x, y) => (crop.left + x / 256 * crop.side, crop.top + y / 256 * crop.side),
    bgr: false,
    pad: 0,
    clampEdges: false,
  );
}

Float32List _resample(
  Uint8List rgb,
  int width,
  int height,
  int size,
  (double, double)? Function(int, int) coordinate, {
  required bool bgr,
  required double pad,
  required bool clampEdges,
}) {
  final result = Float32List(3 * size * size);
  final mean = bgr
      ? const [103.53, 116.28, 123.675]
      : const [123.675, 116.28, 103.53];
  final std = bgr
      ? const [57.375, 57.12, 58.395]
      : const [58.395, 57.12, 57.375];
  double sample(int x, int y, int c) {
    if (clampEdges) {
      x = x.clamp(0, width - 1);
      y = y.clamp(0, height - 1);
    }
    return x < 0 || y < 0 || x >= width || y >= height
        ? pad
        : rgb[(y * width + x) * 3 + c].toDouble();
  }

  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      final point = coordinate(x, y);
      for (var c = 0; c < 3; c++) {
        var value = pad;
        if (point != null) {
          final sx = point.$1.floor();
          final sy = point.$2.floor();
          final dx = point.$1 - sx;
          final dy = point.$2 - sy;
          final channel = bgr ? 2 - c : c;
          value =
              sample(sx, sy, channel) * (1 - dx) * (1 - dy) +
              sample(sx + 1, sy, channel) * dx * (1 - dy) +
              sample(sx, sy + 1, channel) * (1 - dx) * dy +
              sample(sx + 1, sy + 1, channel) * dx * dy;
        }
        result[c * size * size + y * size + x] = (value - mean[c]) / std[c];
      }
    }
  }
  return result;
}

void _checkImage(int width, int height) {
  if (width <= 0 || height <= 0)
    throw const FormatException('Invalid image size');
}

void _checkRgb(Uint8List rgb, int width, int height) {
  _checkImage(width, height);
  if (rgb.length != width * height * 3)
    throw const FormatException('Invalid RGB bytes');
}

void _checkTensor(Float32List data, List<int> shape, List<int> expected) {
  if (shape.length != expected.length ||
      Iterable.generate(expected.length).any((i) => shape[i] != expected[i]) ||
      data.length != expected.reduce((a, b) => a * b) ||
      data.any((v) => !v.isFinite)) {
    throw FormatException('Invalid RTM tensor: expected $expected, got $shape');
  }
}

double _iou(NormalizedDogBox a, NormalizedDogBox b) {
  final w = math.max(
    0.0,
    math.min(a.left + a.width, b.left + b.width) - math.max(a.left, b.left),
  );
  final h = math.max(
    0.0,
    math.min(a.top + a.height, b.top + b.height) - math.max(a.top, b.top),
  );
  final intersection = w * h;
  return intersection /
      (a.width * a.height + b.width * b.height - intersection);
}
