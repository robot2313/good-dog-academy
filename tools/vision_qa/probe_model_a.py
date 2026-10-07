"""Reproduce a CPU ONNX/decoder smoke test; NOT phone latency or accuracy evidence.

Use an authorized local --image. The image is not uploaded or copied into Git.
Outputs are disposable tensors for check_rtm_contract.dart's real-output check.
This probe deliberately uses the strongest raw dog ROI for pose inspection;
the app still uses its unchanged 0.60 tracker threshold and may return UNKNOWN.
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()

from provision_model_a import checked, DETECTOR_SHA, POSE_SHA


def probe(directory, image_path):
    checked(directory / 'rtmdet-tiny.onnx', DETECTOR_SHA)
    checked(directory / 'end2end.onnx', POSE_SHA)
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError('Cannot decode local image')
    height, width = image.shape[:2]
    image[:, :, ::-1].copy().tofile(directory / 'probe-rgb.u8')
    ratio = min(640 / width, 640 / height)
    detector = np.full((640, 640, 3), 114, np.float32)
    detector[:int(height * ratio), :int(width * ratio)] = cv2.resize(
        image, (int(width * ratio), int(height * ratio)))
    detector = (detector - [103.53, 116.28, 123.675]) / [57.375, 57.12, 58.395]
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    session = ort.InferenceSession(str(directory / 'rtmdet-tiny.onnx'), options,
                                   providers=['CPUExecutionProvider'])
    output, = session.run(['output'], {'images': detector.transpose(2, 0, 1)[None].astype(np.float32)})
    if output.shape != (1, 8400, 84) or not np.isfinite(output).all():
        raise ValueError('Invalid detector tensor')
    output.astype('<f4').tofile(directory / 'detector-output.f32')
    row = output[0, int(output[0, :, 20].argmax())]
    if row[20] <= .25:
        raise ValueError('No raw dog candidate above .25; no pose probe performed')
    box = np.clip(row[:4], 0, 640) / ratio
    box[[0, 2]] = np.clip(box[[0, 2]], 0, width)
    box[[1, 3]] = np.clip(box[[1, 3]], 0, height)
    if box[2] <= box[0] or box[3] <= box[1]:
        raise ValueError('Invalid dog ROI')
    center = (box[:2] + box[2:]) / 2
    side = max(box[2:] - box[:2]) * 1.25
    matrix = np.array([[256 / side, 0, 128 - center[0] * 256 / side],
                       [0, 256 / side, 128 - center[1] * 256 / side]])
    crop = cv2.warpAffine(image, matrix, (256, 256))
    tensor = ((crop[:, :, ::-1].astype(np.float32) - [123.675, 116.28, 103.53]) /
              [58.395, 57.12, 57.375]).transpose(2, 0, 1)[None].astype(np.float32)
    pose = ort.InferenceSession(str(directory / 'end2end.onnx'), options,
                               providers=['CPUExecutionProvider'])
    x, y = pose.run(['simcc_x', 'simcc_y'], {'input': tensor})
    if x.shape != (1, 17, 512) or y.shape != x.shape or not (
            np.isfinite(x).all() and np.isfinite(y).all()):
        raise ValueError('Invalid pose tensor')
    x.astype('<f4').tofile(directory / 'simcc-x.f32')
    y.astype('<f4').tofile(directory / 'simcc-y.f32')
    xy = np.stack([x.argmax(-1), y.argmax(-1)], -1)[0] / 512 * side + center - side / 2
    scores = np.minimum(x.max(-1), y.max(-1))[0]
    report = {'width': width, 'height': height, 'box': box.tolist(),
              'score': float(row[20]), 'pose_xy': xy.tolist(),
              'pose_scores': scores.tolist(), 'device_tested': False,
              'app_tracker_would_accept': bool(row[20] >= .60),
              'scope': 'Single-image raw ROI ONNX probe, not end-to-end Flutter validation'}
    (directory / 'probe.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--models', type=Path, required=True)
    parser.add_argument('--image', type=Path, required=True)
    args = parser.parse_args()
    probe(args.models, args.image)
