class DailyPlanItemRecord {
  const DailyPlanItemRecord({
    required this.lessonId,
    required this.skill,
    required this.role,
    required this.plannedMinutes,
    required this.reasonCodes,
    required this.order,
  });

  final String lessonId;
  final String skill;
  final String role;
  final int plannedMinutes;
  final List<String> reasonCodes;
  final int order;

  Map<String, Object?> toJson() => <String, Object?>{
    'lessonId': lessonId,
    'skill': skill,
    'role': role,
    'plannedMinutes': plannedMinutes,
    'reasonCodes': reasonCodes,
    'order': order,
  };

  factory DailyPlanItemRecord.fromJson(Map<String, Object?> json) {
    final reasons = json['reasonCodes'];
    if (reasons is! List) {
      throw const DailyPlanDataException('Daily plan reasons must be a list.');
    }
    final item = DailyPlanItemRecord(
      lessonId: _requiredString(json, 'lessonId'),
      skill: _requiredString(json, 'skill'),
      role: _requiredString(json, 'role'),
      plannedMinutes: _requiredInt(json, 'plannedMinutes'),
      reasonCodes: reasons.map((value) {
        if (value is! String) {
          throw const DailyPlanDataException(
            'Daily plan reason must be a string.',
          );
        }
        return value;
      }).toList(growable: false),
      order: _requiredInt(json, 'order'),
    );
    item.validate();
    return item;
  }

  void validate() {
    if (lessonId.trim().isEmpty || skill.trim().isEmpty) {
      throw const DailyPlanDataException(
        'Daily plan item identity must not be empty.',
      );
    }
    if (role != 'primary' && role != 'reinforcement') {
      throw const DailyPlanDataException('Daily plan item role is invalid.');
    }
    if (plannedMinutes <= 0) {
      throw const DailyPlanDataException(
        'Daily plan item minutes must be positive.',
      );
    }
    if (order != 1 && order != 2) {
      throw const DailyPlanDataException('Daily plan item order is invalid.');
    }
  }
}

class DailyPlanRecord {
  const DailyPlanRecord({
    required this.id,
    required this.ownerId,
    required this.dogId,
    required this.localDate,
    required this.timezone,
    required this.targetMinutes,
    required this.estimatedMinutes,
    required this.focusSkill,
    required this.items,
    required this.status,
    required this.sourceAssessmentId,
    required this.generatedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String ownerId;
  final String dogId;
  final String localDate;
  final String timezone;
  final int targetMinutes;
  final int estimatedMinutes;
  final String focusSkill;
  final List<DailyPlanItemRecord> items;
  final String status;
  final String sourceAssessmentId;
  final String generatedAt;
  final String createdAt;
  final String updatedAt;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'ownerId': ownerId,
    'dogId': dogId,
    'localDate': localDate,
    'timezone': timezone,
    'targetMinutes': targetMinutes,
    'estimatedMinutes': estimatedMinutes,
    'focusSkill': focusSkill,
    'items': items.map((item) => item.toJson()).toList(growable: false),
    'status': status,
    'sourceAssessmentId': sourceAssessmentId,
    'generatedAt': generatedAt,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };

  factory DailyPlanRecord.fromJson(Map<String, Object?> json) {
    final itemsRaw = json['items'];
    if (itemsRaw is! List) {
      throw const DailyPlanDataException('Daily plan items must be a list.');
    }
    final plan = DailyPlanRecord(
      id: _requiredString(json, 'id'),
      ownerId: _requiredString(json, 'ownerId'),
      dogId: _requiredString(json, 'dogId'),
      localDate: _requiredString(json, 'localDate'),
      timezone: _requiredString(json, 'timezone'),
      targetMinutes: _requiredInt(json, 'targetMinutes'),
      estimatedMinutes: _requiredInt(json, 'estimatedMinutes'),
      focusSkill: _requiredString(json, 'focusSkill'),
      items: itemsRaw.map((value) {
        if (value is! Map) {
          throw const DailyPlanDataException(
            'Daily plan item must be an object.',
          );
        }
        return DailyPlanItemRecord.fromJson(value.cast<String, Object?>());
      }).toList(growable: false),
      status: _requiredString(json, 'status'),
      sourceAssessmentId: _requiredString(json, 'sourceAssessmentId'),
      generatedAt: _requiredString(json, 'generatedAt'),
      createdAt: _requiredString(json, 'createdAt'),
      updatedAt: _requiredString(json, 'updatedAt'),
    );
    plan.validate();
    return plan;
  }

  void validate() {
    if (id.trim().isEmpty ||
        ownerId.trim().isEmpty ||
        dogId.trim().isEmpty ||
        focusSkill.trim().isEmpty ||
        sourceAssessmentId.trim().isEmpty) {
      throw const DailyPlanDataException(
        'Daily plan identity fields must not be empty.',
      );
    }
    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(localDate)) {
      throw const DailyPlanDataException(
        'Daily plan local date must use YYYY-MM-DD.',
      );
    }
    if (timezone.trim().isEmpty) {
      throw const DailyPlanDataException('Daily plan timezone is required.');
    }
    if (!const <int>{5, 10, 15, 20, 30}.contains(targetMinutes)) {
      throw const DailyPlanDataException('Daily plan target is unsupported.');
    }
    if (items.isEmpty || items.length > 2) {
      throw const DailyPlanDataException(
        'Daily plan must contain one or two items.',
      );
    }
    if (items.first.role != 'primary' || items.first.order != 1) {
      throw const DailyPlanDataException(
        'Daily plan first item must be primary.',
      );
    }
    if (items.length == 2 &&
        (items[1].role != 'reinforcement' || items[1].order != 2)) {
      throw const DailyPlanDataException(
        'Daily plan second item must be reinforcement.',
      );
    }
    final lessonIds = <String>{};
    for (final item in items) {
      item.validate();
      if (!lessonIds.add(item.lessonId)) {
        throw const DailyPlanDataException(
          'Daily plan cannot contain duplicate lessons.',
        );
      }
    }
    if (estimatedMinutes !=
        items.fold<int>(0, (sum, item) => sum + item.plannedMinutes)) {
      throw const DailyPlanDataException(
        'Daily plan estimated minutes do not match its items.',
      );
    }
    if (!const <String>{'planned', 'completed', 'skipped'}.contains(status)) {
      throw const DailyPlanDataException('Daily plan status is invalid.');
    }
    for (final timestamp in <String>[generatedAt, createdAt, updatedAt]) {
      if (DateTime.tryParse(timestamp) == null) {
        throw const DailyPlanDataException('Daily plan timestamp is invalid.');
      }
    }
  }
}

class DailyPlanDataException implements Exception {
  const DailyPlanDataException(this.message);
  final String message;
  @override
  String toString() => 'DailyPlanDataException: $message';
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw DailyPlanDataException('$key must be a string.');
  }
  return value;
}

int _requiredInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int) {
    throw DailyPlanDataException('$key must be an integer.');
  }
  return value;
}
