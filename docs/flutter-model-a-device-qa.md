# Model A private Android QA — 5 October 2026

This continues the benchmark in `939bc5112a49c10d40fa4d12cbcb4495ec850811`.
It does not restart Camera Coach. `productionDogVisionBundle = null` remains
unchanged. This document supersedes the older report's statement that no
candidate has been downloaded or executed.

## What actually works, and what has not been demonstrated

* Real RTMDet tiny and RTMPose AP-10K ONNX graphs were downloaded, hashed,
  inspected, and executed on CPU on a dog photograph.
* The new Dart detector decoder matches the real output; all 17 pose coordinates
  match the independent Python decoding within 0.002 source-image pixels.
* Real graphs also executed on tensors made by the **Dart preprocessors**.
  Their pose peaks differed by at most one SimCC bin from OpenCV preprocessing
  on that image. This is a smoke check, not dataset-wide export parity.
* One raw detector score was 0.37810 using OpenCV and 0.38395 using Dart
  preprocessing. Both are below the existing 0.60 tracker threshold. That image
  must not be counted as a successful tracked dog/posture sample. The pose probe
  uses the strongest raw ROI to inspect pose independently of tracking.
* The Flutter adapters are implemented and registered behind two debug flags.
  They use the existing ONNX executor, detector-first engine, tracker and posture
  classifier. No substitute predictions or forced posture labels are used.
* **Not demonstrated:** a Flutter runtime with these models, the camera QA screen
  with these models, Samsung inference, sustained latency, accuracy, or an APK.
  None of these models is production-approved.

## Git and CI

The branch remains `feature/flutter-migration`. The authorized exact push was
attempted again and failed: `could not read Username for https://github.com`.
The GitHub connector independently confirmed remote HEAD
`c0ee115e6e9986c62e8daac621d68d1240d50c56`. GitHub Actions returned zero runs for
`939bc5112a49c10d40fa4d12cbcb4495ec850811`. No replacement commit was created on
GitHub, and no branch update, PR, merge or main modification occurred.

The repository is **public**. Its existing CI remains model-free. Do not publish
a model-containing APK as a public Actions artifact under this private-only
evaluation decision. The local build script does not upload anything.

## Exact sources and rights assessment

This is an engineering review of published terms, not an assurance of complete
commercial rights. Keep all notices. Private evaluation is distinguished from
shipping Good Dog Academy commercially.

| Component | Code | Weights | Data/provenance | Decision |
|---|---|---|---|---|
| RTMDet tiny | OpenMMLab MMDetection Apache-2.0; LibreYOLO framework MIT, with Apache upstream notices | LibreRTMDett publisher explicitly labels its repackaged checkpoint Apache-2.0, identifies upstream checkpoint and modifications | COCO detection plus CSPNeXt-tiny ImageNet 600-epoch pretraining; dataset terms and individual image rights remain separate from weight licensing | Provision for private engineering inference with notices. No production redistribution approval |
| RTMPose-m AP-10K | MMPose Apache-2.0 | Official project publishes the AP-10K checkpoint and ONNX SDK archive under its Apache project release; maintainer licensing guidance is qualified, not a separate definitive checkpoint-specific legal opinion | AP-10K CC-BY-4.0; the model config explicitly uses CSPNeXt AIC/COCO pretraining. Exact image-rights chain and AIC terms remain unresolved for commercial clearance | Private evaluation based on official release/intended inference use; commercial redistribution remains unapproved |
| YOLO26n | Ultralytics AGPL-3.0 or Enterprise | Publisher applies the same licensing choice to trained models | COCO detector provenance; no audited complete rights chain. Human COCO pose weights are not animal pose | Not downloaded, bundled, purchased or run |

Primary sources reviewed:

* [RTMDet converted model card, LICENSE and NOTICE](https://huggingface.co/LibreYOLO/LibreRTMDett/tree/3ec02bbafa331cfdb1b7387e212cd515299aa9ea)
* [Exact tiny config with ImageNet pretraining](https://github.com/open-mmlab/mmdetection/blob/cfd5d3a985b0249de009b67d04f37263e11cdf3d/configs/rtmdet/rtmdet_tiny_8xb32-300e_coco.py)
* [MMDetection source](https://github.com/open-mmlab/mmdetection/tree/cfd5d3a985b0249de009b67d04f37263e11cdf3d)
* [MMPose licence](https://github.com/open-mmlab/mmpose/blob/v1.1.0/LICENSE)
* [Official RTMPose project and model links](https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose)
* [AP-10K model config, including pretraining and normalization](https://github.com/open-mmlab/mmpose/blob/main/projects/rtmpose/rtmpose/animal_2d_keypoint/rtmpose-m_8xb64-210e_ap10k-256x256.py)
* [MMPose maintainer licensing discussion](https://github.com/open-mmlab/mmpose/issues/2106)
* [AP-10K dataset](https://github.com/AlexTheBad/AP-10K)
* [Ultralytics current licensing guidance](https://www.ultralytics.com/license)

The detector config names `cspnext-tiny_imagenet_600e.pth` as backbone initialization. ImageNet access has research/noncommercial restrictions; the published Apache detector weights do not establish a blanket licence to reuse or redistribute ImageNet images. No training dataset was downloaded, and derivative-weight/commercial clearance remains unresolved.

Ultralytics currently says proprietary internal applications and R&D that is not
fully open source require Enterprise licensing. Therefore, private phone testing
is **not presumed exempt**. AGPL legal obligations depend on actual activity and
conveyance; the publisher's position is not a court determination. Written
permission covering this exact closed-source evaluation or a suitable licence
would resolve the operational blocker. No licence was accepted or purchased.

Recommended alternative to investigate: **YOLOX Nano + the same AP-10K pose**,
using [LibreYOLO's explicitly Apache-labelled Nano weights](https://huggingface.co/LibreYOLO/LibreYOLOXn)
and [Megvii's Apache source](https://github.com/Megvii-BaseDetection/YOLOX).
This is a concrete permissive mobile challenger, not a proven accuracy winner or
a claim that all COCO image rights are clean. It has not silently replaced Model B.

## Artifact identity

The version used for result isolation is
`libre-3ec02bb-ap10k-7a041aa1-packed-v1`.

Detector ONNX:

```
https://huggingface.co/LibreYOLO/LibreRTMDett/resolve/3ec02bbafa331cfdb1b7387e212cd515299aa9ea/LibreRTMDett.onnx
SHA256 a6f06381c68334f09e134d8ca7e062f4e756eaf662bb110752e80b7290470b5e
```

Publisher's upstream checkpoint:

```
https://download.openmmlab.com/mmdetection/v3.0/rtmdet/rtmdet_tiny_8xb32-300e_coco/rtmdet_tiny_8xb32-300e_coco_20220902_112414-78e30dcc.pth
```

Official pose archive:

```
https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/rtmpose-m_simcc-ap10k_pt-aic-coco_210e-256x256-7a041aa1_20230206.zip
Archive SHA256 2d75445331cf2f21d6e164430f96ffa765cd874872965ae1736932dda03987f0
end2end.onnx SHA256 1cfd1c86e0d9e5d5f95178bcd95ee9a4e8386a624cd3c57519f27ff58cac7f28
```

Official pose checkpoint used for identity cross-check:

```
https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/rtmpose-m_simcc-ap10k_pt-aic-coco_210e-256x256-7a041aa1_20230206.pth
SHA256 896e3665d849ef7eb9b6ec0995955796cc9810f024fa0aa0bdc18acb0d68bf52
```

All 14 same-named initializers, including final head weights/bias, matched that
checkpoint exactly. Fused/renamed initializers were not included in that check;
it is not a full PyTorch-versus-ONNX numerical equivalence test.

The archive contains inconsistent SDK preprocessing metadata (192x256) and a
human demo image. Neither is used as the contract or as proof of animal accuracy.
The graph, original AP-10K config, checkpoint identity check and dog-image output
support the 256x256 AP-10K contract used here.

The provisioner explicitly concatenates `simcc_x` then `simcc_y` on axis 1 to
reuse the existing single-output executor without duplicate inference sessions.
Dynamic batch is retained in the graph; runtime accepts only batch 1.
The packed graph is bit-identical to original outputs for zero and seeded-random
inputs in CPU ONNX Runtime 1.30.0. An attempted fixed-batch transformation changed
optimizer rounding, so that transformation was removed; the equality test was
not weakened.

```
rtmpose-ap10k-packed.onnx
SHA256 8f8b474bc0009e9e023897e5999e67ac3ed583f412b1ed0571234c4bb661c32e
```

No model binary is committed. Provisioned files stay under the ignored
`tools/vision_qa/provisioned/` directory or a fresh temporary Android project.

## Tensor and confidence contracts

| Property | RTMDet tiny | RTMPose AP-10K |
|---|---|---|
| Input | `images`, float32 NCHW `[1,3,640,640]` | `input`, float32 NCHW `[1,3,256,256]` |
| Color | BGR | RGB |
| Normalization on 0–255 values | mean `[103.53,116.28,123.675]`, std `[57.375,57.12,58.395]` | mean `[123.675,116.28,103.53]`, std `[58.395,57.12,57.375]` |
| Spatial preparation | Preserve aspect, top-left placement, pad 114; bilinear resize | Floating square centered on tracked ROI, 1.25 padding, zero border; bilinear affine sampling |
| Output | `output` `[1,8400,84]`: xyxy pixels followed by 80 sigmoid scores | Original two `[1,17,512]` tensors; packed `simcc_xy` `[1,34,512]` |
| Decode | No extra sigmoid, objectness or YOLO grid decode; dog class 16 | First argmax on each axis; divide by split ratio 2, inverse affine map |
| Filtering | Dog score >0.25; dog-only NMS IoU >0.65, max 100; tracker still requires 0.60 | Native score is minimum of axis maxima, without softmax/DARK |

AP-10K joint order: left eye, right eye, nose, neck, tail root, left shoulder,
left elbow, left front paw, right shoulder, right elbow, right front paw,
left hip, left knee, left back paw, right hip, right knee, right back paw.

Pose scores can exceed 1 and are **not calibrated probabilities**. The decoder
retains native scores in its return value and saturates them to [0,1] only for
the existing posture quality interface. Native per-joint arrays are not currently
persisted by the QA journal. Off-image/zero-quality joints receive quality zero.
Existing geometry thresholds and UNKNOWN behavior are unchanged. The QA screen
now explicitly describes confidence values as model scores.

Shape, length, finite-number, score-range, ROI, metadata and checksum failures
fail closed. Missing model files cannot silently select another engine.

## Build and open on the phone

There is **no APK from this run**. These are reproducible build instructions, not
an assertion that the build or UI has passed.

On a trusted machine with Flutter 3.47.2, Java 17, configured Android SDK and its
required licences already accepted, install the Python build tooling in a venv:

```bash
python3 -m pip install onnx==1.23.1 onnxruntime==1.30.0 numpy==2.5.3
bash tools/vision_qa/build_private_model_a.sh
```

The script generates a fresh temporary Android project using the migration's
existing approach, copies the app and tests, provisions hash-checked models and
notices, adds the asset directory **only to that temporary pubspec**, and runs
lockfile comparison, full analyzer and full tests before the debug build.
It sets `GDA_VISION_QA=true` and `GDA_VISION_MODEL_A=true`. Release builds cannot
activate the entry point or Model A. No SDK licences are accepted by the script.

After a successful build, transfer its printed `app-debug.apk` privately to the
Samsung, open it, and allow installation from the app used to open the file.
If Android reports a signature conflict, stop and resolve signing; do not
uninstall an existing app blindly and lose its local data.

1. Open the migration app and select/create the test dog.
2. Tap the engineering flask button in the main shell.
3. Select **Model A: RTMDet tiny + RTMPose AP-10K**.
4. Set the scenario and device text (for example `standing-side` and the Samsung
   model). Start the test and grant camera permission.
5. Confirm the active model/version, preview and live metrics. If files or hashes
   are wrong, the screen should show an error; do not label that as a model trial.
6. Freeze the analysed frame, label Sit/Stand/Down/No dog/Unsure, then resume.
   Labels refer to that exact frozen frame, not a later preview.
7. Export the benchmark JSON and retain it privately with model/session identity.

Model B stays unavailable. Selecting it should show the licensing/provisioning
blockers; there are no valid instructions to run YOLO26 in this build.

Use the 17-scenario protocol in `flutter-vision-ab-benchmark.md`: initially at
least 20 valid labelled frames per posture per model plus 20 no-dog frames,
across multiple short sessions. Then increase to at least 100 per posture/model
across dogs, views and lighting. Neither count alone proves production fitness.
Do not compare sessions with different scenario/device/protocol settings as a
fair same-input trial. Fixed recorded-video replay remains the next isolated
frame-source milestone; this work does not add an Android video decoder.

Metrics remain isolated by model/version, dog, scenario, device text and session:
precision/recall/false positives/false negatives where labels support them,
posture confusion and UNKNOWN coverage, frame counts, busy skips, errors,
analysis yield, error rate, latency P50/P95/max and posture-change counts.
Latency excludes camera capture; it includes preprocessing through classification.
Battery/thermal values remain null rather than invented measurements.

## Verification record and blockers

* Five Python test methods pass (artifact integrity and malformed metadata).
* Existing 11 pure-Dart benchmark domain checks pass.
* New pure-Dart RTM checks pass: channel normalization, padding/crop geometry,
  dog class mapping/NMS, tensor failures, SimCC mapping and conservative UNKNOWN.
* Real-output decoder parity and Dart-preprocessed ONNX execution pass as
  described above. Source image: PyTorch Hub's public `images/dog.jpg`, used only
  locally; it and its tensors are not committed or bundled.
* Targeted Dart analyzer: no issues in the new pure-domain contract/check script.
  These checks used standalone Dart 3.11.0; they do not replace the project's
  Flutter 3.47.2 / Dart >=3.13 gate.
* New Flutter tests cover debug gating, metadata, missing/corrupt assets and
  invalid tensor outputs. **Not run**: full Flutter suite/analyzer, widget/UI
  checks or Android build. Flutter is absent. Direct build attempts exit before
  compilation. The earlier source SDK bootstrap was automatically rejected after
  a cloud metadata request; it was not retried. Attempted prebuilt SDK URLs also
  returned 404, so a safe offline Flutter validation route was unavailable here.
* No real lesson, reward, skill, adaptive or daily-plan services were added to
  the QA adapters. Voice code and production model readiness were not modified.

Highest-value next action: restore authenticated Git push for the exact original
commit and a trusted Flutter/Android build environment. Run the full gates,
resolve any actual failures without weakening them, privately build Model A,
then perform the first Samsung no-dog/stand/sit/down smoke test. Do that before
spending time adding another model family or interpreting benchmark rankings.
