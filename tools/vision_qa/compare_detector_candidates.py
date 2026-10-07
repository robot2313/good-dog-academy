"""Private bootstrap CPU detector probe, not an Android promotion benchmark.

D-FINE contract independently checked against LibreYOLO source
89efbe87231d2efb0ac05a329f1aeb15e90d2cbe:
preprocess/dfine.py and backends/base.py::_parse_dfine.
Both use class 16 (dog), but native preprocessing differs by model.
"""
import argparse
import hashlib
import json
from pathlib import Path
import time
import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image
ort.disable_telemetry_events()

PINNED_DFINE_SHA = '87c4deb2592f41c1c6fb29fca52323f3305740656ef031394e894b1ccb590dc0'

def run(rtm_path, dfine_path, manifest, output):
    from provision_model_a import checked, DETECTOR_SHA
    checked(rtm_path, DETECTOR_SHA)
    checked(dfine_path, PINNED_DFINE_SHA)
    options = ort.SessionOptions(); options.intra_op_num_threads = 1; options.inter_op_num_threads = 1
    sessions = {name: ort.InferenceSession(str(p), options, providers=['CPUExecutionProvider'])
                for name, p in [('RTMDet-tiny', rtm_path), ('D-FINE-N', dfine_path)]}
    frames = json.loads(manifest.read_text())['frames']
    cases = [(e['id'], np.asarray(Image.open(e['file']).convert('RGB')), e['dogPresent'], 'source-crop') for e in frames]
    original = cases[1][1]
    for scale in [320, 160, 80]:
        small = np.asarray(Image.fromarray(original).resize((scale, round(scale * original.shape[0] / original.shape[1])), Image.Resampling.BILINEAR))
        canvas = np.full((640,640,3), 114, np.uint8); h,w = small.shape[:2]
        canvas[(640-h)//2:(640-h)//2+h,(640-w)//2:(640-w)//2+w] = small
        cases.append((f'stand-derived-width-{scale}',canvas,True,'synthetic-scale-stress'))
    rows = []
    for frame_id, image, dog_present, scope in cases:
        h,w = image.shape[:2]
        for name, session in sessions.items():
            if name == 'RTMDet-tiny':
                ratio = min(640/w,640/h)
                tensor = np.full((640,640,3),114,np.float32)
                tensor[:int(h*ratio),:int(w*ratio)] = cv2.resize(image[:,:,::-1],(int(w*ratio),int(h*ratio)))
                tensor = (tensor - [103.53,116.28,123.675]) / [57.375,57.12,58.395]
            else:
                tensor = np.asarray(Image.fromarray(image).resize((640,640),Image.Resampling.BILINEAR),dtype=np.float32) / 255
            tensor = tensor.transpose(2,0,1)[None].astype(np.float32)
            times=[]
            for _ in range(6):
                before=time.perf_counter(); values=session.run(None, {'images':tensor});times.append((time.perf_counter()-before)*1000)
            if name == 'RTMDet-tiny':
                assert values[0].shape == (1,8400,84)
                score=float(values[0][0,:,20].max())
            else:
                assert values[0].shape == (1,300,80) and values[1].shape == (1,300,4)
                assert np.isfinite(values[0]).all() and np.isfinite(values[1]).all()
                score=float((1/(1+np.exp(-values[0][0,:,16].astype(np.float64)))).max())
            rows.append({'frameId':frame_id,'scope':scope,'model':name,'dogPresent':dog_present,
                         'topDogScore':score,'passesExistingAcquisitionThreshold':score>=.6,
                         'warmInferenceMs':times[1:], 'coldInferenceMs':times[0]})
    output.write_text(json.dumps({'scope':'Python CPU native preprocessing probes. No Flutter/Android D-FINE adapter or export parity certification; no model promotion',
      'D-FINE-SHA256':PINNED_DFINE_SHA,'records':rows},indent=2))

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--rtm',type=Path,required=True);p.add_argument('--dfine',type=Path,required=True)
    p.add_argument('--manifest',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    run(a.rtm,a.dfine,a.manifest,a.output)
