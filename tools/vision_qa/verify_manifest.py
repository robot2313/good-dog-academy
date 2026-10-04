"""Offline, fail-closed QA artifact checks. Never downloads or approves a model.

Usage: python tools/vision_qa/verify_manifest.py manifest.json
A successful check is integrity/metadata verification, NOT legal or production approval.
Runtime adapters and golden ONNX parity tests remain mandatory before registration.
"""
import hashlib
import json
from pathlib import Path
import re
import sys


class InvalidModel(ValueError):
    pass


def nonempty(value, field):
    if not isinstance(value, str) or not value.strip():
        raise InvalidModel(f"Missing {field}")
    return value


def verify_artifact(model, directory):
    for key in ("id", "version", "source_url", "export_command", "adapter_contract"):
        nonempty(model.get(key), key)
    if not model["source_url"].startswith("https://"):
        raise InvalidModel("Source must be an exact HTTPS artifact URL")
    for key in ("code_license", "weights_license", "training_data_provenance",
                "closed_source_qa_permission", "review_evidence"):
        nonempty(model.get(key), key)
    if model.get("qa_review") != "approved":
        raise InvalidModel(f"{model['id']}: QA licensing review has not passed")
    digest = model.get("sha256", "")
    if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
        raise InvalidModel("Expected a pinned SHA-256; filenames are not checksums")
    path = (directory / nonempty(model.get("file"), "file")).resolve()
    if not path.is_relative_to(directory.resolve()):
        raise InvalidModel("Model path must stay inside the provisioning directory")
    if not path.is_file():
        raise InvalidModel(f"Missing model file: {path.name}")
    with path.open("rb") as source:
        actual = hashlib.file_digest(source, "sha256").hexdigest()
    if actual != digest:
        raise InvalidModel(f"Checksum mismatch for {path.name}")
    contract = model.get("tensor_contract")
    if not isinstance(contract, dict):
        raise InvalidModel("Missing tensor contract")
    for key in ("layout", "color", "scaling", "normalization", "coordinate_system",
                "class_or_joint_order", "confidence", "nms", "crop"):
        nonempty(contract.get(key), key)
    for role in ("inputs", "outputs"):
        tensors = contract.get(role)
        if not isinstance(tensors, list) or not tensors:
            raise InvalidModel(f"Missing {role}")
        names = set()
        for tensor in tensors:
            name = nonempty(tensor.get("name"), "tensor name")
            if name in names:
                raise InvalidModel("Duplicate tensor name")
            names.add(name)
            if tensor.get("dtype") not in ("float32", "int64"):
                raise InvalidModel("Unsupported tensor dtype")
            shape = tensor.get("shape")
            if not isinstance(shape, list) or not shape or any(
                type(n) is not int or n <= 0 for n in shape
            ):
                raise InvalidModel("Pin concrete positive tensor dimensions")
    return path, contract


def verify_onnx(path, contract):
    try:
        import onnx
    except ImportError as exc:
        raise InvalidModel("ONNX inspection unavailable: install reviewed build tooling first") from exc
    graph = onnx.load(str(path), load_external_data=False)
    onnx.checker.check_model(graph)
    for tensor in graph.graph.initializer:
        if tensor.data_location == onnx.TensorProto.EXTERNAL:
            raise InvalidModel("External ONNX data is not supported by this provisioner")
    for role, values in (("inputs", graph.graph.input), ("outputs", graph.graph.output)):
        actual = []
        for item in values:
            tensor = item.type.tensor_type
            dtype = {onnx.TensorProto.FLOAT: "float32", onnx.TensorProto.INT64: "int64"}.get(tensor.elem_type)
            actual.append({"name": item.name, "dtype": dtype,
                           "shape": [dim.dim_value for dim in tensor.shape.dim]})
        if actual != contract[role]:
            raise InvalidModel(f"ONNX {role} mismatch: {actual}")


def verify(manifest_path):
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("schema_version") != 1 or manifest.get("production_approved") is not False:
        raise InvalidModel("QA manifest must have schema_version=1 and production_approved=false")
    models = manifest.get("models")
    if not isinstance(models, list) or len(models) != 2:
        raise InvalidModel("A stack requires exactly one detector and one animal pose model")
    if {m.get("role") for m in models} != {"detector", "animal_pose"}:
        raise InvalidModel("Expected detector and animal_pose roles; human pose is not supported")
    for model in models:
        path, contract = verify_artifact(model, manifest_path.parent)
        verify_onnx(path, contract)
    return manifest


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise InvalidModel("Supply an explicit local manifest.json path")
        verify(Path(sys.argv[1]))
        print("QA artifact integrity verified. Runtime parity, device testing and production approval remain separate.")
    except (InvalidModel, OSError, ValueError, TypeError, KeyError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        sys.exit(1)
