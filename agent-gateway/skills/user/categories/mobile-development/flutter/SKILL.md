---
name: flutter
description: Google's UI toolkit for building natively compiled applications
category: mobile-development
difficulty: intermediate
tags: [mobile, dart, cross-platform, google]
author: Google
version: 3.17
last_updated: 2024-01-15
---

# Flutter

## What I Do

I am Flutter, Google's open-source UI toolkit for building natively compiled applications for mobile, web, and desktop from a single codebase. I use Dart as my programming language and render everything myself using a high-performance 2D rendering engine called Skia. My reactive framework enables building UIs with stateless and stateful widgets that represent the visual elements of the application. I provide a comprehensive set of Material Design and Cupertino (iOS-style) widgets. My hot reload feature allows instant feedback during development. I compile to native ARM or Intel machine code for mobile, and to JavaScript for web deployment. My layered architecture enables customization at every level from the fundamental widgets to the rendering layer.

## When to Use Me

- Building cross-platform apps for iOS, Android, web, and desktop
- Teams valuing high-performance, native-like experiences
- Projects requiring custom, pixel-perfect designs
- Rapid development with hot reload
- Apps with complex animations and visual effects
- Startups needing fast iterations on both platforms
- Desktop applications alongside mobile
- Embedded device interfaces

## Core Concepts

**Widgets**: Immutable UI building blocks representing visual and behavioral properties.

**State Management**: Options include Provider, Riverpod, Bloc, GetX, and Redux for managing app state.

**Layout System**: Rich layout widgets (Row, Column, Stack, Flex) using constraints-based layout.

**Platform Channels**: Communication between Dart code and native platform APIs.

**Flutter Driver/Integration Tests**: Testing framework for widget and integration tests.

**Build Modes**: Debug, Profile, and Release modes for development, profiling, and production.

**Packages & Plugins**: Pub.dev ecosystem for dependencies and native integrations.

## Code Examples

### Example 1: Flutter Widgets with State Management
```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserListViewModel()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Users',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const UserListScreen(),
    );
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String avatarUrl;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      avatarUrl: json['avatarUrl'] ?? '',
    );
  }
}

class UserListViewModel with ChangeNotifier {
  List<User> _users = [];
  bool _isLoading = false;
  String? _error;

  List<User> get users => _users;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchUsers() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.get(Uri.parse('https://api.example.com/users'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        _users = data.map((json) => User.fromJson(json)).toList();
      } else {
        _error = 'Failed to load users: ${response.statusCode}';
      }
    } catch (e) {
      _error = 'Error: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    _users = [];
    await fetchUsers();
  }
}

class UserListScreen extends StatelessWidget {
  const UserListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Users'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<UserListViewModel>().refresh(),
          ),
        ],
      ),
      body: Consumer<UserListViewModel>(
        builder: (context, viewModel, child) {
          if (viewModel.isLoading && viewModel.users.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (viewModel.error != null && viewModel.users.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(viewModel.error!, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => viewModel.fetchUsers(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => viewModel.refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: viewModel.users.length,
              itemBuilder: (context, index) {
                final user = viewModel.users[index];
                return UserCard(user: user);
              },
            ),
          );
        },
      ),
    );
  }
}

class UserCard extends StatelessWidget {
  final User user;

  const UserCard({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: user.avatarUrl.isNotEmpty
              ? NetworkImage(user.avatarUrl)
              : null,
          child: user.avatarUrl.isEmpty
              ? Text(user.name[0].toUpperCase())
              : null,
        ),
        title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(user.email),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => UserDetailScreen(userId: user.id),
            ),
          );
        },
      ),
    );
  }
}
```

### Example 2: Custom Painting and Animations
```dart
// custom_paint_widget.dart
import 'package:flutter/material.dart';

class WaveProgressIndicator extends StatefulWidget {
  final double progress;
  final Color waveColor;
  final double size;

  const WaveProgressIndicator({
    super.key,
    required this.progress,
    this.waveColor = Colors.blue,
    this.size = 200,
  });

  @override
  State<WaveProgressIndicator> createState() => _WaveProgressIndicatorState();
}

class _WaveProgressIndicatorState extends State<WaveProgressIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    _animation = Tween<double>(begin: 0, end: 1).animate(_controller);
  }

  @override
  void didUpdateWidget(WaveProgressIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: WavePainter(
            progress: widget.progress,
            waveAnimation: _animation.value,
            color: widget.waveColor,
          ),
        );
      },
    );
  }
}

class WavePainter extends CustomPainter {
  final double progress;
  final double waveAnimation;
  final Color color;

  WavePainter({
    required this.progress,
    required this.waveAnimation,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.6)
      ..style = PaintingStyle.fill;

    final path = Path();
    final waveHeight = 8.0;
    final baseHeight = size.height * (1 - progress);

    path.moveTo(0, baseHeight);

    for (double x = 0; x <= size.width; x += 1) {
      final y = baseHeight +
          math.sin((x / size.width * 2 * math.pi) + (waveAnimation * 2 * math.pi)) *
              waveHeight;
      path.lineTo(x, y);
    }

    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(WavePainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.waveAnimation != waveAnimation;
  }
}

// Animated container example
class AnimatedCard extends StatefulWidget {
  const AnimatedCard({super.key});

  @override
  State<AnimatedCard> createState() => _AnimatedCardState();
}

class _AnimatedCardState extends State<AnimatedCard> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        width: _isExpanded ? 200 : 150,
        height: _isExpanded ? 200 : 150,
        decoration: BoxDecoration(
          color: Colors.blue,
          borderRadius: BorderRadius.circular(_isExpanded ? 24 : 12),
          boxShadow: [
            BoxShadow(
              color: Colors.blue.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: InkWell(
          onTap: () => setState(() => _isExpanded = !_isExpanded),
          child: Center(
            child: Text(
              _isExpanded ? 'Tap to Collapse' : 'Tap to Expand',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

### Example 3: Platform Channels for Native Code
```dart
// platform_channel.dart
import 'package:flutter/services.dart';

class BatteryService {
  static const MethodChannel _channel = MethodChannel('battery_service');

  static Future<int> getBatteryLevel() async {
    try {
      final int result = await _channel.invokeMethod('getBatteryLevel');
      return result;
    } on PlatformException catch (e) {
      throw 'Failed to get battery level: ${e.message}';
    }
  }

  static Future<bool> isBatteryLow({int threshold = 20}) async {
    final level = await getBatteryLevel();
    return level <= threshold;
  }
}

// iOS implementation (battery_service.swift)
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    let controller = window?.rootViewController as! FlutterViewController
    let batteryChannel = FlutterMethodChannel(
      name: "battery_service",
      binaryMessenger: controller.binaryMessenger
    )
    
    batteryChannel.setMethodCallHandler { [weak self] call, result in
      switch call.method {
      case "getBatteryLevel":
        self?.getBatteryLevel(result: result)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  private func getBatteryLevel(result: @escaping FlutterResult) {
    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = Int(UIDevice.current.batteryLevel * 100)
    result(level)
  }
}

// Android implementation (BatteryService.kt)
package com.example.flutter_app

import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodChannel
import android.content.Context
import android.os.BatteryManager

class MainActivity: FlutterPlugin {
  private lateinit var channel: MethodChannel

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel = MethodChannel(binding.binaryMessenger, "battery_service")
    channel.setMethodCallHandler { call, result ->
      when (call.method) {
        "getBatteryLevel" -> {
          val batteryManager = binding.applicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
          val level = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
          result.success(level)
        }
        else -> result.notImplemented()
      }
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel.setMethodCallHandler(null)
  }
}
```

### Example 4: Riverpod State Management
```dart
// providers.dart
import 'package:riverpod/riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class User {
  final String id;
  final String name;
  final String email;

  User({required this.id, required this.name, required this.email});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
    );
  }
}

class ApiService {
  final http.Client client;

  ApiService({required this.client});

  Future<List<User>> fetchUsers() async {
    final response = await client.get(Uri.parse('https://api.example.com/users'));
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => User.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load users');
    }
  }
}

final apiServiceProvider = Provider((ref) => ApiService(client: http.Client()));

final userListProvider = FutureProvider<List<User>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.fetchUsers();
});

// Using the provider
class UserListScreen extends ConsumerWidget {
  const UserListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(userListProvider);

    return Scaffold(
      body: usersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (users) => ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, index) {
            final user = users[index];
            return ListTile(
              title: Text(user.name),
              subtitle: Text(user.email),
            );
          },
        ),
      ),
    );
  }
}
```

### Example 5: Navigation and Deep Linking
```dart
// navigation.dart
import 'package:flutter/material.dart';

class AppRouter {
  static const String home = '/';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String userDetail = '/user/:userId';
  static const String deepLinkTest = '/deeplink';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      case userDetail:
        final userId = settings.arguments as String;
        return MaterialPageRoute(
          builder: (_) => UserDetailScreen(userId: userId),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('Route not found: ${settings.name}')),
          ),
        );
    }
  }
}

// Deep linking configuration
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(
    ProviderScope(
      child: MaterialApp(
        navigatorKey: navigatorKey,
        initialRoute: AppRouter.home,
        onGenerateRoute: AppRouter.generateRoute,
        onUnknownRoute: (settings) => MaterialPageRoute(
          builder: (_) => const UnknownRouteScreen(),
        ),
      ),
    ),
  );
}

// Navigate with arguments
void navigateToUserDetail(String userId) {
  navigatorKey.currentState?.pushNamed(
    AppRouter.userDetail,
    arguments: userId,
  );
}

// Get current route
String? getCurrentRoute() {
  return navigatorKey.currentState?.restorablePush(_getRoute);
}
```

## Best Practices

- Use StatefulWidget only when necessary; prefer stateless widgets with providers
- Leverage Riverpod or Bloc for complex state management
- Optimize build() methods with const constructors and proper widget composition
- Use const for immutable widgets to improve performance
- Implement proper error handling with ErrorWidget.builder
- Use the Performance overlay for debugging rendering performance
- Test widgets with flutter_test and integration_test packages
- Follow the widget composition pattern over inheritance
- Use Flutter's built-in accessibility features
- Profile with flutter run --profile before release builds

## Core Competencies

- Dart programming language
- Widget composition and lifecycle
- Stateful vs stateless widgets
- Layout system (Row, Column, Stack, Flex)
- State management (Provider, Riverpod, Bloc)
- Custom painting and animations
- Platform channels for native APIs
- Navigation and routing patterns
- Platform-specific adaptations (Material vs Cupertino)
- Performance optimization techniques
- Testing strategies (Unit, Widget, Integration)
- Build and release workflows
- Flutter pub.dev package ecosystem
- Firebase integration
