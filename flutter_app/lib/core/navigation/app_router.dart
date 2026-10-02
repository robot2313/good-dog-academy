import 'package:go_router/go_router.dart';

import '../../features/camera_coach/presentation/camera_coach_placeholder_screen.dart';
import '../../features/home/presentation/home_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: <RouteBase>[
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/camera-coach',
      builder: (context, state) => const CameraCoachPlaceholderScreen(),
    ),
  ],
);
