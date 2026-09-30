# Good Dog Academy vision model evaluation

## Migration architecture

Camera -> dedicated dog detector -> temporal dog tracker -> tracked dog ROI -> dog pose -> temporal behaviour -> rep state machine -> coaching -> persistence -> Adaptive Brain -> Daily Plan.

## Primary detector

Ultralytics YOLO26n COCO detection at 640x640, ONNX.

- Model family: YOLO26
- Variant: yolo26n
- Task: object detection
- COCO classes: 80
- Dog class: 16
- Approximate ONNX size: 9.5-9.9 MB in published model listings
- Supported output adapters:
  - (1,300,6): xyxy, confidence, class id
  - (1,84,8400): xywh plus 80 class scores with external NMS
- Runtime: onnxruntime-react-native
- Provider policy: try XNNPACK first, CPU fallback
- NNAPI: reserved for measured device benchmarking; it is not assumed to be faster

This is a dedicated object-detection stage, but it is not yet a dog-only trained detector. It selects the dog class from COCO. A dog-specific fine-tuned detector can replace the same interface after validation without changing Camera Coach.

## Pose migration

The existing 17-point quadruped ONNX model remains intact.

Preserved:
- raw RGB [0,255] preprocessing
- V6 confidence gates
- posture classification
- temporal posture smoothing
- shadow validation

The 17-point model no longer establishes dog presence in the production engine. It receives the tracked dog ROI and supplies posture evidence.

The next pose upgrade should be a dog-specific YOLO26 pose model trained/validated on the Ultralytics Dog-Pose dataset, which defines 24 canine keypoints. Do not remove the 17-point model until that replacement passes the same real-device acceptance matrix.

## Tracking

DogTracker now supports:
- acquired
- tracking
- temporarily_lost
- reacquiring
- lost
- multiple detection candidates
- IoU-aware target selection
- smoothed box updates
- short detector gaps
- separate detection and tracking confidence

Temporary loss and reacquisition are fail-closed for rep scoring.

## ROI

The tracked box is passed to the existing pose preprocessor. The preprocessor expands the box with padding and crops a square ROI before 256x256 pose inference. Full-frame detector inference remains the first stage so dogs near frame edges can still be acquired.

## Licensing

Ultralytics documents YOLO under AGPL-3.0 and commercial licensing options. This repository does not make a legal determination about which license Good Dog Academy requires. Commercial/proprietary distribution must undergo licensing review and obtain the applicable commercial terms if required before release.

## Validation status

No real-device precision/recall, Android P50/P95, memory, thermal, battery or 20-minute stability measurements are claimed yet.

Production readiness is not claimed.
