import 'package:flutter/material.dart';

abstract final class GdaColors {
  static const canvas = Color(0xFFFAF7F0);
  static const subtle = Color(0xFFF4F0E8);

  static const surface = Color(0xFFFFFFFF);
  static const selected = Color(0xFFEDF5E9);

  static const forest = Color(0xFF1D6337);
  static const primary = Color(0xFF2F8148);
  static const gold = Color(0xFFD99A22);

  static const text = Color(0xFF0B2545);
  static const muted = Color(0xFF66707C);

  static const border = Color(0xFFE4DED3);
}

abstract final class GdaTheme {
  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: GdaColors.primary,
      brightness: Brightness.light,
      surface: GdaColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme.copyWith(
        primary: GdaColors.primary,
        onPrimary: Colors.white,
        surface: GdaColors.surface,
        onSurface: GdaColors.text,
      ),
      scaffoldBackgroundColor: GdaColors.canvas,
      appBarTheme: const AppBarTheme(
        backgroundColor: GdaColors.canvas,
        foregroundColor: GdaColors.text,
        elevation: 0,
        centerTitle: false,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontSize: 26,
          height: 32 / 26,
          fontWeight: FontWeight.w900,
          color: GdaColors.text,
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: GdaColors.text,
        ),
        titleMedium: TextStyle(
          fontSize: 15,
          height: 20 / 15,
          fontWeight: FontWeight.w900,
          color: GdaColors.text,
        ),
        bodyMedium: TextStyle(
          fontSize: 13,
          height: 19 / 13,
          color: GdaColors.text,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          height: 17 / 12,
          color: GdaColors.muted,
        ),
      ),
      cardTheme: const CardThemeData(
        color: GdaColors.surface,
        elevation: 1,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: GdaColors.border),
        ),
      ),
    );
  }
}
