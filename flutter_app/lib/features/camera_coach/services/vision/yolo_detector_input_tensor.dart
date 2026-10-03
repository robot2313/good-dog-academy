import 'dart:typed_data';

const yoloDetectorTensorSize = 640;
const yoloDetectorTensorChannels = 3;

Float32List rgbBytesToYoloDetectorTensor(
  Uint8List pixels, {
  required int width,
  required int height,
  required int channels,
}) {
  if (width != yoloDetectorTensorSize ||
      height != yoloDetectorTensorSize) {
    throw ArgumentError(
      'Detector input must be '
      '${yoloDetectorTensorSize}x$yoloDetectorTensorSize.',
    );
  }
  if (channels != 3 && channels != 4) {
    throw ArgumentError.value(
      channels,
      'channels',
      'Detector input must use RGB or RGBA bytes.',
    );
  }

  final expected = width * height * channels;
  if (pixels.length != expected) {
    throw ArgumentError(
      'Expected $expected detector image bytes, '
      'received ${pixels.length}.',
    );
  }

  final plane = width * height;
  final output = Float32List(yoloDetectorTensorChannels * plane);
  for (var pixel = 0; pixel < plane; pixel++) {
    final source = pixel * channels;
    output[pixel] = pixels[source] / 255.0;
    output[plane + pixel] = pixels[source + 1] / 255.0;
    output[plane * 2 + pixel] = pixels[source + 2] / 255.0;
  }
  return output;
}
