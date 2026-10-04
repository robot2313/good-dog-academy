import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:image/image.dart' as img;

import '../../domain/dog_tracking.dart';
import '../../domain/quadruped_input_tensor.dart';
import '../../domain/tracked_dog_roi.dart';
import '../camera/camera_frame_source.dart';
import 'quadruped_pose_runtime.dart';
import 'yolo_detector_input_tensor.dart';
import 'yolo_dog_detector_runtime.dart';

/// File-backed preprocessing for Camera Coach snapshot frames.
///
/// Camera capture currently supplies local JPEG file URIs. Decode, orientation
/// baking, crop and resize run on a worker isolate so 640x640 detector work does
/// not block Flutter UI rendering.
class FlutterFileDogDetectorPreprocessor
    implements DogDetectorFramePreprocessor {
  const FlutterFileDogDetectorPreprocessor();

  @override
  Future<PreparedDogDetectorInput> prepare(CameraFrame frame) async {
    final path = _localFramePath(frame);
    final data = await Isolate.run(() => _prepareDetector(path));
    return PreparedDogDetectorInput(
      data: data,
      dimensions: const <int>[1, 3, 640, 640],
    );
  }
}

class FlutterFileQuadrupedPreprocessor
    implements QuadrupedFramePreprocessor {
  const FlutterFileQuadrupedPreprocessor();

  @override
  Future<PreparedQuadrupedInput> prepare(
    CameraFrame frame,
    NormalizedDogBox dogBoundingBox,
  ) async {
    final path = _localFramePath(frame);
    final box = <double>[
      dogBoundingBox.left,
      dogBoundingBox.top,
      dogBoundingBox.width,
      dogBoundingBox.height,
    ];
    final result = await Isolate.run(() => _preparePose(path, box));

    return PreparedQuadrupedInput(
      data: result.$1,
      dimensions: const <int>[1, 3, 256, 256],
      crop: NormalizedCropRect(
        left: result.$2[0],
        top: result.$2[1],
        width: result.$2[2],
        height: result.$2[3],
      ),
    );
  }
}

Float32List _prepareDetector(String path) {
  final source = _decodeOriented(path);
  final resized = img.copyResize(
    source,
    width: yoloDetectorTensorSize,
    height: yoloDetectorTensorSize,
    maintainAspect: false,
    interpolation: img.Interpolation.linear,
  );
  final rgb = _rgbBytes(resized);
  return rgbBytesToYoloDetectorTensor(
    rgb,
    width: resized.width,
    height: resized.height,
    channels: 3,
  );
}

(Float32List, List<double>) _preparePose(
  String path,
  List<double> box,
) {
  final source = _decodeOriented(path);
  final dogBox = NormalizedDogBox(
    left: box[0],
    top: box[1],
    width: box[2],
    height: box[3],
  );
  final pixelCrop = trackedDogSquareCrop(
    source.width,
    source.height,
    dogBox,
  );
  final cropped = img.copyCrop(
    source,
    x: pixelCrop.originX,
    y: pixelCrop.originY,
    width: pixelCrop.width,
    height: pixelCrop.height,
  );
  final resized = img.copyResize(
    cropped,
    width: quadrupedInputSize,
    height: quadrupedInputSize,
    maintainAspect: false,
    interpolation: img.Interpolation.linear,
  );
  final rgb = _rgbBytes(resized);
  final crop = pixelCrop.normalized(source.width, source.height);

  return (
    rgbBytesToQuadrupedTensor(
      rgb,
      width: resized.width,
      height: resized.height,
      channels: 3,
    ),
    <double>[crop.left, crop.top, crop.width, crop.height],
  );
}

img.Image _decodeOriented(String path) {
  try {
    final bytes = File(path).readAsBytesSync();
    final decoded = img.decodeImage(bytes);
    if (decoded == null) {
      throw StateError('Camera frame could not be decoded as an image.');
    }
    return img.bakeOrientation(decoded);
  } catch (_) {
    throw StateError('Camera frame could not be decoded as an image.');
  }
}

Uint8List _rgbBytes(img.Image image) {
  final output = Uint8List(image.width * image.height * 3);
  var offset = 0;
  for (final pixel in image) {
    output[offset++] = _channel(pixel.r);
    output[offset++] = _channel(pixel.g);
    output[offset++] = _channel(pixel.b);
  }
  return output;
}

int _channel(num value) => value.round().clamp(0, 255).toInt();

String _localFramePath(CameraFrame frame) {
  final raw = frame.uri?.trim();
  if (raw == null || raw.isEmpty) {
    throw StateError('Camera frame has no local image URI.');
  }

  final uri = Uri.parse(raw);
  if (uri.scheme.isEmpty) return raw;
  if (uri.scheme != 'file') {
    throw StateError(
      'Camera Coach preprocessing requires a local file URI.',
    );
  }
  return File.fromUri(uri).path;
}
