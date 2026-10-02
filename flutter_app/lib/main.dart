import 'package:flutter/material.dart';

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
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF356859),
        ),
        scaffoldBackgroundColor: const Color(0xFFFBF8F0),
      ),
      home: const MigrationShell(),
    );
  }
}

class MigrationShell extends StatelessWidget {
  const MigrationShell({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Good Dog Academy'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Icon(
                Icons.pets_rounded,
                size: 72,
              ),
              const SizedBox(height: 24),
              Text(
                'Flutter migration shell',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              Text(
                'The existing Good Dog Academy app remains preserved while '
                'the Flutter version is migrated and verified.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text(
                        'Phase 1',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Flutter shell running successfully.',
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              const Text(
                'WATCH • UNDERSTAND • COACH • REMEMBER • ADAPT',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
