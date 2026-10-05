import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';
import 'package:good_dog_academy/features/camera_coach/domain/rtm_vision_contract.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/production_vision_models.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/rtm_qa_vision_engine.dart';

class _Assets extends CachingAssetBundle {
  _Assets(this.files);
  final Map<String, List<int>> files;
  @override
  Future<ByteData> load(String key) async {
    final bytes = files[key];
    if (bytes == null) throw StateError('Missing $key');
    return ByteData.sublistView(Uint8List.fromList(bytes));
  }
}

Map<String, dynamic> _metadata() => {
  'id': 'rtmdet-tiny-rtmpose-m-ap10k',
  'version': rtmQaVersion,
  'production_approved': false,
  'usage': 'private-engineering-qa',
  'detector_sha256':
      'a6f06381c68334f09e134d8ca7e062f4e756eaf662bb110752e80b7290470b5e',
  'pose_sha256':
      '8f8b474bc0009e9e023897e5999e67ac3ed583f412b1ed0571234c4bb661c32e',
};

void main() {
  test('production stays disabled and QA requires explicit build flags', () {
    expect(productionDogVisionBundle, isNull);
    if (!rtmQaRequested) expect(createRtmQaEngine, throwsStateError);
  });
  test('metadata identifies exactly the private pinned stack', () {
    validateRtmQaMetadata(_metadata());
    for (final key in _metadata().keys) {
      final invalid = _metadata()..remove(key);
      expect(() => validateRtmQaMetadata(invalid), throwsFormatException);
    }
    expect(
      () => validateRtmQaMetadata(_metadata()..['production_approved'] = true),
      throwsFormatException,
    );
  });
  test('missing assets and corrupt weights cannot open a runtime', () async {
    await expectLater(verifyRtmQaAssets(_Assets({})), throwsStateError);
    final files = <String, List<int>>{
      'assets/vision-qa-model-a/manifest.json': utf8.encode(
        jsonEncode(_metadata()),
      ),
    };
    await expectLater(verifyRtmQaAssets(_Assets(files)), throwsStateError);
    files['assets/vision-qa-model-a/rtmdet-tiny.onnx'] = [1, 2, 3];
    await expectLater(verifyRtmQaAssets(_Assets(files)), throwsFormatException);
  });
  test('SimCC wrong shape and nonfinite outputs fail closed', () {
    final crop = RtmPoseCrop(
      100,
      100,
      const NormalizedDogBox(left: 0, top: 0, width: 1, height: 1),
    );
    final tensor = Float32List(34 * 512);
    expect(
      () => decodeRtmPose(tensor, [1, 17, 1024], crop),
      throwsFormatException,
    );
    expect(
      classifyQuadrupedPosture(
        decodeRtmPose(tensor, [1, 34, 512], crop).pose,
      ).posture,
      isNull,
    );
    tensor[0] = double.nan;
    expect(
      () => decodeRtmPose(tensor, [1, 34, 512], crop),
      throwsFormatException,
    );
  });
  test('RTMDet rejects YOLO layout and score logits', () {
    final tensor = Float32List(8400 * 84);
    expect(
      () => decodeRtmDet(
        tensor,
        [1, 84, 8400],
        imageWidth: 100,
        imageHeight: 100,
      ),
      throwsFormatException,
    );
    tensor[20] = 2;
    expect(
      () => decodeRtmDet(
        tensor,
        [1, 8400, 84],
        imageWidth: 100,
        imageHeight: 100,
      ),
      throwsFormatException,
    );
  });
}
