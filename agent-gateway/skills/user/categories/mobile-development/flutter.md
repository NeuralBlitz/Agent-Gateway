---
name: Flutter
description: Google's UI toolkit for building natively compiled cross-platform applications
license: BSD-3
compatibility: Dart 3.0+, Flutter 3.0+, iOS 11+, Android 5.0+
audience: Developers building high-performance cross-platform applications
category: Mobile Development
---

# Flutter Development

## What I Do

I provide guidance for building cross-platform applications using Flutter and Dart. I cover widget development, state management, platform channels, animations, and Flutter pub packages.

## When to Use Me

- Building high-performance cross-platform mobile apps
- Creating apps with custom UI/UX requirements
- Developing with a single codebase for iOS and Android
- Implementing complex animations and transitions
- Rapid UI prototyping with hot reload

## Core Concepts

- **Dart Programming**: Optimized language for UI development
- **Widgets**: Building blocks of Flutter UIs (Stateless vs Stateful)
- **Layout Widgets**: Row, Column, Stack, Container, Flex
- **State Management**: Provider, Riverpod, Bloc, GetX
- **Navigation**: Navigator 2.0 with GoRouter
- **Platform Channels**: Communicating with native code
- **Flutter Build System**: Compiling for iOS and Android
- **Pub.dev Packages**: Flutter's package ecosystem
- **Custom Painters**: Low-level graphics drawing
- **Async Operations**: Future, Stream, async/await patterns

## Code Examples

### Stateless Widget

```dart
import 'package:flutter/material.dart';

class GreetingPage extends StatelessWidget {
  final String name;
  
  const GreetingPage({
    super.key,
    required this.name,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Greeting App'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Hello, $name!',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Stateful Widget with Provider

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class CounterModel extends ChangeNotifier {
  int _count = 0;
  
  int get count => _count;
  
  void increment() {
    _count++;
    notifyListeners();
  }
  
  void reset() {
    _count = 0;
    notifyListeners();
  }
}

class CounterPage extends StatelessWidget {
  const CounterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CounterModel(),
      child: Scaffold(
        body: Center(
          child: Consumer<CounterModel>(
            builder: (context, counter, _) => Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Count: ${counter.count}',
                  style: const TextStyle(fontSize: 24),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: counter.increment,
                      child: const Text('Increment'),
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton(
                      onPressed: counter.reset,
                      child: const Text('Reset'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### Network Request with FutureBuilder

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class User {
  final int id;
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

class UserListPage extends StatelessWidget {
  const UserListPage({super.key});

  Future<List<User>> fetchUsers() async {
    final response = await http
        .get(Uri.parse('https://api.example.com/users'));
    
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => User.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load users');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<List<User>>(
        future: fetchUsers(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return ListView.builder(
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final user = snapshot.data![index];
                return ListTile(
                  leading: CircleAvatar(
                    child: Text(user.id.toString()),
                  ),
                  title: Text(user.name),
                  subtitle: Text(user.email),
                );
              },
            );
          }
          return const Center(child: Text('No users found'));
        },
      ),
    );
  }
}
```

## Best Practices

1. **Use const Constructors**: Mark widgets as const when possible for performance
2. **Separate UI and Logic**: Use proper state management (Provider/Riverpod)
3. **Optimize Build Methods**: Keep build methods fast and avoid heavy operations
4. **Use Custom Painters Sparingly**: Complex graphics impact performance
5. **Implement Proper Error Boundaries**: Handle exceptions gracefully
6. **Follow Material Design Guidelines**: Consistent look and feel
7. **Test on Multiple Screen Sizes**: Use LayoutBuilder and responsive utilities
8. **Use Flutter DevTools**: Profile memory and performance issues
9. **Optimize Image Loading**: Use cached_network_image package
10. **Enable Raster Cache**: Cache expensive painting operations
