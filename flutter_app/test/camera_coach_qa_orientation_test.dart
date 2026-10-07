import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

void main() {
  test('JPEG EXIF orientation agrees with Flutter renderer', () async {
    final source = img.Image(width: 40, height: 20);
    source.exif.imageIfd.orientation = 6;
    final bytes = img.encodeJpg(source);
    final decoded = img.bakeOrientation(img.decodeJpg(bytes)!);
    final codec = await ui.instantiateImageCodec(bytes);
    final frame = await codec.getNextFrame();
    expect(frame.image.width, decoded.width);
    expect(frame.image.height, decoded.height);
    frame.image.dispose();
    codec.dispose();
  });
}
