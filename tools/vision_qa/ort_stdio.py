"""Local-only CPU ONNX executor for Flutter replay. No fabricated predictions.

stdin/stdout carry paths and tensor shapes; private image bytes stay local.
Telemetry is disabled before sessions are created. Models are hash-verified.
"""
import json
from pathlib import Path
import sys
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()
from provision_model_a import checked, DETECTOR_SHA, PACKED_SHA

root = Path(sys.argv[1])
options = ort.SessionOptions()
options.intra_op_num_threads = 1
options.inter_op_num_threads = 1
sessions = {}
for role, name, digest in [('detector', 'rtmdet-tiny.onnx', DETECTOR_SHA),
                           ('pose', 'rtmpose-ap10k-packed.onnx', PACKED_SHA)]:
    checked(root / name, digest)
    sessions[role] = ort.InferenceSession(str(root / name), options,
                                        providers=['CPUExecutionProvider'])
print(json.dumps({'ready': True}), flush=True)
for line in sys.stdin:
    request = json.loads(line)
    session = sessions[request['role']]
    tensor = np.fromfile(request['input'], dtype='<f4').reshape(request['shape'])
    output, = session.run(None, {session.get_inputs()[0].name: tensor})
    if not np.isfinite(output).all():
        raise ValueError('Nonfinite ONNX output')
    output.astype('<f4').tofile(request['output'])
    print(json.dumps({'shape': list(output.shape)}), flush=True)
