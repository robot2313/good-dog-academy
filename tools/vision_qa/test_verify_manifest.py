import copy
import hashlib
from pathlib import Path
import tempfile
import unittest
from verify_manifest import InvalidModel, verify_artifact


class ProvisioningTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.directory = Path(self.temp.name)
        (self.directory / 'fixture.onnx').write_bytes(b'not-a-real-model')
        self.model = dict(id='fixture', version='1', source_url='https://example.invalid/fixture',
            export_command='fixture only', adapter_contract='test-only',
            code_license='fixture', weights_license='fixture', training_data_provenance='fixture',
            closed_source_qa_permission='fixture', review_evidence='fixture', qa_review='approved',
            file='fixture.onnx', sha256=hashlib.sha256(b'not-a-real-model').hexdigest(),
            tensor_contract=dict(layout='NCHW', color='RGB', scaling='0..1',
                normalization='none', coordinate_system='pixels', class_or_joint_order='fixture',
                confidence='fixture', nms='none', crop='none',
                inputs=[dict(name='input', shape=[1, 3, 256, 256], dtype='float32')],
                outputs=[dict(name='output', shape=[1, 17, 512], dtype='float32')]))

    def tearDown(self):
        self.temp.cleanup()

    def test_pinned_integrity(self):
        self.assertEqual(verify_artifact(self.model, self.directory)[0].name, 'fixture.onnx')

    def test_failures(self):
        for key, value in [('qa_review','pending'), ('sha256',''), ('sha256','0'*64),
            ('file','missing.onnx'), ('file','../outside.onnx'), ('version',''),
            ('weights_license',''), ('training_data_provenance',''),
            ('closed_source_qa_permission',''), ('review_evidence','')]:
            with self.subTest(key=key, value=value):
                model = copy.deepcopy(self.model)
                model[key] = value
                with self.assertRaises(InvalidModel): verify_artifact(model, self.directory)

    def test_ambiguous_contract_rejected(self):
        for shape in ([1, -1, 6], [1, 0, 6], [True, 3, 256, 256], []):
            with self.subTest(shape=shape):
                model = copy.deepcopy(self.model)
                model['tensor_contract']['outputs'][0]['shape'] = shape
                with self.assertRaises(InvalidModel): verify_artifact(model, self.directory)


if __name__ == '__main__':
    unittest.main()
