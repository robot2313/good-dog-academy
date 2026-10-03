import 'package:flutter/material.dart';

class LessonSessionScreen extends StatelessWidget {
  const LessonSessionScreen({
    super.key,
    required this.lessonId,
    required this.allowPrerequisiteBypass,
  });

  final String lessonId;
  final bool allowPrerequisiteBypass;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Guided lesson')),
    body: const SafeArea(
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Guided session migration is the next dependency.'),
        ),
      ),
    ),
  );
}
