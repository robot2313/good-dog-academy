# Camera Phase 1 private phone candidate — 2026-10-07

This is a private engineering candidate, not production model approval. Read `comparison-summary.json` and `bootstrap-replay-results.json` for the measured records. The APK is intended to test tracking, pose stability and useful abstention. Better SIT/DOWN accuracy has **not** been established.

## Exact starting state and integration

Fetched remote heads before changes:

- `main`: `a63f6d067157b4bdc710f2d1d44b31877e4b7475`
- `feature/flutter-migration`: `2ed7e700e267b505b27052120823820ef9cf1844`
- `fix/model-a-camera-quality`: `56184bb6e5bd09feb1868846370fa74c2b649117`
- Common ancestor: `c0ee115e6e9986c62e8daac621d68d1240d50c56`

The strongest complete camera implementation is the camera-quality head. `work/flutter-camera-phase1` starts there. Source of Truth, AGENTS and GEMINI are already byte-identical to the Flutter branch; no whole-branch merge was necessary. Initial workspace was clean. No main changes, resets, force pushes or production publication.

Baseline full suite: 348 passing tests. Baseline A remains selectable with its original tracker, crop and posture behavior. Improved A uses the same hash-verified detector and pose weights and a separate version/session key.

## Evidence and limitations

The available legitimate bootstrap evidence comprises two prior user-supplied phone screenshots: frontal tan sitting dog and side-view dark standing dog displayed on another phone, plus an empty patio crop. The latter is not a direct-camera dog image. No real clips, DOWN example, bounding-box annotation set or breed-balanced dog-disjoint dataset was available. Original screenshots/private crops are not published in this repository. Hashes and annotations are retained in `bootstrap-benchmark-manifest.json`.

A 30-observation sequence varies brightness on the single standing source photo. This is a repeatable perturbation stress test, **not** 30 independent examples or real dog motion. Actual ONNX models run through the phone's Dart preprocessing, tracking, crop, SimCC decoder and classifier; only the platform execution transport is replaced with desktop CPU ONNX Runtime. Domain simulations separately test association and filtering; they do not certify real multi-dog accuracy.

| Measure | Baseline A | Improved A | Scope |
|---|---:|---:|---|
| Dog-present recall | 2/2 | 2/2 | Two source stills |
| No-dog false positives | 0/1 | 0/1 | One empty crop |
| Standing result in perturbation | 29/30 | 29/30 | One photo; first frame confirms |
| UNKNOWN in perturbation | 1/30 | 1/30 | Same sequence |
| Confident wrong posture | 0 | 0 | Bootstrap only |
| Frontal SIT | UNKNOWN | UNKNOWN | Weak rear-body evidence |
| DOWN accuracy | Not measured | Not measured | No labelled DOWN source |
| Mean adjacent joint displacement | 0.00116946 | 0.00074900 | 406 jointly usable matched pairs, normalized frame units |
| Pose jitter reduction | — | 35.95% | Same joint-pair intersection; first three observations excluded |
| CPU analysis P50/P95/max | 376/447/455 ms | 353.5/416/436 ms | Desktop only; capture excluded |
| Wrong target assignments | 2 | 0 | Controlled different-coat, distant-dog simulation |
| Wrong stable target frames | 1 | 0 | Same simulation |
| Motion association misses | 3/6 | 0/6 | Controlled detector observations |
| Summed pose-crop horizontal error | 0.18224 | 0 | Controlled motion; normalized image units |

The filter leaves fewer usable pairs (406 vs 416 when each pipeline is counted independently); current low-confidence observations are never replaced by historical joints. The primary jitter comparison uses the common 406 pairs to avoid benefiting from exclusion alone. Latency sample size is too small to claim statistically faster inference. No target-phone RAM, thermal or 5–10 minute sustained measurement was completed.

## What changed

- Motion-aware association uses predicted center, overlap, size, aspect and a cheap 24-bin RGB crop histogram. Color is an ambiguity aid, not an identity guarantee. Lower-confidence detections can continue an already confirmed, strongly overlapping target; they cannot acquire one.
- Lost tracks retain their target signature, abstain on ambiguous candidates and need two fresh matching observations. After six seconds without the target, an explicit new session is required. Similar-looking dogs or crossings remain unproven.
- Pose receives the **current detector observation**, not the lagging smoothed display box. The existing 1.35 crop margin, coordinate mapping and weight contracts remain intact.
- Confidence-weighted filtering happens in dog-box coordinates. Large one-frame joint jumps lose confidence; persistent movement can resume. Missing joints are not hallucinated. Loss, stale timestamps, gaps and session restarts reset history. Raw pose remains available in QA.
- Existing whole-limb geometry and fresh-frame confirmation remain. Conflicting raw/filtered posture evidence abstains. No new one-limb SIT rule, trained TCN or dog-specific checkpoint is claimed.
- Deterministic framing/pose guidance prioritizes one instruction: distance, edge clipping, low light, visible paws/body, unreliable rear chain or lost/reacquiring target.
- QA displays the actual analysed frame with timestamp, version, confidence-colored skeleton and raw/filtered toggle. Live results older than four seconds cannot be labelled/frozen as current truth. A deliberately frozen frame remains labelable.
- One current decoded RGB frame is shared between detector and pose in Improved A. Requests remain serialized with existing backpressure and disposal draining.
- Bounded structured temporal evidence (120 recent analysed records) is stored with QA metrics and model/session identity. Raw/filtered joints, timestamp and reasons remain inspectable; no images are persisted in training history.

## Pipeline verification

Existing regression coverage verifies RTM detector NCHW RGB normalization, resize/letterbox restoration, clipped/invalid boxes, pose padded square crop restoration, packed SimCC decode and 17-joint mapping, invalid native scores, manifest hashes and fail-closed loading. New EXIF-6 regression checks that the Flutter analysed-image orientation and image-package inference orientation agree. Detector outputs and pose input contracts are unchanged. Model assets were provisioned and verified; packed pose was compared bit-for-bit with the original output during provisioning.

Detector remains LibreYOLO RTMDet tiny, input `[1,3,640,640]`. Pose remains RTMPose-m AP-10K, input `[1,3,256,256]`, 17 joints.

- Detector SHA-256: `a6f06381c68334f09e134d8ca7e062f4e756eaf662bb110752e80b7290470b5e`
- Original pose SHA-256: `1cfd1c86e0d9e5d5f95178bcd95ee9a4e8386a624cd3c57519f27ff58cac7f28`
- Packed pose SHA-256: `8f8b474bc0009e9e023897e5999e67ac3ed583f412b1ed0571234c4bb661c32e`

Model asset manifest/notices and private engineering gates are preserved. No new weight licence was introduced into the app.

## Detector/pose experiments and training boundary

RTMDet is retained because no challenger passed the complete GDA + Android acceptance gate. D-FINE-N was downloaded at a pinned Hugging Face revision, hash checked and its graph contracts inspected. Its separate exploratory comparison was rejected by automatic approval review for suspected Microsoft telemetry despite explicit telemetry disable; that comparison is excluded from acceptance. Network-isolated execution was unavailable (namespace creation denied). RF-DETR-N/S export/licensing and YOLO26 nano/small licensing were examined but no phone comparison or conversion was completed. Do not describe these as tested phone candidates.

Primary references: [D-FINE](https://github.com/Peterande/D-FINE), [LibreYOLO](https://github.com/LibreYOLO/LibreYOLO), [YOLO26](https://docs.ultralytics.com/models/yolo26/), [Ultralytics licensing](https://www.ultralytics.com/license), [RF-DETR](https://github.com/roboflow/rf-detr). D-FINE reference/model cards indicate Apache-2.0, while pretrained dataset provenance still requires commercial review. YOLO26's AGPL/Enterprise path was not established for closed-source redistribution. No challenger is bundled, trained or production-approved.

No GPU/training run or licence-audited, representative dog training dataset was available. Fine-tuning on these two stills would be indefensible. `gda-canine-31-v1.json` defines an annotation-only future canine skeleton and AP-10K correspondence; it is not a new pose model. A real training path must first collect consented GDA dog-disjoint clips, audit dataset and weight licences, annotate boxes/skeleton/visibility/posture, split by dog+session before extracting frames, train/export compact models and compare on the frozen held-out clips including latency and wrong confident results. No train/test leakage is acceptable.

## Validation commands

From `flutter_app`, with Flutter 3.47.2 and `CI=true FLUTTER_SUPPRESS_ANALYTICS=true`:

```
flutter analyze
flutter test
flutter test test/camera_coach_temporal_quality_test.dart test/camera_coach_guidance_test.dart test/camera_coach_detector_first_engine_test.dart test/camera_coach_pose_shadow_controller_test.dart test/camera_coach_qa_orientation_test.dart
```

Analyzer: no issues. Full suite: 376 tests passing. Baseline exact-head full suite: 348 passing. Python: `PYTHONPATH=<onnx-dependency-directory> python3 -m unittest discover -s tools/vision_qa -p 'test_*.py' -v` — 5 passing.

Real replay:

```
GDA_REPLAY_MANIFEST=<private-manifest.json> GDA_REPLAY_MODELS=<provisioned-directory> GDA_REPLAY_BRIDGE=<repo>/tools/vision_qa/ort_stdio.py GDA_REPLAY_OUTPUT=<baseline.json> flutter test tool/replay_model_a_test.dart
GDA_REPLAY_IMPROVED=true GDA_REPLAY_MANIFEST=<same-manifest.json> GDA_REPLAY_MODELS=<same-models> GDA_REPLAY_BRIDGE=<same-bridge> GDA_REPLAY_OUTPUT=<candidate.json> flutter test tool/replay_model_a_test.dart
GDA_DOMAIN_OUTPUT=<domain-comparison.json> flutter test tool/perception_comparison_test.dart
```

Set `PYTHONPATH` to the installed ONNX Runtime dependencies for the bridge. Both three-still runs and both 30-observation runs passed real inference. The later guidance explanation and stale-label watchdog do not change the joint-filter calculation used by those measurements. Sustained replay did not complete and is not counted as passed.

## Private Android delivery

The isolated branch push triggers `.github/workflows/flutter-phase1.yml` with both `GDA_VISION_QA=true` and `GDA_VISION_MODEL_A=true`, separate `.qa` application ID, QA label and unchanged stable debug signing cache. The repository is public, so this branch uploads an **encrypted** QA APK and plaintext checksum only. The task's short-lived recipient certificate is public; its private key is never committed or published. Decrypt locally, verify the checksum and deliver the installable APK privately. Future builders must generate a new recipient certificate/key and retain the key securely before rerunning this task-specific build path. No production release is created.

## Roger's phone test card

Install **Good Dog Academy QA** (Android 7/API24+). Open the app, complete/select your dog if requested, and use the flask icon on Home to open **Private vision benchmark / Pose Shadow QA**. Choose **Improved A · target lock + filtered pose · v3**, then start a new QA session. Allow camera permission. Use a side view with the entire dog and paws visible. The screen labels each analysed frame; it is not a live skeleton over an unrelated preview.

Select Baseline A in the model dropdown for a separate comparison session under the same conditions. Use **Lock analysed frame**, choose **Stand / Sit / Down / No dog / Unsure**, then resume. **Resume camera without label** is also available. For deliberate identity reset or a return after more than six seconds, use **Restart target / new QA session**.

| Test | What to look for |
|---|---|
| A Empty scene | No dog; no carried-over posture |
| B Side-view stand | Attached box, steady skeleton, STAND after confirmation |
| C Side-view sit | SIT when whole-body evidence supports it; useful UNKNOWN otherwise |
| D Down | DOWN with visible limbs; UNKNOWN for ambiguity |
| E Turn/front | Track retained where association supports it; posture can become UNKNOWN |
| F Handler occlusion | Temporary loss, cleared posture, no casual switch |
| G Leave frame | Temporary loss then lost; no stale posture |
| H Return | Conservative reacquisition; long absence requires restart |
| I Too close | Move back / keep body in frame guidance |
| J Too far | Move closer guidance or detection if sufficient size |

Run both candidates for several minutes. Record device, dog, scenario and session; compare latency percentiles and busy skips on the phone. Check raw vs filtered joints, especially paws and hip/knee stability. Similar-coat dogs, rapid crossings, frontal SIT and DOWN remain the most important unverified cases.

## Source-of-Truth status and one next dependency

Phase 1 advanced: ranked task 1 has a frozen bootstrap baseline and real replay harness; ranked task 3 has a 31-point canine annotation boundary; ranked task 4 has synchronized timestamped QA joint evidence. Rank 2 dog-specific detector training and rank 5 learned temporal posture remain incomplete. This is temporal engineering groundwork, not completion of Phase 1 or Phase 2.

**One major next dependency:** collect and annotate a consented, licence-cleared, dog-disjoint GDA video benchmark containing SIT/STAND/DOWN, occlusion, multiple dogs, near/far views and sustained target-phone sessions. That single dataset enables defensible detector/pose training and temporal posture evaluation.
