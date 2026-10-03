import 'dart:math' as math;
import 'dart:typed_data';

import 'quadruped_pose.dart';

const quadrupedHeatmapSize = 64;
const quadrupedKeypointCount = 17;

final List<double> _gaussianKernel = _buildGaussianKernel();

bool isExpectedQuadrupedHeatmapShape(List<int> dimensions) {
  return (dimensions.length == 4 &&
          dimensions[0] == 1 &&
          dimensions[1] == quadrupedKeypointCount &&
          dimensions[2] == quadrupedHeatmapSize &&
          dimensions[3] == quadrupedHeatmapSize) ||
      (dimensions.length == 3 &&
          dimensions[0] == quadrupedKeypointCount &&
          dimensions[1] == quadrupedHeatmapSize &&
          dimensions[2] == quadrupedHeatmapSize);
}

QuadrupedPose decodeQuadrupedHeatmaps(Float32List data) {
  final expected =
      quadrupedKeypointCount * quadrupedHeatmapSize * quadrupedHeatmapSize;
  if (data.length != expected) {
    throw ArgumentError(
      'Expected $expected quadruped heatmap values, '
      'received ${data.length}.',
    );
  }

  final keypoints = <QuadrupedJoint, PoseKeypoint>{};
  for (var channel = 0; channel < quadrupedKeypointCount; channel++) {
    keypoints[QuadrupedJoint.values[channel]] = _decodeChannel(data, channel);
  }
  return QuadrupedPose(keypoints: Map.unmodifiable(keypoints));
}

PoseKeypoint _decodeChannel(Float32List input, int channel) {
  final blurred = _blurChannel(input, channel);
  var best = double.negativeInfinity;
  var bestX = 0;
  var bestY = 0;

  for (var y = 0; y < quadrupedHeatmapSize; y++) {
    for (var x = 0; x < quadrupedHeatmapSize; x++) {
      final value = blurred[y * quadrupedHeatmapSize + x];
      if (value > best) {
        best = value;
        bestX = x;
        bestY = y;
      }
    }
  }

  var refinedX = bestX.toDouble();
  var refinedY = bestY.toDouble();
  if (bestX >= 1 &&
      bestX < quadrupedHeatmapSize - 1 &&
      bestY >= 1 &&
      bestY < quadrupedHeatmapSize - 1) {
    double logValue(int x, int y) {
      return math.log(
        math.max(blurred[y * quadrupedHeatmapSize + x], 1e-10),
      );
    }

    final centre = logValue(bestX, bestY);
    final dx =
        0.5 * (logValue(bestX + 1, bestY) - logValue(bestX - 1, bestY));
    final dy =
        0.5 * (logValue(bestX, bestY + 1) - logValue(bestX, bestY - 1));
    final dxx = logValue(bestX + 1, bestY) -
        2 * centre +
        logValue(bestX - 1, bestY);
    final dyy = logValue(bestX, bestY + 1) -
        2 * centre +
        logValue(bestX, bestY - 1);
    final dxy = 0.25 *
        (logValue(bestX + 1, bestY + 1) -
            logValue(bestX - 1, bestY + 1) -
            logValue(bestX + 1, bestY - 1) +
            logValue(bestX - 1, bestY - 1));
    final determinant = dxx * dyy - dxy * dxy;

    if (determinant.abs() >= 1e-12 && dxx < 0 && dyy < 0) {
      final offsetX = -(dyy * dx - dxy * dy) / determinant;
      final offsetY = -(dxx * dy - dxy * dx) / determinant;
      if (offsetX.abs() <= 1 && offsetY.abs() <= 1) {
        refinedX += offsetX.clamp(-0.5, 0.5);
        refinedY += offsetY.clamp(-0.5, 0.5);
      }
    }
  }

  return PoseKeypoint(
    x: (refinedX / quadrupedHeatmapSize).clamp(0.0, 1.0),
    y: (refinedY / quadrupedHeatmapSize).clamp(0.0, 1.0),
    confidence: best.isFinite ? best.clamp(0.0, 1.0) : 0.0,
  );
}

Float64List _blurChannel(Float32List input, int channel) {
  final size = quadrupedHeatmapSize;
  final horizontal = Float64List(size * size);
  final output = Float64List(size * size);
  var sourcePeak = double.negativeInfinity;

  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      final sourceValue = input[_sourceIndex(channel, y, x)];
      sourcePeak = math.max(sourcePeak, sourceValue);
      var total = 0.0;
      for (var offset = -2; offset <= 2; offset++) {
        final sampleX = (x + offset).clamp(0, size - 1);
        total +=
            input[_sourceIndex(channel, y, sampleX)] *
            _gaussianKernel[offset + 2];
      }
      horizontal[y * size + x] = total;
    }
  }

  var blurredPeak = double.negativeInfinity;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var total = 0.0;
      for (var offset = -2; offset <= 2; offset++) {
        final sampleY = (y + offset).clamp(0, size - 1);
        total +=
            horizontal[sampleY * size + x] * _gaussianKernel[offset + 2];
      }
      output[y * size + x] = total;
      blurredPeak = math.max(blurredPeak, total);
    }
  }

  if (blurredPeak > 1e-10 && sourcePeak.isFinite) {
    final scale = sourcePeak / blurredPeak;
    for (var index = 0; index < output.length; index++) {
      output[index] *= scale;
    }
  }

  return output;
}

int _sourceIndex(int channel, int y, int x) {
  return channel * quadrupedHeatmapSize * quadrupedHeatmapSize +
      y * quadrupedHeatmapSize +
      x;
}

List<double> _buildGaussianKernel() {
  final raw = <double>[
    for (final x in const <int>[-2, -1, 0, 1, 2])
      math.exp(-(x * x) / 2),
  ];
  final total = raw.reduce((sum, value) => sum + value);
  return List<double>.unmodifiable(raw.map((value) => value / total));
}
