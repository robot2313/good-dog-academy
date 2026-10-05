import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;

import '../../domain/camera_coach_models.dart';
import '../../domain/dog_tracking.dart';
import '../../domain/rtm_vision_contract.dart';
import '../camera/camera_frame_source.dart';
import 'detector_first_dog_vision_engine.dart';
import 'dog_detector.dart';
import 'dog_vision_engine.dart';
import 'flutter_onnx_tensor_runtime.dart';
import 'quadruped_pose_model.dart';

const rtmQaVersion = 'libre-3ec02bb-ap10k-7a041aa1-packed-v1';
const rtmQaRequested =
    kDebugMode &&
    bool.fromEnvironment('GDA_VISION_QA', defaultValue: false) &&
    bool.fromEnvironment('GDA_VISION_MODEL_A', defaultValue: false);
const _assetRoot = 'assets/vision-qa-model-a';
const _detectorHash =
    'a6f06381c68334f09e134d8ca7e062f4e756eaf662bb110752e80b7290470b5e';
const _poseHash =
    '8f8b474bc0009e9e023897e5999e67ac3ed583f412b1ed0571234c4bb661c32e';

/// QA-only composition of existing tracker/classifier/runtime. No lesson,
/// coaching, rewards, persistence or adaptive services are available here.
DogVisionEngine createRtmQaEngine() {
  if (!rtmQaRequested) {
    throw StateError('Model A requires a private debug QA build');
  }
  return _VerifiedRtmQaEngine(
    DetectorFirstDogVisionEngine(
      detector: RtmQaDogDetector(
        FlutterOnnxFloatTensorExecutor(
          modelLocation: '$_assetRoot/rtmdet-tiny.onnx',
          modelSource: FlutterOnnxModelSource.asset,
          inputName: 'images',
          outputName: 'output',
        ),
      ),
      tracker: DogTracker(),
      poseModel: RtmQaPoseModel(
        FlutterOnnxFloatTensorExecutor(
          modelLocation: '$_assetRoot/rtmpose-ap10k-packed.onnx',
          modelSource: FlutterOnnxModelSource.asset,
          inputName: 'input',
          outputName: 'simcc_xy',
        ),
      ),
    ),
  );
}

void validateRtmQaMetadata(Map<String, dynamic> metadata) {
  if (metadata['id'] != 'rtmdet-tiny-rtmpose-m-ap10k' ||
      metadata['version'] != rtmQaVersion ||
      metadata['production_approved'] != false ||
      metadata['usage'] != 'private-engineering-qa' ||
      metadata['detector_sha256'] != _detectorHash ||
      metadata['pose_sha256'] != _poseHash) {
    throw const FormatException('Unrecognized Model A QA metadata');
  }
}

Future<void> verifyRtmQaAssets(AssetBundle bundle) async {
  final metadata = jsonDecode(
    await bundle.loadString('$_assetRoot/manifest.json'),
  );
  if (metadata is! Map<String, dynamic>) {
    throw const FormatException('Missing QA metadata');
  }
  validateRtmQaMetadata(metadata);
  for (final artifact in {
    'rtmdet-tiny.onnx': _detectorHash,
    'rtmpose-ap10k-packed.onnx': _poseHash,
  }.entries) {
    final bytes = await bundle.load('$_assetRoot/${artifact.key}');
    if (sha256
            .convert(
              bytes.buffer.asUint8List(
                bytes.offsetInBytes,
                bytes.lengthInBytes,
              ),
            )
            .toString() !=
        artifact.value) {
      throw FormatException('Checksum mismatch: ${artifact.key}');
    }
  }
}

class _VerifiedRtmQaEngine implements DogVisionEngine {
  _VerifiedRtmQaEngine(this.inner);
  final DetectorFirstDogVisionEngine inner;
  Future<void>? _opening;
  bool _disposed = false;

  @override
  Future<void> warmup() {
    if (_disposed) throw StateError('Model A has been disposed');
    return _opening ??= _verifyAndOpen();
  }

  Future<void> _verifyAndOpen() async {
    try {
      await verifyRtmQaAssets(rootBundle);
      if (_disposed) throw StateError('Model A closed during provisioning');
      await inner.warmup();
    } catch (error) {
      throw StateError(
        'Model A unavailable. Provision the verified QA assets. $error',
      );
    }
  }

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    await warmup();
    if (_disposed) throw StateError('Model A has been disposed');
    return inner.detect(frame);
  }

  @override
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    try {
      await _opening;
    } catch (_) {
      /* failed open still needs cleanup */
    }
    await inner.dispose();
  }
}

class RtmQaDogDetector implements DogDetector {
  RtmQaDogDetector(this.executor);
  final FloatTensorExecutor executor;

  @override
  Future<void> warmup() => executor.warmup();

  @override
  Future<DogDetectorResult> detect(CameraFrame frame) async {
    final timer = Stopwatch()..start();
    final path = _framePath(frame);
    final input = await Isolate.run(() {
      final image = _readRgb(path);
      return (
        prepareRtmDetRgb(image.$1, image.$2, image.$3),
        image.$2,
        image.$3,
      );
    });
    final result = await executor.run(input.$1, const [1, 3, 640, 640]);
    final detections = decodeRtmDet(
      result.data,
      result.dimensions,
      imageWidth: input.$2,
      imageHeight: input.$3,
    );
    return DogDetectorResult(
      detections: detections,
      inferenceMs: timer.elapsedMilliseconds,
      model: 'RTMDet tiny/$rtmQaVersion',
    );
  }

  @override
  Future<void> dispose() => executor.dispose();
}

class RtmQaPoseModel implements QuadrupedPoseModel {
  RtmQaPoseModel(this.executor);
  final FloatTensorExecutor executor;

  @override
  Future<void> warmup() => executor.warmup();

  @override
  Future<QuadrupedPoseInference> infer(
    CameraFrame frame,
    NormalizedDogBox box,
  ) async {
    final timer = Stopwatch()..start();
    final path = _framePath(frame);
    final input = await Isolate.run(() {
      final image = _readRgb(path);
      final crop = RtmPoseCrop(image.$2, image.$3, box);
      return (prepareRtmPoseRgb(image.$1, crop), crop);
    });
    final result = await executor.run(input.$1, const [1, 3, 256, 256]);
    final decoded = decodeRtmPose(result.data, result.dimensions, input.$2);
    return QuadrupedPoseInference(
      dogDetected: true,
      detectionConfidence: null,
      dogBoundingBox: box,
      pose: decoded.pose,
      inferenceMs: timer.elapsedMilliseconds,
    );
  }

  @override
  Future<void> dispose() => executor.dispose();
}

String _framePath(CameraFrame frame) {
  final value = frame.uri;
  if (value == null || value.trim().isEmpty) {
    throw const FormatException('Missing camera frame');
  }
  final uri = Uri.parse(value);
  if (uri.scheme.isEmpty) return value;
  if (uri.scheme != 'file') {
    throw const FormatException('Expected local camera frame');
  }
  return File.fromUri(uri).path;
}

(Uint8List, int, int) _readRgb(String path) {
  final decoded = img.decodeImage(File(path).readAsBytesSync());
  if (decoded == null) throw const FormatException('Invalid camera image');
  final image = img.bakeOrientation(decoded);
  final rgb = Uint8List(image.width * image.height * 3);
  var i = 0;
  for (final pixel in image) {
    rgb[i++] = pixel.r.round().clamp(0, 255);
    rgb[i++] = pixel.g.round().clamp(0, 255);
    rgb[i++] = pixel.b.round().clamp(0, 255);
  }
  return (rgb, image.width, image.height);
}
