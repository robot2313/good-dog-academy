import 'package:flutter/material.dart';

abstract final class GdaColors {
  static const Color canvas = Color(0xFFFAF7F0);
  static const Color subtle = Color(0xFFF4F0E8);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color selected = Color(0xFFEDF5E9);
  static const Color forest = Color(0xFF1D6337);
  static const Color primary = Color(0xFF2F8148);
  static const Color gold = Color(0xFFD99A22);
  static const Color textPrimary = Color(0xFF0B2545);
  static const Color textSecondary = Color(0xFF66707C);
  static const Color border = Color(0xFFE4DED3);
}

abstract final class GdaTheme {
  static ThemeData light() {
    final ColorScheme scheme = ColorScheme.fromSeed(
      seedColor: GdaColors.primary,
      brightness: Brightness.light,
      surface: GdaColors.surface,
    ).copyWith(
      primary: GdaColors.primary,
      onPrimary: Colors.white,
      surface: GdaColors.surface,
      onSurface: GdaColors.textPrimary,
      outline: GdaColors.border,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: GdaColors.canvas,
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: GdaColors.canvas,
        foregroundColor: GdaColors.textPrimary,
        elevation: 0,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          color: GdaColors.textPrimary,
          fontSize: 26,
          height: 32 / 26,
          fontWeight: FontWeight.w900,
        ),
        titleMedium: TextStyle(
          color: GdaColors.textPrimary,
          fontSize: 15,
          height: 20 / 15,
          fontWeight: FontWeight.w900,
        ),
        bodyMedium: TextStyle(
          color: GdaColors.textPrimary,
          fontSize: 13,
          height: 19 / 13,
        ),
        bodySmall: TextStyle(
          color: GdaColors.textSecondary,
          fontSize: 12,
          height: 17 / 12,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(9),
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: GdaColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: GdaColors.border),
        ),
      ),
    );
  }
}
