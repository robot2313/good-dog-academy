import 'package:flutter/material.dart';

import 'core/theme/gda_theme.dart';
import 'navigation/main_shell.dart';

void main() {
  runApp(const GoodDogAcademyApp());
}

class GoodDogAcademyApp extends StatelessWidget {
  const GoodDogAcademyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Good Dog Academy',
      theme: GdaTheme.light,
      home: const MainShell(),
    );
  }
}
