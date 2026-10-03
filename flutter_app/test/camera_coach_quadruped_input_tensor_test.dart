import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_input_tensor.dart';

void main() {
  test('creates channel-first raw RGB tensor without normalization', () {
    final plane = quadrupedInputSize * quadrupedInputSize;
    final pixels = Uint8List(plane * 4);
    for (var index = 0; index < plane; index++) {
      final source = index * 4;
      pixels[source] = 124;
      pixels[source + 1] = 116;
      pixels[source + 2] = 104;
      pixels[source + 3] = 255;
    }

    final tensor = rgbBytesToQuadrupedTensor(
      pixels,
      width: quadrupedInputSize,
      height: quadrupedInputSize,
      channels: 4,
    );

    expect(tensor, hasLength(3 * plane));
    expect(tensor[0], 124);
    expect(tensor[plane], 116);
    expect(tensor[plane * 2], 104);
  });

  test('accepts three-channel RGB bytes', () {
    final plane = quadrupedInputSize * quadrupedInputSize;
    final pixels = Uint8List(plane * 3);
    pixels[0] = 10;
    pixels[1] = 20;
    pixels[2] = 30;

    final tensor = rgbBytesToQuadrupedTensor(
      pixels,
      width: quadrupedInputSize,
      height: quadrupedInputSize,
      channels: 3,
    );

    expect(tensor[0], 10);
    expect(tensor[plane], 20);
    expect(tensor[plane * 2], 30);
  });

  test('rejects input that is not 256 by 256', () {
    expect(
      () => rgbBytesToQuadrupedTensor(
        Uint8List(3),
        width: 1,
        height: 1,
        channels: 3,
      ),
      throwsArgumentError,
    );
  });

  test('rejects unsupported channel counts', () {
    final plane = quadrupedInputSize * quadrupedInputSize;
    expect(
      () => rgbBytesToQuadrupedTensor(
        Uint8List(plane),
        width: quadrupedInputSize,
        height: quadrupedInputSize,
        channels: 1,
      ),
      throwsArgumentError,
    );
  });

  test('rejects byte length that does not match image shape', () {
    final plane = quadrupedInputSize * quadrupedInputSize;
    expect(
      () => rgbBytesToQuadrupedTensor(
        Uint8List(plane * 3 - 1),
        width: quadrupedInputSize,
        height: quadrupedInputSize,
        channels: 3,
      ),
      throwsArgumentError,
    );
  });
}
