import 'dart:io';

import 'package:flutter/material.dart';

/// Rendering an existing URI never changes or deletes the stored photo.
class DogAvatar extends StatelessWidget {
  const DogAvatar({super.key, required this.photoUri});
  final String? photoUri;
  @override
  Widget build(BuildContext context) {
    const fallback = Icon(Icons.pets_rounded);
    final uri = photoUri == null ? null : Uri.tryParse(photoUri!);
    Widget photo = fallback;
    if (uri != null) {
      if (uri.scheme == 'https' || uri.scheme == 'http') {
        photo = Image.network(
          uri.toString(),
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => fallback,
        );
      } else if (uri.scheme == 'file' ||
          (uri.scheme.isEmpty && uri.path.startsWith('/'))) {
        try {
          photo = Image.file(
            uri.scheme == 'file' ? File.fromUri(uri) : File(uri.path),
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => fallback,
          );
        } catch (_) {
          photo = fallback;
        }
      }
    }
    return ClipOval(child: SizedBox(width: 46, height: 46, child: photo));
  }
}
