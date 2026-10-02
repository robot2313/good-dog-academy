import 'package:flutter/material.dart';

import '../core/navigation/app_router.dart';
import '../core/theme/gda_theme.dart';

class GoodDogAcademyApp extends StatelessWidget {
  const GoodDogAcademyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Good Dog Academy',
      debugShowCheckedModeBanner: false,
      theme: GdaTheme.light(),
      routerConfig: appRouter,
    );
  }
}
