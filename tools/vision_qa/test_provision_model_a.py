import hashlib
from pathlib import Path
import tempfile
import unittest

from provision_model_a import checked, pack_pose


class ModelAProvisioningTests(unittest.TestCase):
    def test_absent_and_corrupt_models_fail_before_onnx_load(self):
        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory) / 'model.onnx'
            with self.assertRaises(ValueError):
                checked(model, '0' * 64)
            model.write_bytes(b'not an ONNX model')
            with self.assertRaises(ValueError):
                checked(model, '0' * 64)
            checked(model, hashlib.sha256(model.read_bytes()).hexdigest())

    def test_pose_packing_requires_the_exact_original_bytes(self):
        # A checksum failure must not depend on optional ONNX tooling.
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'wrong.onnx'
            source.write_bytes(b'wrong animal or human checkpoint')
            with self.assertRaises(ValueError):
                pack_pose(source, Path(directory) / 'packed.onnx')


if __name__ == '__main__':
    unittest.main()
