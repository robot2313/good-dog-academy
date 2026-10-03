import 'dart:typed_data';

const quadrupedInputSize = 256;
const quadrupedInputChannels = 3;

/// Upstream reference values retained for model-evaluation documentation only.
///
/// The production tensor contract deliberately does NOT subtract these means or
/// divide by these standard deviations. The model receives raw RGB magnitudes.
const quadrupedInputMean = <double>[123.675, 116.28, 103.53];
const quadrupedInputStd = <double>[58.395, 57.12, 57.375];

Float32List rgbBytesToQuadrupedTensor(
  Uint8List pixels, {
  required int width,
  required int height,
  required int channels,
}) {
  if (width != quadrupedInputSize || height != quadrupedInputSize) {
    throw ArgumentError(
      'Quadruped pose input must be '
      '${quadrupedInputSize}x$quadrupedInputSize.',
    );
  }
  if (channels != 3 && channels != 4) {
    throw ArgumentError.value(
      channels,
      'channels',
      'Quadruped pose input must use RGB or RGBA bytes.',
    );
  }

  final expected = width * height * channels;
  if (pixels.length != expected) {
    throw ArgumentError(
      'Expected $expected image bytes, received ${pixels.length}.',
    );
  }

  final plane = width * height;
  final output = Float32List(quadrupedInputChannels * plane);
  for (var pixel = 0; pixel < plane; pixel++) {
    final source = pixel * channels;
    output[pixel] = pixels[source].toDouble();
    output[plane + pixel] = pixels[source + 1].toDouble();
    output[plane * 2 + pixel] = pixels[source + 2].toDouble();
  }
  return output;
}
