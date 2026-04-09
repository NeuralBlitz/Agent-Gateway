---
name: flutter
description: Flutter cross-platform framework
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Build cross-platform mobile apps with Flutter (Dart)
- Create beautiful, responsive UIs with Material Design and Cupertino widgets
- Implement state management (Provider, Riverpod, Bloc, GetX)
- Access native features through platform channels
- Build custom widgets and animations
- Handle internationalization and localization
- Optimize Flutter app performance

## When to use me

Use me when:
- Building iOS and Android apps from a single codebase
- Creating visually rich, custom UIs
- Rapid prototyping and MVP development
- Apps requiring consistent cross-platform experience
- Projects with limited native platform code needs
- Teams with single Flutter/Dart expertise

## Key Concepts

### Flutter Widget System
Everything in Flutter is a widget - from buttons to layouts to the entire app. Widgets compose to build complex UIs.

```dart
class CounterApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: ChangeNotifierProvider(
        create: (_) => CounterNotifier(),
        child: CounterScreen(),
      ),
    );
  }
}

class CounterScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Center(
        child: Consumer<CounterNotifier>(
          builder: (context, notifier, child) {
            return Text('${notifier.count}');
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: context.read<CounterNotifier>().increment,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

### State Management Options
- **Provider**: Simple, recommended for most cases
- **Riverpod**: Compile-safe, testable state management
- **Bloc**: Business Logic Component with events/states
- **GetX**: Navigation, dependency injection, state management

### Platform Channels
```dart
static const platform = MethodChannel('com.example/channel');

Future<String> getNativeData() async {
  return await platform.invokeMethod('getData');
}
```
