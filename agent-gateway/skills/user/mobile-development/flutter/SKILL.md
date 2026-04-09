---
name: flutter
description: Google's UI toolkit for building natively compiled applications
tags: [flutter, dart, android, ios, cross-platform, google]
---

# Flutter Development

## What I do

I provide guidance for building cross-platform mobile applications using Flutter and Dart. I cover widget-based UI development, state management solutions (Provider, Riverpod, Bloc), platform channel integration, native code with FFI, and deployment to iOS, Android, web, and desktop platforms.

## When to use me

Use me when building high-performance cross-platform apps with a single codebase, creating complex animated UIs, developing for multiple platforms (mobile, web, desktop) from one codebase, or requiring consistent UI across platforms with native performance.

## Core Concepts

Flutter widget tree and element tree relationship. Stateless and stateful widgets with setState, Provider, Riverpod, or Bloc for state management. Layout widgets (Row, Column, Stack, Container) and custom painters for custom graphics. Flutter build modes (debug, profile, release) and performance optimization. Platform channels for native code integration. Dart isolates for concurrent computation. Dart Streams and StreamBuilder for reactive programming.

## Code Examples

Flutter widget with Riverpod state management:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);

  void increment() => state++;
  void decrement() => state--;
}

class CounterScreen extends ConsumerWidget {
  const CounterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Counter')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('$count', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () => ref.read(counterProvider.notifier).decrement(),
                  child: const Icon(Icons.remove),
                ),
                const SizedBox(width: 20),
                ElevatedButton(
                  onPressed: () => ref.read(counterProvider.notifier).increment(),
                  child: const Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

Custom painter with animation:

```dart
import 'package:flutter/material.dart';

class AnimatedCirclePainter extends CustomPainter {
  final double progress;
  
  AnimatedCirclePainter(this.progress);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 3;
    
    // Draw background circle
    canvas.drawCircle(center, radius, paint..color = Colors.grey.shade200);
    
    // Draw progress arc
    final sweepAngle = 2 * pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      sweepAngle,
      false,
      paint..color = Colors.blue,
    );
  }
  
  @override
  bool shouldRepaint(covariant AnimatedCirclePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class AnimatedCircle extends StatefulWidget {
  const AnimatedCircle({super.key});

  @override
  State<AnimatedCircle> createState() => _AnimatedCircleState();
}

class _AnimatedCircleState extends State<AnimatedCircle>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
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
          painter: AnimatedCirclePainter(_animation.value),
          size: const Size(200, 200),
        );
      },
    );
  }
}
```

## Best Practices

Use Riverpod or Bloc for state management in production apps. Organize code with feature-based folder structure. Use const constructors where possible for performance. Implement proper error handling with ErrorWidget and error boundaries. Use key-based widget testing with flutter_test. Optimize build performance by avoiding unnecessary rebuilds with const constructors and ValueKey. Profile performance with DevTools before release.

## Common Patterns

Provider/Riverpod for dependency injection and state management. Repository pattern abstracting data sources. Service locator pattern for accessing platform channels. BLoC pattern separating business logic from UI. InheritedWidget pattern for theme and locale propagation. Builder pattern for complex widget construction. Strategy pattern for algorithm swapping at runtime.
