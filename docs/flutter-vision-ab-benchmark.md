# Flutter vision A/B benchmark — engineering milestone, 2026-10-04

## Status and boundaries

Baseline: `feature/flutter-migration` at `c0ee115e6e9986c62e8daac621d68d1240d50c56`.
Fetched before editing; clean worktree; no AGENTS.md found in checkout. Main and the older migration branch were not checked out or changed.

This milestone adds an isolated benchmark foundation to the existing Vision Calibration · QA screen. **Neither candidate has runnable model files or validated new runtime adapters. No phone comparison, APK, or production approval is claimed.**

`productionDogVisionBundle = null` is unchanged. No lesson completion, rewards, skill scores, training history, Adaptive Brain or Daily Plan write APIs are called by the benchmark. Existing hands-free/voice modules are not rewritten. The new raw detector/failure diagnostics preserve the existing production posture decisions.

Implemented: engineering selector, explicit blocking reasons, per-session model/version/dog/scenario/device/protocol partitions, frozen analysed JPEG labelling, confusion counts, precision/recall/FPR, UNKNOWN/coverage, performance snapshots, report clipboard export, serialized lifecycle shutdown, inference drain and one engine disposal. Production navigation has no QA button unless BOTH a debug build and `GDA_VISION_QA=true` are present.

## Concrete candidates and fresh licence review

| Component | Candidate / source | Code | Weights and data review | Closed-source APK disposition |
|---|---|---|---|---|
| A detector | RTMDet tiny, COCO, 640 square input | MMDetection Apache-2.0 | Exact zoo checkpoint identified; a distinct checkpoint redistribution grant not established in reviewed material. Config inherits ImageNet pretraining. COCO annotation terms do not license every source image. | NOT cleared; no download |
| A pose | RTMPose-m, AP-10K, 256 square input | MMPose Apache-2.0 | Official animal checkpoint; config explicitly initializes from AIC/COCO pretrained backbone. AP-10K states CC-BY-4.0. This does not establish rights to the entire pretrained lineage or an explicit checkpoint grant. | NOT cleared; no download |
| B detector | Ultralytics YOLO26n detection, COCO, 640 square input | AGPL-3.0 or separate commercial terms | Ultralytics applies its licensing offering to code and models. Model card identifies AGPL. COCO image rights remain separate. No Enterprise/R&D agreement supplied. | NOT cleared for this proprietary QA APK |
| B pose | Same RTMPose-m AP-10K checkpoint as A | Same as A pose | Sharing pose isolates detector differences; it is NOT a YOLO26 animal-pose checkpoint. | Same unresolved blockers |

RTMDet tiny is the light detector starting point. The official animal RTMPose configuration found is **medium**, not a claimed tiny animal checkpoint. Its phone latency is unknown. YOLO26n is the nano detector. Standard YOLO26 pose models are human COCO pose; a 17-joint tensor is not evidence of dog-compatible joints.

Official sources checked on 2026-10-04:

- MMDetection licence: https://github.com/open-mmlab/mmdetection/blob/main/LICENSE
- RTMDet model index: https://github.com/open-mmlab/mmdetection/blob/main/configs/rtmdet/metafile.yml
- Tiny config: https://github.com/open-mmlab/mmdetection/blob/main/configs/rtmdet/rtmdet_tiny_8xb32-300e_coco.py
- Base preprocessing config: https://github.com/open-mmlab/mmdetection/blob/main/configs/rtmdet/rtmdet_l_8xb32-300e_coco.py
- A detector checkpoint URL (identified, NOT downloaded): https://download.openmmlab.com/mmdetection/v3.0/rtmdet/rtmdet_tiny_8xb32-300e_coco/rtmdet_tiny_8xb32-300e_coco_20220902_112414-78e30dcc.pth
- MMPose licence: https://github.com/open-mmlab/mmpose/blob/main/LICENSE
- Animal index: https://github.com/open-mmlab/mmpose/blob/main/configs/animal_2d_keypoint/rtmpose/ap10k/rtmpose_ap10k.yml
- Animal config: https://github.com/open-mmlab/mmpose/blob/main/configs/animal_2d_keypoint/rtmpose/ap10k/rtmpose-m_8xb64-210e_ap10k-256x256.py
- Pose checkpoint URL (identified, NOT downloaded): https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/rtmpose-m_simcc-ap10k_pt-aic-coco_210e-256x256-7a041aa1_20230206.pth
- AP-10K dataset/joints/licence: https://github.com/AlexTheBad/AP-10K
- AIC original repository: https://github.com/AIChallenger/AI_Challenger_2017 — full applicable dataset/pretraining permissions remain unresolved.
- COCO terms: https://github.com/cocodataset/cocodataset.github.io/blob/master/dataset/termsofuse.htm — annotations CC-BY-4.0; underlying image copyrights are not owned by COCO.
- Ultralytics terms: https://www.ultralytics.com/license
- Additional Enterprise and R&D terms entry point: https://www.ultralytics.com/legal
- YOLO26 model docs: https://docs.ultralytics.com/models/yolo26/
- Model card: https://huggingface.co/Ultralytics/YOLO26

Apache-2.0 source permits commercial source use subject to its conditions; it does not, by itself, resolve these checkpoint/data questions. An unresolved review is not a claim that use is forbidden. No legal approval is inferred from successful inference.

AGPL does not mean all private execution automatically requires publishing source. However, conveying an integrated proprietary APK and applicable network-use/source obligations need specific review. Ultralytics advertises Enterprise terms for proprietary embedding. To test B in this APK, obtain written terms covering Good Dog Academy, this evaluation, testers, export/ONNX conversion and on-device embedding, or establish a compliant AGPL route acceptable to the owner. An R&D offer is not assumed to cover distribution. No purchase/contact has been made. A renamed or converted YOLO model is not a licensing workaround.

No alternate full stack was declared safe: another RTMDet size would still share the unresolved pose lineage. A future RTMPose animal model trained on rights-cleared owned/licensed data, without ambiguous initialization, is a possible route, not an available artifact.

## Tensor contracts: researched targets, NOT verified ONNX contracts

| Property | RTMDet tiny target | YOLO26n target | RTMPose animal target |
|---|---|---|---|
| Input | float32 NCHW [1,3,640,640] proposed static export | float32 NCHW [1,3,640,640] proposed static export | float32 NCHW [1,3,256,256] |
| Colour / values | BGR; mean [103.53,116.28,123.675], std [57.375,57.12,58.395], on 0..255 before normalization, unless preprocessing embedded in export | RGB 0..1; no ImageNet normalization, unless exporter embeds preprocessing | RGB; mean [123.675,116.28,103.53], std [58.395,57.12,57.375] on 0..255, unless preprocessing embedded |
| Image geometry | Preserve aspect, record resize/padding inverse. Existing YOLO stretch preprocessor is NOT a valid assumed adapter | Pin letterboxing/stretch/export policy; inverse-transform boxes exactly | Animal crop + affine transform matching trained config; invert into original frame coordinates |
| Output | MMDeploy export-dependent; commonly separate post-NMS boxes/scores and labels. Must inspect actual names/shapes/dtypes; do not reinterpret as YOLO tensor | Planned end-to-end [1,300,6] xyxy pixels, confidence, contiguous class index; verify actual artifact/export settings | Two SimCC distributions, expected [1,17,512] for x and y with split ratio 2; not [1,17,64,64] heatmaps |
| Classes / confidence | COCO contiguous dog index 16 (COCO category ID 18 is different). Sigmoid class scores; no separate objectness in config | COCO contiguous dog index 16; exported row score; pin model mapping rather than infer | Joint order below; reference decoder semantics, not a fabricated probability |
| NMS | Base config IoU .65, max 300; export must state whether NMS included to prevent double NMS | End-to-end export is intended NMS-free; traditional export needs its own explicit contract | Not applicable |

AP-10K order (zero-based): left eye, right eye, nose, neck, tail root, left shoulder, left elbow, left front paw, right shoulder, right elbow, right front paw, left hip, left knee, left rear paw, right hip, right knee, right rear paw. Dataset limb naming is an annotation convention; do not substitute a human skeleton.

Reference RTMPose codec: https://github.com/open-mmlab/mmpose/blob/main/mmpose/codecs/simcc_label.py . Pin the model/export version and replicate the reference confidence decoder. SimCC scores are not automatically calibrated probabilities or interchangeable with the old heatmap confidence scale. Existing 0..1 safety thresholds require calibration/golden parity evidence before accepting this adapter. Invalid shapes, names, dtypes, nonfinite outputs, missing joints or ambiguous mapping must stop inference or return UNKNOWN; do not clamp arbitrary logits into plausible confidence.

The existing ONNX factory supports one output tensor per executor, YOLO detector decoding and quadruped heatmaps. RTMDet and SimCC need explicit new adapters, multi-output support where appropriate, and reference-Python versus Android golden-frame tests. This milestone intentionally does not route incompatible files through that factory.

## Provisioning

No model binary was downloaded, committed or bundled. No checksum has been invented. The current candidate versions are explicitly `unprovisioned-v1`, a registry state, not a measured model version.

Keep artifacts under ignored `tools/vision_qa/provisioned/<stack>/` or ignored Flutter QA model assets. Preserve the exact source checkpoint plus a derived ONNX artifact manifest, SHA-256 of both, source code commit, export tool/version/command, input/output names, dimensions/dtypes, colour/normalization, coordinate inversion, class/joint mapping, NMS, confidence semantics, and reviewer evidence.

`python tools/vision_qa/verify_manifest.py path/to/manifest.json` validates a local manifest and pinned files, then inspects ONNX graph contracts if ONNX tooling is installed. It never downloads weights or grants approval. It rejects pending reviews, absent evidence/checksums/files, path escapes, dtype/dimension mismatch and unsupported external ONNX data. This is a build-time provisioner; it is NOT a finished on-phone importer or adapter. Neither candidate is registered as runnable until integration/parity is implemented.

## Access and intended phone flow

Normal builds: no benchmark button. Engineering build: `flutter build apk --debug --dart-define=GDA_VISION_QA=true` in the generated Android project used by the existing workflow. Manual workflow now has `vision_qa` boolean, default false. Release builds cannot enable the entry even with the flag. This workflow edit is local and has not been pushed or run.

After a successful engineering build, complete existing owner/dog setup, then tap the small science/flask button on the main app shell. This opens the SAME Vision Calibration · QA screen. Select A or B, inspect the displayed version and blockers. Currently both Start buttons are disabled. Installing the prior APK will not include these local changes.

Once actual reviewed, validated artifacts are integrated:

1. Select A; enter phone/Android version and a specific scenario; start a new session.
2. Watch the live preview and model output. Freeze the analysed snapshot, then label Sit/Stand/Down/No dog/Unsure against THAT image. Successful saving resumes analysis. Discard/resume if the image is ambiguous.
3. Switching model shuts down/drains the old runtime before another can start. Select B and create a separate session with the same dog/device/scenario.
4. Use Compare saved sessions / export to inspect each partition and copy the full JSON report. Export before clearing app data/uninstalling.

## Metrics and limitations

Raw detector dog presence is separate from tracker-certified presence. Compare raw detection TP/FP/FN/TN, precision, recall and false-positive rate. Posture uses per-class one-versus-rest TP/FP/FN, precision/recall/FPR; a full confusion map retains UNKNOWN and NO_DOG columns. Unsure labels are retained but excluded from quality denominators. Coverage = known postures / owner-confirmed dog samples, so missed dogs and UNKNOWN reduce it. Zero denominators report unavailable, never perfect scores.

Frame diagnostics include requested/analysed frames, inference busy skips, capture busy skips, capture/consumer errors, detector inference exceptions and separately exposed pose failures. Error rate uses requested inference frames including busy skips; analysis yield is analysed / requested. A pose failure can produce an analysed detector result with UNKNOWN, so analysed and error counts are not disjoint. Capture-level skips/errors are reported separately and not silently folded into this denominator.

P50/P95/max measure the most recent 600 successful returned analyses (including safe UNKNOWN from pose failure); preprocessing, frame snapshot copy, detector/tracker/pose/classifier are included, camera capture and display are excluded. This is analysis latency, NOT pure neural inference or full camera-to-display latency. Warmup is excluded. Counters persist across pause/resume in the same benchmark session, with continuity reset for posture transition pairs. Labels and metrics save on labelling, pause, close, error and report opening. A force-kill can lose frames since the last save. SharedPreferences is a prototype QA journal, not a production data warehouse.

Posture transition counts/rate are a stability diagnostic only: real movement also changes posture. Compare fixed-posture periods before interpreting flicker. Device text is entered by the owner. Battery/thermal values are null/unavailable, never estimated. Retained image bytes are only for the current analysed snapshot in memory; images are not written to the benchmark journal.

Live A and B share camera API, medium resolution preset, back camera, 800 ms polling request interval, QA labels, counters and report definitions. Actual frame dimensions and performance vary by device. Sequential live runs do NOT use identical source frames and cannot establish a controlled accuracy winner. Fixed-confidence thresholds do not imply equally calibrated confidence across architectures.

## Phone protocol (after runtime provisioning)

Initial smoke test per model: **20 labelled SIT, 20 STAND, 20 DOWN and 20 NO_DOG** = 80 definite labels, plus any Unsure samples. Spread them across short separate takes; consecutive near-identical frames are not independent evidence. Warm each candidate for 20 analysed frames before starting a new scored scenario session. Alternate order A-B then B-A, keep phone position/light/resolution/polling stable, avoid charging-induced heat and record interruptions.

Cover these scenarios separately in the scenario field:

1. No dog: empty room, furniture, cushions, toy/stuffed dog, person, clutter.
2. One dog standing.
3. One dog sitting.
4. One dog lying/down.
5. Side-on.
6. Facing camera.
7. Facing away.
8. Close, including body filling frame.
9. Far away/small dog in frame.
10. Partial dog/cropped legs/head.
11. Brief occlusion, then reappearance.
12. Entering and leaving frame.
13. Low light.
14. Strong light/backlighting.
15. Cluttered background.
16. Different body shapes/breeds when available.
17. Multiple dogs; verify ambiguity produces conservative tracking/UNKNOWN.

Use 5–10 distinct labelled opportunities per challenge condition per model for smoke coverage; not all need separate posture totals. Do not force the dog into uncomfortable positions or create unsafe lighting/occlusions.

After stability: target at least 200 labelled examples EACH of sit/stand/down/no-dog per model (800 total), at least 3 dogs/body shapes if available, multiple lighting/background sessions/days and balanced angles/distances. Hold out dogs/clips from threshold tuning. Report per-dog/per-scenario counts and uncertainty rather than pooling away failures. These are data collection targets, NOT production acceptance thresholds. Production still needs independent representative data, agreed error limits and actual device validation.

## Recorded-video next milestone

Deferred: this repo supplies JPEG snapshots, not decoded video frames. Add an engineering Android document picker using a content URI, decode with MediaExtractor/MediaCodec into bounded timestamped oriented frames, then process the same stored frame IDs/timestamps/labels sequentially through each fresh engine. Inject video timestamps into DogTracker (the existing engine accepts clock injection), reset tracking/smoothing for each run, and record source SHA-256, sampling schedule, decoder, orientation, dropped frames and provider. Exclude decode from inference timing but report decode-inclusive timing separately. Never let A delete shared frame files before B consumes them. Bound storage and release temporary frames on cancellation. This should reuse the same QA controller/domain and no lesson orchestrator.

## Verification and next work

Completed locally: Python provisioning checks; standalone Dart tests of the actual dependency-free benchmark domain; Dart syntax parser; isolated domain analyzer; formatting and git whitespace checks. See the run report for exact totals.

Added Flutter integration/widget tests cover candidate blocking, metadata, result isolation, UNKNOWN, errors, duplicate taps, inference drain/pause/resume, disposal and selector UI. They are NOT claimed run.

Flutter 3.47.2 source and its Dart SDK were fetched, but automatic approval review rejected Flutter bootstrap for an attempted cloud metadata endpoint access. No bypass or retry of that request was made. A network-free `dart pub get --offline` attempt failed because required packages (first reported: flutter_lints) are absent from cache. Full Flutter test/analyze and Android build are therefore BLOCKED, not green. No Android device was connected; no device testing occurred.

Next highest-value work: run this change through an approved clean Flutter/Android CI environment, fix any integration failures, then settle checkpoint evaluation rights and build/verify the RTMDet + SimCC adapter against golden frames. Only then produce the private model-bearing APK. Until those are complete, this remains a partial implementation and cannot answer which stack wins.
