import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import '../../flutter_app/lib/features/camera_coach/domain/dog_tracking.dart';
import '../../flutter_app/lib/features/camera_coach/domain/quadruped_pose.dart';
import '../../flutter_app/lib/features/camera_coach/domain/rtm_vision_contract.dart';

void expect(bool condition, String message) {
  if (!condition) throw StateError(message);
}

void rejects(void Function() action) {
  try {
    action();
  } on FormatException {
    return;
  }
  throw StateError('Expected contract failure');
}

void main(List<String> args) {
  final detections = Float32List(8400 * 84);
  void row(int index, double left, double score, {int cls = 16}) {
    detections.setRange(index * 84, index * 84 + 4, [
      left,
      64,
      left + 128,
      192,
    ]);
    detections[index * 84 + 4 + cls] = score;
  }

  row(0, 64, 0.9);
  row(1, 65, 0.8);
  row(2, 400, 0.7);
  row(3, 250, 0.99, cls: 15);
  List<DogDetection> decode([List<int> shape = const [1, 8400, 84]]) =>
      decodeRtmDet(detections, shape, imageWidth: 1280, imageHeight: 640);
  final dogs = decode();
  expect(dogs.length == 2, 'Dog class mapping and NMS');
  expect((dogs.first.box.left - .1).abs() < 1e-6, 'Inverse letterbox x');
  expect((dogs.first.box.top - .2).abs() < 1e-6, 'Inverse letterbox y');
  rejects(() => decode([1, 84, 8400]));
  detections[20] = double.nan;
  rejects(decode);
  detections[20] = 1.1;
  rejects(decode);
  detections[20] = .9;
  rejects(
    () => decodeRtmDet(
      Float32List(10),
      [1, 8400, 84],
      imageWidth: 1,
      imageHeight: 1,
    ),
  );
  final crop = RtmPoseCrop(
    100,
    200,
    const NormalizedDogBox(left: .25, top: .25, width: .5, height: .5),
  );
  expect(
    crop.side == 125 && crop.left == -12.5,
    'Centered padded ROI, not shifted',
  );
  final simcc = Float32List(34 * 512);
  for (var i = 0; i < 17; i++) {
    simcc[i * 512 + 256] = .9;
    simcc[(i + 17) * 512 + 256] = .8;
  }
  var pose = decodeRtmPose(simcc, [1, 34, 512], crop);
  expect(
    (pose.pose.point(QuadrupedJoint.nose).x - .5).abs() < 1e-6,
    'SimCC split and crop remap',
  );
  expect(
    (pose.pose.point(QuadrupedJoint.nose).y - .5).abs() < 1e-6,
    'SimCC y remap',
  );
  expect(
    (pose.rawJointScores[0] - .8).abs() < 1e-6,
    'Minimum axis peaks, no softmax',
  );
  simcc[256] = 2;
  simcc[17 * 512 + 256] = 1.5;
  pose = decodeRtmPose(simcc, [1, 34, 512], crop);
  expect(
    pose.rawJointScores[0] == 1.5 &&
        pose.pose.point(QuadrupedJoint.leftEye).confidence == 1,
    'Raw score preserved separately from bounded quality',
  );
  rejects(() => decodeRtmPose(simcc, [1, 17, 1024], crop));
  simcc[0] = double.infinity;
  rejects(() => decodeRtmPose(simcc, [1, 34, 512], crop));
  final empty = decodeRtmPose(Float32List(34 * 512), [1, 34, 512], crop);
  expect(
    classifyQuadrupedPosture(empty.pose).posture == null,
    'Empty pose remains UNKNOWN',
  );
  rejects(
    () => RtmPoseCrop(
      100,
      100,
      const NormalizedDogBox(left: 0, top: 0, width: 0, height: 1),
    ),
  );
  final rgb = Uint8List.fromList([255, 0, 0, 255, 0, 0]);
  final detInput = prepareRtmDetRgb(rgb, 2, 1);
  expect(
    (detInput[0] - (0 - 103.53) / 57.375).abs() < 1e-6,
    'BGR detector channel order',
  );
  expect(
    (detInput[2 * 640 * 640] - (255 - 123.675) / 58.395).abs() < 1e-6,
    'Detector red channel',
  );
  expect(
    (detInput[639 * 640] - (114 - 103.53) / 57.375).abs() < 1e-6,
    'Bottom letterbox padding',
  );
  final full = RtmPoseCrop(
    2,
    1,
    const NormalizedDogBox(left: 0, top: 0, width: 1, height: 1),
  );
  final poseInput = prepareRtmPoseRgb(rgb, full);
  expect(
    (poseInput[128 * 256 + 128] - (127.5 - 123.675) / 58.395).abs() < 1e-6,
    'RGB pose center',
  );
  rejects(() => prepareRtmDetRgb(Uint8List(1), 2, 1));
  print(
    'PASS: RTM decoding, crop, preprocessing, NMS, UNKNOWN and fail-closed contracts',
  );

  if (args.isEmpty) return;
  final path = args.single;
  Float32List read(String name) {
    final bytes = File('$path/$name').readAsBytesSync();
    final data = ByteData.sublistView(bytes);
    return Float32List.fromList(
      List.generate(
        bytes.length ~/ 4,
        (i) => data.getFloat32(i * 4, Endian.little),
      ),
    );
  }

  final reference =
      jsonDecode(File('$path/probe.json').readAsStringSync())
          as Map<String, dynamic>;
  final w = reference['width'] as int;
  final h = reference['height'] as int;
  final actual = decodeRtmDet(
    read('detector-output.f32'),
    [1, 8400, 84],
    imageWidth: w,
    imageHeight: h,
  );
  expect(actual.isNotEmpty, 'Actual ONNX dog detection');
  final box = reference['box'] as List<dynamic>;
  final actualBox = actual.first.box;
  final rgbBytes = File('$path/probe-rgb.u8').readAsBytesSync();
  void writeTensor(String name, Float32List tensor) {
    final bytes = ByteData(tensor.length * 4);
    for (var i = 0; i < tensor.length; i++) {
      bytes.setFloat32(i * 4, tensor[i], Endian.little);
    }
    File('$path/$name').writeAsBytesSync(bytes.buffer.asUint8List());
  }

  writeTensor('dart-detector-input.f32', prepareRtmDetRgb(rgbBytes, w, h));
  writeTensor(
    'dart-pose-input.f32',
    prepareRtmPoseRgb(rgbBytes, RtmPoseCrop(w, h, actualBox)),
  );
  expect(
    (actualBox.left * w - (box[0] as num)).abs() < .001,
    'Real detector output x parity',
  );
  expect(
    (actualBox.top * h - (box[1] as num)).abs() < .001,
    'Real detector output y parity',
  );
  final packed = Float32List.fromList([
    ...read('simcc-x.f32'),
    ...read('simcc-y.f32'),
  ]);
  final result = decodeRtmPose(packed, [
    1,
    34,
    512,
  ], RtmPoseCrop(w, h, actualBox));
  for (var i = 0; i < 17; i++) {
    final pt = result.pose.point(QuadrupedJoint.values[i]);
    final expected =
        (reference['pose_xy'] as List<dynamic>)[i] as List<dynamic>;
    expect(
      (pt.x * w - (expected[0] as num)).abs() < .002,
      'Real SimCC x parity $i',
    );
    expect(
      (pt.y * h - (expected[1] as num)).abs() < .002,
      'Real SimCC y parity $i',
    );
  }
  print(
    'PASS: Dart decoders match actual ONNX output and Python reference for all 17 joints',
  );
}
