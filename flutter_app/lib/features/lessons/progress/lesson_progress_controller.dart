import 'package:flutter/widgets.dart';

import '../domain/lesson_models.dart';
import 'lesson_progress_record.dart';
import 'lesson_progress_repository.dart';

class LessonProgressController extends ChangeNotifier {
  LessonProgressController({
    required this.repository,
  });

  final LessonProgressRepository repository;

  bool _loading = true;
  Object? _error;
  String? _ownerId;
  String? _dogId;
  List<LessonProgressRecord> _records =
      const <LessonProgressRecord>[];

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

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final all = await repository.loadAll();

      if (all.isEmpty) {
        _ownerId = null;
        _dogId = null;
        _records = const <LessonProgressRecord>[];
        return;
      }

      final identities = <String>{
        for (final record in all)
          '${record.ownerId}\u0000${record.dogId}',
      };

      if (identities.length != 1) {
        throw const LessonProgressSelectionException(
          'Saved progress belongs to multiple dogs. '
          'A selected dog is required before it can be displayed.',
        );
      }

      final first = all.first;

      _ownerId = first.ownerId;
      _dogId = first.dogId;
      _records = await repository.loadForDog(
        ownerId: first.ownerId,
        dogId: first.dogId,
      );
    } catch (cause) {
      _ownerId = null;
      _dogId = null;
      _records = const <LessonProgressRecord>[];
      _error = cause;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> reload() => load();
}

class LessonProgressSelectionException implements Exception {
  const LessonProgressSelectionException(this.message);

  final String message;

  @override
  String toString() =>
      'LessonProgressSelectionException: $message';
}

class LessonProgressScope
    extends InheritedNotifier<LessonProgressController> {
  const LessonProgressScope({
    super.key,
    required LessonProgressController controller,
    required super.child,
  }) : super(notifier: controller);

  static LessonProgressController? maybeOf(
    BuildContext context,
  ) {
    return context
        .dependOnInheritedWidgetOfExactType<LessonProgressScope>()
        ?.notifier;
  }

  static LessonProgressController of(
    BuildContext context,
  ) {
    final controller = maybeOf(context);

    if (controller == null) {
      throw StateError(
        'LessonProgressScope is missing above this context.',
      );
    }

    return controller;
  }
}
