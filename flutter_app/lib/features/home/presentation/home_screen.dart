import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Good Dog Academy')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            Center(
              child: Image.asset(
                'assets/branding/app-mark.png',
                width: 88,
                height: 88,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Trainer in your pocket',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'WATCH → UNDERSTAND → COACH → REMEMBER → ADAPT',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Flutter migration foundation',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Existing lessons, photography and product logic are being '
                      'ported in stages. The React Native app remains the reference '
                      'until parity gates pass.',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.go('/camera-coach'),
              child: const Text('Open Camera Coach foundation'),
            ),
          ],
        ),
      ),
    );
  }
}
