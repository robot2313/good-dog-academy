# Owner phone recording review — 2026-10-09

## Result and scope

**NOT READY for the claimed better posture milestone.** The supplied 187.35-second Android screen recording shows Improved A `temporal-quality-v3` running, but three labelled dog examples yield zero posture coverage. This review does not establish better dog detection, tracking accuracy or posture accuracy versus Baseline A. A recovery/diagnostics fix is justified as a **verified defect**, supporting Phase 1 ranked task 1 (real phone benchmark) and the existing uncertainty contract.

Starting branch/head: `work/flutter-camera-phase1`, `74e5d39c12ef7a1754e036852c2dc6f1d8662ae3`. Clean checkout; fetched live heads agree with the prior build receipt. Main remains `a63f6d067157b4bdc710f2d1d44b31877e4b7475`. Changes are isolated on `work/flutter-camera-recording-fixes`.

## Phone evidence

The clip tests dog **pictures displayed on another phone**, with hand occlusion, glare, partial framing and transitions between different pictured dogs. It is useful integration evidence, but does not certify tracking of a moving physical dog. Only Improved A is recorded. Original media/derived screenshots remain private and are not committed to this public repository. No training rights are inferred.

| Approximate video time | Observed behavior |
|---|---|
| 0–12 s | Improved A v3 selected; session starts and analysed camera frames appear |
| 17–30 s | Sitting picture alternates between No dog and UNKNOWN |
| 31–60 s | Green box appears; its location persists across frame changes, including an image-loading blank |
| 62–178 s | Visible diagnostics repeatedly say lost, score 0%, reason target_lost, joints 0/0; old green box remains |
| 90–120 s | Standing picture yields UNKNOWN while target remains lost |
| 145–178 s | Lying pug picture yields UNKNOWN while target remains lost |
| 182–187 s | Session summary: three labels, dog TP3/FP0/FN0, posture coverage 0%; one false negative for each posture; capture errors/busy skips both zero |

The three selected labels are not an unbiased detector-recall estimate. Raw detector presence explains TP3 even though the locked target is lost. No successful target acquisition/recovery or usable skeleton can be established in the visible diagnostic portion.

Twenty-three visible, distinct latency samples were transcribed at five-second sample positions. P50 is **995 ms**, nearest-rank P95 **1231 ms**, maximum **1234 ms**, minimum **840 ms**. These are sampled displayed controller analysis times, not a complete distribution or camera cadence. The lost-target path skips pose. Later samples are slower, but thermal throttling cannot be inferred without device instrumentation. RAM, temperature, end-to-end frame age and sustained full-pipeline performance are unmeasured. Machine-readable values and limitations are in `phone-recording-review-metrics.json`.

## Verified cause versus uncertainty

The tracker intentionally retains identity after loss. More than six seconds without an associated detection requires explicit restart, so a different dog's picture cannot inherit the previous target. This safeguard remains. The video does not show a successful restart; locking/resuming a label is not a target reset.

The defect is that historical target geometry was emitted/drawn as a green current box, while the detector-confidence field only described matched target detections and went blank for other dog candidates. A generic lost message did not distinguish an expired lock that could no longer recover automatically. The recovery action was far below the large portrait camera image.

The exact first association failure is unproven without exported structured records. Crop appearance contamination, viewpoint/scale change, low detector confidence and partial framing remain hypotheses. Do not loosen identity gates or posture thresholds to make these pictures pass. Missing skeletons during target loss are expected because pose is deliberately skipped; this clip cannot prove the pose model itself failed.

## Implementation plan and resulting behavior

Keep RTMDet/RTMPose weights, runtime, association thresholds, pose filter, classifier, baseline registration and storage contracts. Restrict changes to detector-first QA output, guidance, QA presentation, candidate version, tests and private build identity. No strategic Source-of-Truth edits or new dependencies.

- Improved A emits no dog box when the current frame has no matched target; internal history remains for association.
- QA draws a green box only for fresh acquired/tracking observations, including Baseline A. Lost/reacquiring/stale geometry cannot look confirmed.
- Unassociated current dog confidence is recorded separately in diagnostics and labelled `Dog candidate · target unconfirmed`; it never becomes target confidence or authorizes pose.
- Loss beyond six seconds reports `target_restart_required` with a concrete instruction.
- A lost/expired-target notice and explicit new-session button appear immediately before the camera image. Restart retains the existing drain/dispose/new-session behavior.
- Improved A becomes `temporal-quality-v4`, keeping saved versions separate.
- Recovery QA uses a distinct package `com.robot2313.migration.good_dog_academy.qa.camera_recovery_v4`, label **GDA Camera Recovery QA**, to avoid the prior package/signature conflict. Other workflow branches keep their identities. Private artifacts remain encrypted; the refreshed transfer private key stays outside Git.

## Before/after acceptance evidence

| Measure | Recorded v3 | Recovery v4 verification |
|---|---|---|
| Green box during lost target | Visible repeatedly | Regression requires no visible/emitted box |
| Unassociated dog confidence | Dash | Separate candidate score; target score remains absent |
| Expired lock reason | Generic target_lost | Explicit target_restart_required |
| New target selection | Buried restart action | Visible recovery action; no automatic identity transfer |
| Pose run on lost target | Skipped | Still skipped; regression checks call count |
| Explicit restart | Not demonstrated | Regression selects new target and resumes pose |
| SIT/STAND/DOWN coverage | 0/3 labels | Not yet measured on phone; no improvement claim |
| Detector/model quality | No baseline comparison | Same weights/processing; no new accuracy claim |
| Latency P50/P95/max | Sampled 995/1231/1234 ms | Not yet measured on phone; no speed claim |

Unit/widget checks prove output and recovery contracts, not model accuracy. A new APK is a diagnostic recovery retest, not an approved perception upgrade. Build evidence, exact commit, artifact and checksums must accompany delivery.

## Local verification

Flutter 3.47.2 / Dart 3.13.2; `CI=true FLUTTER_SUPPRESS_ANALYTICS=true`:

- `flutter analyze --no-pub`: no issues.
- `flutter test --no-pub test/camera_coach_detector_first_engine_test.dart test/camera_coach_pose_shadow_screen_logic_test.dart test/camera_coach_temporal_quality_test.dart test/camera_coach_guidance_test.dart`: **38 passing**.
- `flutter test --no-pub`: **379 passing**, including unrelated navigation/persistence/lesson coverage.
- `TZ=UTC flutter test --no-pub`: **379 passing** (before the timezone fixture correction; the final CI also tests UTC).
- The new lost-target regression was copied into a detached worktree at the exact original v3 head and run with `--plain-name 'lost target clears overlay, preserves detector truth and requires explicit reset'`: **expected failure**, actual stale `NormalizedDogBox` where null is required. The same regression passes in v4. No real model inference is involved in this state/output comparison.
- Workflow embedded Python parses; executing its Android configuration on generated-project-shaped inputs verifies consumer, original QA and recovery QA package/label/minimum API separately.
- `git diff --check`: clean.

The first full run under this environment's AEDT timezone exposed an existing Daily Plan test fixture: UTC 12:00 and 13:00 cross local midnight, contradicting its same-local-day premise. The test now uses local noon and 13:00 on one day, retaining every assertion. Daily Plan production code is unchanged. The full suite passes afterward in AEDT; this is test infrastructure required for the build gate, not an app feature change. One initial recovery-test fixture placed the dog against the frame edge and correctly skipped pose; it was corrected to a fully visible box before acceptance. No assertions or validity gates were weakened.

Changed files: detector-first engine, perception guidance, QA calibration screen, QA candidate registration, two camera regression test files, the Daily Plan test fixture, Android QA workflow, public transfer recipient certificate, this report and its metric JSON. No model assets, dependency locks, production navigation/history or canonical strategic documents change.

## Phone retest

Open **GDA Camera Recovery QA**, select/create the dog, tap the Home flask icon, choose **Improved A · target lock + filtered pose · v4**, and **Start new QA session** with the entire dog already in view. Prefer a physical dog in a clear side view. After any expired-lock notice, deliberately tap **Restart target / new QA session**. When testing another dog's picture, restart for that picture too. Lock/resume buttons only label a frame.

Check that a lost target has no green box, unassociated dog confidence remains inspectable, restart is obvious, and a restarted session can run pose. Then test a whole-body stand, sit and down and save/export separate labels. A physical moving-dog recording and Baseline A comparison remain required before calling perception materially better.

## Next major dependency

Capture/export a consented, dog-disjoint physical-phone benchmark with fresh target sessions, raw timestamped detector/pose evidence and matched Baseline A runs. This isolates association failures from pose/classifier failures before dog-specific training.
