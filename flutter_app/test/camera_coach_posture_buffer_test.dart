import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/posture_buffer.dart';

PostureBufferResult _push(
  PostureBuffer buffer,
  DogPosture? posture, {
  double? confidence = 0.9,
}) => buffer.push(
  PostureObservation(posture: posture, confidence: confidence),
);

void main() {
  test('posture buffer establishes posture after three agreeing frames', () {
    final buffer = PostureBuffer();

    _push(buffer, DogPosture.sitLike);
    _push(buffer, DogPosture.sitLike);
    expect(
      _push(buffer, DogPosture.sitLike).stablePosture,
      DogPosture.sitLike,
    );
  });

  test('single observation cannot establish stable posture', () {
    final buffer = PostureBuffer();

    expect(_push(buffer, DogPosture.sitLike).stablePosture, isNull);
  });

  test('unknown and low-confidence observations are ignored', () {
    final buffer = PostureBuffer();

    _push(buffer, DogPosture.sitLike);
    _push(buffer, null);
    _push(buffer, DogPosture.standLike, confidence: 0.5);
    _push(buffer, DogPosture.sitLike);

    expect(
      _push(buffer, DogPosture.sitLike).stablePosture,
      DogPosture.sitLike,
    );
  });

  test('mixed five-frame window requires sixty percent consensus', () {
    final buffer = PostureBuffer(
      options: const PostureBufferOptions(windowSize: 5),
    );

    _push(buffer, DogPosture.sitLike);
    _push(buffer, DogPosture.standLike);
    _push(buffer, DogPosture.sitLike);
    _push(buffer, DogPosture.downLike);

    expect(
      _push(buffer, DogPosture.sitLike).stablePosture,
      DogPosture.sitLike,
    );
  });

  test('unstable window does not switch an established posture', () {
    final buffer = PostureBuffer(
      options: const PostureBufferOptions(windowSize: 5),
    );

    _push(buffer, DogPosture.sitLike);
    _push(buffer, DogPosture.sitLike);
    _push(buffer, DogPosture.sitLike);

    expect(
      _push(buffer, DogPosture.standLike).stablePosture,
      DogPosture.sitLike,
    );
    expect(
      _push(buffer, DogPosture.standLike).stablePosture,
      DogPosture.sitLike,
    );
  });

  test('new consensus emits one transition only', () {
    final buffer = PostureBuffer(
      options: const PostureBufferOptions(windowSize: 5),
    );

    _push(buffer, DogPosture.standLike);
    _push(buffer, DogPosture.standLike);
    _push(buffer, DogPosture.standLike);
    _push(buffer, DogPosture.sitLike);
    expect(_push(buffer, DogPosture.sitLike).transition, isNull);

    final changed = _push(buffer, DogPosture.sitLike);
    expect(
      changed.transition,
      const PostureTransition(
        from: DogPosture.standLike,
        to: DogPosture.sitLike,
      ),
    );

    expect(_push(buffer, DogPosture.sitLike).transition, isNull);
  });

  test('reset clears all temporal posture state', () {
    final buffer = PostureBuffer();

    _push(buffer, DogPosture.standLike);
    _push(buffer, DogPosture.standLike);
    _push(buffer, DogPosture.standLike);
    buffer.reset();

    expect(buffer.getStablePosture(), isNull);
    expect(buffer.getLastTransition(), isNull);
    expect(_push(buffer, DogPosture.sitLike).stablePosture, isNull);
  });
}
