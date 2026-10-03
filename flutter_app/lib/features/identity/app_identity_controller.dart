import 'package:flutter/widgets.dart';

import 'app_identity_record.dart';
import 'app_identity_repository.dart';

class AppIdentityController extends ChangeNotifier {
  AppIdentityController({required this.repository});
  final AppIdentityRepository repository;
  AppIdentityState _state = const AppIdentityState.empty();
  bool loading = true;
  bool saving = false;
  bool loaded = false;
  bool _disposed = false;
  bool _reading = false;
  Object? error;
  AppIdentityState get state => _state;
  AppOwnerRecord? get owner => _state.owner;
  List<AppDogRecord> get dogs => _state.dogs;
  String? get selectedDogId => _state.selectedDogId;
  AppDogRecord? get selectedDog => _state.selectedDog;
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> load() async {
    if (saving || _reading) return;
    _reading = true;
    loading = true;
    loaded = false;
    error = null;
    _notify();
    try {
      _state = await repository.load();
      loaded = true;
    } catch (cause) {
      error = cause;
    }
    _reading = false;
    loading = false;
    _notify();
  }

  Future<void> reload() => load();

  Future<bool> selectDog(String dogId) async {
    if (!loaded || loading || saving) return false;
    try {
      final next = AppIdentityState(
        owner: owner,
        dogs: dogs,
        selectedDogId: dogId,
      );
      next.validate();
      if (owner == null || next.selectedDog == null) {
        throw StateError('Select an owned dog.');
      }
      return await replace(next);
    } catch (cause) {
      error = cause;
      _notify();
      return false;
    }
  }

  Future<bool> replace(AppIdentityState next) async {
    if (!loaded || loading || saving) return false;
    saving = true;
    error = null;
    _notify();
    try {
      next.validate();
      final snapshot = AppIdentityState(
        owner: next.owner,
        dogs: List.unmodifiable(next.dogs),
        selectedDogId: next.selectedDogId,
      );
      await repository.save(snapshot);
      _state = snapshot;
      return true;
    } catch (cause) {
      error = cause;
      return false;
    } finally {
      saving = false;
      _notify();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}

class AppIdentityScope extends InheritedNotifier<AppIdentityController> {
  const AppIdentityScope({
    super.key,
    required AppIdentityController controller,
    required super.child,
  }) : super(notifier: controller);
  static AppIdentityController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppIdentityScope>()?.notifier;
  static AppIdentityController of(BuildContext context) => maybeOf(context)!;
}
