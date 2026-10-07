import 'dart:typed_data';

import 'dog_tracking.dart';

/// Cheap current-frame appearance and quality cues. No images are persisted.
/// Central RGB histograms help reject dissimilar dogs; similar coats still need
/// cautious geometric association. They are not a learned identity embedding.
DogDetection withDogCropEvidence(
  DogDetection detection,
  Uint8List rgb,
  int width,
  int height,
) {
  final b = detection.box;
  final histogram = List<double>.filled(24, 0);
  var luminance = 0.0, dark = 0, sharpness = 0.0;
  double gray(int x, int y) {
    final i = (y.clamp(0, height - 1) * width + x.clamp(0, width - 1)) * 3;
    return .299 * rgb[i] + .587 * rgb[i + 1] + .114 * rgb[i + 2];
  }

  for (var gy = 0; gy < 16; gy++) {
    for (var gx = 0; gx < 16; gx++) {
      final x = ((b.left + b.width * (.15 + .7 * (gx + .5) / 16)) * width)
          .floor()
          .clamp(0, width - 1);
      final y = ((b.top + b.height * (.15 + .7 * (gy + .5) / 16)) * height)
          .floor()
          .clamp(0, height - 1);
      final offset = (y * width + x) * 3;
      for (var channel = 0; channel < 3; channel++) {
        histogram[channel * 8 + rgb[offset + channel] ~/ 32] += 1 / 256;
      }
      final value = gray(x, y);
      luminance += value / 256;
      if (value < 25) dark++;
      final lap =
          gray(x - 1, y) +
          gray(x + 1, y) +
          gray(x, y - 1) +
          gray(x, y + 1) -
          4 * value;
      sharpness += lap * lap / 256;
    }
  }
  return DogDetection(
    box: b,
    confidence: detection.confidence,
    source: detection.source,
    appearance: List.unmodifiable(histogram),
    frameQuality: {
      'meanLuminance': luminance,
      'darkFraction': dark / 256,
      'laplacianEnergy': sharpness,
    },
  );
}
