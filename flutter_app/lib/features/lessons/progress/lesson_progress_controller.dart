import 'package:flutter/widgets.dart';

import '../domain/lesson_models.dart';
import '../data/production_lessons.dart';
import '../logic/lesson_unlock_service.dart';
import 'lesson_progress_record.dart';
import 'lesson_progress_repository.dart';

class LessonProgressController extends ChangeNotifier {
  LessonProgressController({required this.repository});

  final LessonProgressRepository repository;

  bool _loading = true;
  Object? _error;
  String? _ownerId;
  String? _dogId;
  List<LessonProgressRecord> _records = const <LessonProgressRecord>[];

  bool get loading => _loading;

  Object? get error => _error;

  String? get ownerId => _ownerId;

  String? get dogId => _dogId;

  List<LessonProgressRecord> get records => _records;

  List<LessonProgressSnapshot> get snapshots {
    return _records
        .map((record) => record.toSnapshot())
        .toList(growable: false);
  }

  int _generation = 0;
  bool _disposed = false;

  void clear() {
    _generation++;
    _ownerId = null;
    _dogId = null;
    _records = const [];
    _error = null;
    _loading = false;
    if (!_disposed) notifyListeners();
  }

  Future<void> loadForDog({
    required String ownerId,
    required String dogId,
  }) async {
    final generation = ++_generation;
    _ownerId = ownerId;
    _dogId = dogId;
    _records = const [];
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      if (ownerId.trim().isEmpty || dogId.trim().isEmpty) {
        throw const LessonProgressSelectionException(
          'Explicit owner and dog are required.',
        );
      }
      final records = await repository.loadForDog(
        ownerId: ownerId,
        dogId: dogId,
      );
      if (_disposed || generation != _generation) return;
      // Reject catalogue inconsistencies here, so screens show a recoverable
      // error instead of throwing while resolving unlock states during build.
      const LessonUnlockService(productionLessons)
          .resolve(records.map((r) => r.toSnapshot()));
      _records = List.unmodifiable(records);
    } catch (cause) {
      if (_disposed || generation != _generation) return;
      _error = cause;
    } finally {
      if (!_disposed && generation == _generation) {
        _loading = false;
        notifyListeners();
      }
    }
  }

  Future<void> reload() async {
    final owner = _ownerId;
    final dog = _dogId;
    if (owner == null || dog == null) {
      clear();
      return;
    }
    await loadForDog(ownerId: owner, dogId: dog);
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}

class LessonProgressSelectionException implements Exception {
  const LessonProgressSelectionException(this.message);

  final String message;

  @override
  String toString() => 'LessonProgressSelectionException: $message';
}

class LessonProgressScope extends InheritedNotifier<LessonProgressController> {
  const LessonProgressScope({
    super.key,
    required LessonProgressController controller,
    required super.child,
  }) : super(notifier: controller);

  static LessonProgressController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<LessonProgressScope>()
        ?.notifier;
  }

  static LessonProgressController of(BuildContext context) {
    final controller = maybeOf(context);

    if (controller == null) {
      throw StateError('LessonProgressScope is missing above this context.');
    }

    return controller;
  }
}
