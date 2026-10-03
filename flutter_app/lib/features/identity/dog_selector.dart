import 'package:flutter/material.dart';

import 'app_identity_controller.dart';

class DogSelector extends StatelessWidget {
  const DogSelector({super.key});
  @override
  Widget build(BuildContext context) {
    final identity = AppIdentityScope.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final dog in identity.dogs)
          ListTile(
            leading: const Icon(Icons.pets),
            title: Text(dog.name),
            subtitle: Text(
              dog.id == identity.selectedDogId
                  ? 'Active dog'
                  : 'Switch to this dog',
            ),
            selected: dog.id == identity.selectedDogId,
            enabled: !identity.saving,
            onTap: () async {
              await identity.selectDog(dog.id);
            },
          ),
        if (identity.saving) const LinearProgressIndicator(),
        if (identity.error != null)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Your selection could not be saved. Your previous dog remains active. Try again.',
            ),
          ),
      ],
    );
  }
}
