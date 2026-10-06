import 'package:flutter/foundation.dart';

import 'dog_vision_engine.dart';
import 'rtm_qa_vision_engine.dart';

const visionBenchmarkEnabled =
    kDebugMode && bool.fromEnvironment('GDA_VISION_QA', defaultValue: false);

/// Registration is independent of production approval. A candidate cannot run
/// merely because a name is selected; reviewed artifacts and an adapter are needed.
class QaVisionCandidate {
  const QaVisionCandidate({
    required this.id,
    required this.version,
    required this.name,
    required this.blockers,
    this.factory,
  });

  final String id;
  final String version;
  final String name;
  final List<String> blockers;
  final DogVisionEngine Function()? factory;

  bool get runnable =>
      blockers.isEmpty &&
      factory != null &&
      id.trim().isNotEmpty &&
      version.trim().isNotEmpty;

  DogVisionEngine createEngine() {
    if (!runnable) {
      throw StateError('$name unavailable: ${blockers.join('; ')}');
    }
    return factory!();
  }
}

// Model A is opt-in only and verifies provisioned assets before runtime startup.
// No automatic downloads, placeholder inference, or production approval.
const qaVisionCandidates = <QaVisionCandidate>[
  QaVisionCandidate(
    id: 'rtmdet-tiny-rtmpose-m-ap10k',
    version: rtmQaRequested ? '$rtmQaVersion-limb-v2' : 'unprovisioned-v1',
    name: 'Model A: RTMDet tiny + RTMPose AP-10K · limb QA v2',
    factory: rtmQaRequested ? createRtmQaEngine : null,
    blockers: rtmQaRequested
        ? []
        : [
            'Requires an explicitly provisioned private Model A QA build.',
            'Commercial redistribution and ImageNet/AIC/COCO review remain pending.',
          ],
  ),
  QaVisionCandidate(
    id: 'yolo26n-rtmpose-m-ap10k',
    version: 'unprovisioned-v1',
    name: 'Model B: YOLO26n + RTMPose AP-10K',
    blockers: [
      'Ultralytics closed-source QA rights have not been established.',
      'Shared animal pose Android validation and commercial rights review pending.',
      'Verified ONNX files and SHA-256 checksums are absent.',
    ],
  ),
];
