import 'package:flutter/material.dart';

class CameraCoachPlaceholderScreen extends StatelessWidget {
  const CameraCoachPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Camera Coach')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            Text(
              'WATCH → UNDERSTAND → COACH',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            const Text(
              'Flutter shell created. The production vision runtime will plug into '
              'the vendor-neutral VisionEngine contract rather than being embedded '
              'directly into this screen.',
            ),
            const SizedBox(height: 20),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Text(
                  'Target pipeline:\n\n'
                  'Camera → detector → tracker → tracked dog ROI → dog pose → '
                  'temporal smoothing → behaviour classification → rep state '
                  'machine → coaching → learning/adaptation',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
