import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/temporal_rep_gate.dart';

void main() {
  test('gate allows one clean entry into expected posture', () {
    final gate = TemporalRepGate();
    gate.beginCue('cue-1', DogPosture.sitLike);

    expect(
      gate.observe(DogPosture.sitLike, DogPosture.sitLike).readyToScore,
      isTrue,
    );
    expect(
      gate.observe(DogPosture.sitLike, DogPosture.sitLike).readyToScore,
      isFalse,
    );
  });

  test('next cue requires departure and re-entry when posture is held', () {
    final gate = TemporalRepGate();
    gate.beginCue('cue-1', DogPosture.sitLike);
    expect(
      gate.observe(DogPosture.sitLike, DogPosture.sitLike).readyToScore,
      isTrue,
    );

    gate.beginCue('cue-2', DogPosture.sitLike);
    expect(
      gate
          .observe(DogPosture.sitLike, DogPosture.sitLike)
          .waitingForTransition,
      isTrue,
    );
    expect(
      gate.observe(DogPosture.standLike, DogPosture.sitLike).readyToScore,
      isFalse,
    );
    expect(
      gate.observe(DogPosture.sitLike, DogPosture.sitLike).readyToScore,
      isTrue,
    );
  });

  test('wrong posture never scores the rep', () {
    final gate = TemporalRepGate();
    gate.beginCue('cue-1', DogPosture.downLike);

    expect(
      gate.observe(DogPosture.sitLike, DogPosture.downLike).readyToScore,
      isFalse,
    );
    expect(
      gate.observe(DogPosture.downLike, DogPosture.downLike).readyToScore,
      isTrue,
    );
  });

  test('reset clears previous posture and cue history', () {
    final gate = TemporalRepGate();
    gate.beginCue('cue-1', DogPosture.sitLike);
    gate.observe(DogPosture.sitLike, DogPosture.sitLike);
    gate.reset();

    gate.beginCue('cue-2', DogPosture.sitLike);
    expect(
      gate.observe(DogPosture.sitLike, DogPosture.sitLike).readyToScore,
      isTrue,
    );
  });
}
