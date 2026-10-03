import 'package:flutter/material.dart';

import '../core/theme/gda_theme.dart';
import '../features/identity/app_identity_controller.dart';
import '../features/discovery/categories_screen.dart';
import '../features/discovery/dog_stages_screen.dart';
import '../features/home/home_screen.dart';
import '../features/journey/journey_screen.dart';
import '../features/progress/progress_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int currentIndex = 0;

  static const screens = [
    HomeScreen(),
    JourneyScreen(),
    CategoriesScreen(),
    DogStagesScreen(),
    ProgressScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: [
          for (var index = 0; index < screens.length; index++)
            KeyedSubtree(
              key: ValueKey((
                AppIdentityScope.maybeOf(context)?.selectedDogId,
                index,
              )),
              child: screens[index],
            ),
        ],
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
