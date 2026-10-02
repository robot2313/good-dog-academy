import 'package:flutter/material.dart';

import '../core/theme/gda_theme.dart';
import '../features/home/home_screen.dart';
import '../features/shared/placeholder_tab.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int currentIndex = 0;

  static const screens = [
    HomeScreen(),
    PlaceholderTab(
      title: 'Journey',
      description: 'Your training journey will be migrated here.',
      icon: Icons.route_rounded,
    ),
    PlaceholderTab(
      title: 'Categories',
      description: 'The lesson catalogue and categories will be migrated here.',
      icon: Icons.school_rounded,
    ),
    PlaceholderTab(
      title: 'Dogs',
      description: 'Dog stages, profile and personalisation will live here.',
      icon: Icons.pets_rounded,
    ),
    PlaceholderTab(
      title: 'Progress',
      description: 'Training history and progress will be migrated here.',
      icon: Icons.bar_chart,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        backgroundColor: GdaColors.surface,
        indicatorColor: GdaColors.selected,
        onDestinationSelected: (index) {
          setState(() => currentIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.route_outlined),
            selectedIcon: Icon(Icons.route_rounded),
            label: 'Journey',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school_rounded),
            label: 'Categories',
          ),
          NavigationDestination(
            icon: Icon(Icons.pets_outlined),
            selectedIcon: Icon(Icons.pets_rounded),
            label: 'Dogs',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart),
            selectedIcon: Icon(Icons.bar_chart),
            label: 'Progress',
          ),
        ],
      ),
    );
  }
}
