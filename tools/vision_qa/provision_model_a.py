"""Provision the pinned PRIVATE QA stack; never changes production readiness.

Requires onnx==1.23.1, onnxruntime==1.30.0 and numpy. Downloads only published
artifacts over HTTPS, verifies bytes BEFORE parsing, and retains license notices.
Use --cache for downloads and --output for a temporary Android project's assets.
The caller adds that asset directory ONLY to the engineering build's pubspec.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request
import zipfile

DETECTOR_SHA = 'a6f06381c68334f09e134d8ca7e062f4e756eaf662bb110752e80b7290470b5e'
POSE_SHA = '1cfd1c86e0d9e5d5f95178bcd95ee9a4e8386a624cd3c57519f27ff58cac7f28'
PACKED_SHA = '8f8b474bc0009e9e023897e5999e67ac3ed583f412b1ed0571234c4bb661c32e'
ARCHIVE_SHA = '2d75445331cf2f21d6e164430f96ffa765cd874872965ae1736932dda03987f0'
DETECTOR_URL = 'https://huggingface.co/LibreYOLO/LibreRTMDett/resolve/3ec02bbafa331cfdb1b7387e212cd515299aa9ea/LibreRTMDett.onnx'
POSE_URL = 'https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/rtmpose-m_simcc-ap10k_pt-aic-coco_210e-256x256-7a041aa1_20230206.zip'
VERSION = 'libre-3ec02bb-ap10k-7a041aa1-packed-v1'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def checked(path, expected):
    if not path.is_file() or digest(path) != expected:
        raise ValueError(f'Missing or corrupt model: {path.name}')


def download(url, path, expected=None):
    if path.exists():
        if expected:
            checked(path, expected)
        return
    temporary = path.with_suffix(path.suffix + '.partial')
    try:
        with urllib.request.urlopen(url, timeout=60) as response, temporary.open('wb') as target:
            if not response.url.startswith('https://'):
                raise ValueError('Refusing insecure model redirect')
            shutil.copyfileobj(response, target)
        if expected:
            checked(temporary, expected)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def pack_pose(source, target):
    checked(source, POSE_SHA)
    import onnx
    import onnxruntime as ort
    import numpy as np
    graph = onnx.load(source, load_external_data=False)
    # The SDK JSON incorrectly says 192x256. The checked graph and the original
    # AP-10K config both say 256x256. We do not use the SDK's transforms.
    graph.graph.node.append(onnx.helper.make_node(
        'Concat', ['simcc_x', 'simcc_y'], ['simcc_xy'], axis=1))
    del graph.graph.output[:]
    graph.graph.output.append(onnx.helper.make_tensor_value_info(
        'simcc_xy', onnx.TensorProto.FLOAT, ['batch', 34, 512]))
    onnx.checker.check_model(graph)
    onnx.save(graph, target)
    checked(target, PACKED_SHA)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    original = ort.InferenceSession(str(source), options, providers=['CPUExecutionProvider'])
    packed = ort.InferenceSession(str(target), options, providers=['CPUExecutionProvider'])
    for tensor in [np.zeros((1, 3, 256, 256), np.float32),
                   np.random.default_rng(2313).normal(size=(1, 3, 256, 256)).astype(np.float32)]:
        x, y = original.run(['simcc_x', 'simcc_y'], {'input': tensor})
        output, = packed.run(['simcc_xy'], {'input': tensor})
        if x.shape != (1, 17, 512) or y.shape != x.shape:
            raise ValueError('Unexpected AP-10K joint count or SimCC shape')
        np.testing.assert_array_equal(output, np.concatenate([x, y], axis=1))


def provision(cache, output):
    cache.mkdir(parents=True, exist_ok=True)
    download(DETECTOR_URL, cache / 'rtmdet-tiny.onnx', DETECTOR_SHA)
    download(POSE_URL, cache / 'rtmpose-ap10k.zip', ARCHIVE_SHA)
    with zipfile.ZipFile(cache / 'rtmpose-ap10k.zip') as archive:
        entries = [n for n in archive.namelist() if n.endswith('/end2end.onnx')]
        if len(entries) != 1:
            raise ValueError('Ambiguous pose archive')
        (cache / 'end2end.onnx').write_bytes(archive.read(entries[0]))
    checked(cache / 'end2end.onnx', POSE_SHA)
    pack_pose(cache / 'end2end.onnx', cache / 'rtmpose-ap10k-packed.onnx')
    # These notices are informational, never used as proof of artifact identity.
    base = DETECTOR_URL.rsplit('/', 1)[0]
    download(base + '/LICENSE', cache / 'RTMDet-LICENSE')
    download(base + '/NOTICE', cache / 'RTMDet-NOTICE')
    download('https://raw.githubusercontent.com/open-mmlab/mmpose/v1.1.0/LICENSE', cache / 'MMPose-LICENSE')
    output.mkdir(parents=True, exist_ok=True)
    for name in ['rtmdet-tiny.onnx', 'rtmpose-ap10k-packed.onnx',
                 'RTMDet-LICENSE', 'RTMDet-NOTICE', 'MMPose-LICENSE']:
        shutil.copyfile(cache / name, output / name)
    metadata = {'id': 'rtmdet-tiny-rtmpose-m-ap10k', 'version': VERSION,
                'production_approved': False, 'usage': 'private-engineering-qa',
                'detector_sha256': DETECTOR_SHA, 'pose_sha256': PACKED_SHA,
                'original_pose_sha256': POSE_SHA,
                'detector_source': DETECTOR_URL, 'pose_source': POSE_URL,
                'rights_note': 'Published Apache-2.0 projects; private evaluation only. '
                    'Commercial redistribution and ImageNet/AIC/COCO image-rights review remain unresolved.',
                'pose_export_change': 'Concat x then y on axis 1; dynamic batch retained; runtime accepts only 1; bit-exact parity checked.'}
    (output / 'manifest.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'Private QA files verified: {output}. Production remains disabled.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    provision(args.cache, args.output)
