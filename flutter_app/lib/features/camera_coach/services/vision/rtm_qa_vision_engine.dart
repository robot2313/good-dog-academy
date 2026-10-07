import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;

import '../../domain/camera_coach_models.dart';
import '../../domain/dog_tracking.dart';
import '../../domain/dog_crop_evidence.dart';
import '../../domain/target_dog_tracker.dart';
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
DogVisionEngine createRtmQaEngine({bool improved = false}) {
  if (!rtmQaRequested) {
    throw StateError('Model A requires a private debug QA build');
  }
  return _VerifiedRtmQaEngine(
    composeRtmQaEngine(
      detectorExecutor: FlutterOnnxFloatTensorExecutor(
        modelLocation: '$_assetRoot/rtmdet-tiny.onnx',
        modelSource: FlutterOnnxModelSource.asset,
        inputName: 'images',
        outputName: 'output',
      ),
      poseExecutor: FlutterOnnxFloatTensorExecutor(
        modelLocation: '$_assetRoot/rtmpose-ap10k-packed.onnx',
        modelSource: FlutterOnnxModelSource.asset,
        inputName: 'input',
        outputName: 'simcc_xy',
      ),
      improved: improved,
    ),
  );
}

DogVisionEngine createImprovedRtmQaEngine() =>
    createRtmQaEngine(improved: true);

/// The phone and real-graph desktop replay use identical composition; only the
/// tensor executor is platform-specific. Baseline keeps its old crop/decoder.
DetectorFirstDogVisionEngine composeRtmQaEngine({
  required FloatTensorExecutor detectorExecutor,
  required FloatTensorExecutor poseExecutor,
  bool improved = false,
}) {
  final cache = improved ? RtmQaFrameCache() : null;
  return DetectorFirstDogVisionEngine(
    detector: RtmQaDogDetector(
      detectorExecutor,
      cache: cache,
      cropEvidence: improved,
    ),
    tracker: improved ? TargetDogTracker() : DogTracker(),
    qaLimbPosture: true,
    qaTemporalQuality: improved,
    poseModel: RtmQaPoseModel(poseExecutor, cache: cache),
  );
}

/// One decoded frame only, shared by detector and pose, cleared on disposal.
class RtmQaFrameCache {
  String? _id;
  (Uint8List, int, int)? _image;
  void remember(String id, (Uint8List, int, int) image) {
    _id = id;
    _image = image;
  }

  (Uint8List, int, int)? imageFor(String id) => _id == id ? _image : null;
  void clear() {
    _id = null;
    _image = null;
  }
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

class _VerifiedRtmQaEngine
    implements DogVisionEngine, ResettableDogVisionEngine {
  _VerifiedRtmQaEngine(this.inner);
  final DetectorFirstDogVisionEngine inner;
  @override
  void resetTemporalState() => inner.resetTemporalState();
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
  RtmQaDogDetector(this.executor, {this.cache, this.cropEvidence = false});
  final FloatTensorExecutor executor;
  final RtmQaFrameCache? cache;
  final bool cropEvidence;

  @override
  Future<void> warmup() => executor.warmup();

  @override
  Future<DogDetectorResult> detect(CameraFrame frame) async {
    final timer = Stopwatch()..start();
    final path = _framePath(frame);
    final retainImage = cache != null;
    final input = await Isolate.run(() {
      final image = _readRgb(path);
      return (
        prepareRtmDetRgb(image.$1, image.$2, image.$3),
        image.$2,
        image.$3,
        retainImage ? image : null,
      );
    });
    final result = await executor.run(input.$1, const [1, 3, 640, 640]);
    if (input.$4 != null) cache?.remember(frame.id, input.$4!);
    final decoded = decodeRtmDet(
      result.data,
      result.dimensions,
      imageWidth: input.$2,
      imageHeight: input.$3,
    );
    final image = input.$4;
    final detections = cropEvidence && image != null
        ? [
            for (final d in decoded)
              withDogCropEvidence(d, image.$1, image.$2, image.$3),
          ]
        : decoded;
    return DogDetectorResult(
      detections: detections,
      inferenceMs: timer.elapsedMilliseconds,
      model: 'RTMDet tiny/$rtmQaVersion',
      imageWidth: input.$2,
      imageHeight: input.$3,
    );
  }

  @override
  Future<void> dispose() {
    cache?.clear();
    return executor.dispose();
  }
}

class RtmQaPoseModel implements QuadrupedPoseModel {
  RtmQaPoseModel(this.executor, {this.cache});
  final FloatTensorExecutor executor;
  final RtmQaFrameCache? cache;

  @override
  Future<void> warmup() => executor.warmup();

  @override
  Future<QuadrupedPoseInference> infer(
    CameraFrame frame,
    NormalizedDogBox box,
  ) async {
    final timer = Stopwatch()..start();
    final path = _framePath(frame);
    final cached = cache?.imageFor(frame.id);
    final input = await Isolate.run(() {
      final image = cached ?? _readRgb(path);
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
      rawJointScores: decoded.rawJointScores,
      imageWidth: input.$2.imageWidth,
      imageHeight: input.$2.imageHeight,
    );
  }

  @override
  Future<void> dispose() {
    cache?.clear();
    return executor.dispose();
  }
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
