---
name: Mobile UI
description: Mobile user interface design and implementation patterns
license: MIT
compatibility: iOS, Android, Cross-platform
audience: UI/UX designers and mobile developers
category: Mobile Development
---

# Mobile UI Design

## What I Do

I provide guidance for designing and implementing mobile user interfaces. I cover responsive layouts, adaptive design, navigation patterns, touch interactions, and platform-specific UI guidelines.

## When to Use Me

- Designing mobile app interfaces
- Implementing responsive layouts
- Creating consistent cross-platform UIs
- Optimizing for different screen sizes
- Following platform design guidelines

## Core Concepts

- **Responsive Layouts**: Adapting UI to different screen sizes
- **Touch Targets**: Minimum sizes for interactive elements
- **Navigation Patterns**: Tabs, drawers, stacks, and modals
- **Adaptive Components**: Components that change by platform
- **Typography Scale**: Consistent font sizing hierarchy
- **Color Systems**: Primary, secondary, and semantic colors
- **Spacing System**: Consistent padding and margins
- **Iconography**: Icon design and usage guidelines
- **Gestures**: Swipe, pinch, scroll, and tap interactions
- **Accessibility**: WCAG guidelines for mobile apps

## Code Examples

### Responsive Grid Layout

```tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

const GridSystem: React.FC = () => {
  const { width } = useWindowDimensions();
  const columns = width > 768 ? 3 : width > 480 ? 2 : 1;
  const spacing = 16;
  
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
  
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.item,
              {
                width: `${(100 - (columns + 1) * spacing) / columns}%`,
                margin: spacing / 2,
              },
            ]}
          >
            <View style={styles.card}>
              <Text style={styles.text}>{item}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GridSystem;
```

### Adaptive Navigation

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration

@Composable
fun AdaptiveNavigation() {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp.dp
    
    val navigationType: NavigationType = when {
        screenWidth >= 840.dp -> NavigationType.NAVIGATION_RAIL
        screenWidth >= 480.dp -> NavigationType.NAVIGATION_BAR
        else -> NavigationType.BOTTOM_NAVIGATION
    }
    
    when (navigationType) {
        NavigationType.BOTTOM_NAVIGATION -> BottomNavBar()
        NavigationType.NAVIGATION_BAR -> SideNavigationRail()
        NavigationType.NAVIGATION_RAIL -> PermanentNavigationDrawer()
    }
}

enum class NavigationType {
    BOTTOM_NAVIGATION,
    NAVIGATION_BAR,
    NAVIGATION_RAIL
}

@Composable
fun BottomNavBar() {
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Home, contentDescription = "Home") },
                    label = { Text("Home") },
                    selected = true,
                    onClick = { /* navigate */ }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Search, contentDescription = "Search") },
                    label = { Text("Search") },
                    selected = false,
                    onClick = { /* navigate */ }
                )
            }
        }
    ) { padding ->
        Content(Modifier.padding(padding))
    }
}
```

### Touch Feedback Animation

```dart
import 'package:flutter/material.dart';

class TouchFeedbackButton extends StatefulWidget {
  final VoidCallback onTap;
  final Widget child;
  
  const TouchFeedbackButton({
    super.key,
    required this.onTap,
    required this.child,
  });

  @override
  State<TouchFeedbackButton> createState() => _TouchFeedbackButtonState();
}

class _TouchFeedbackButtonState extends State<TouchFeedbackButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}
```

## Best Practices

1. **Follow Platform Guidelines**: iOS Human Interface Guidelines and Material Design
2. **Design for Thumb Zone**: Place frequently used actions within thumb reach
3. **Use Adequate Touch Targets**: Minimum 44x44 points for tappable elements
4. **Implement Dark Mode**: Support both light and dark color schemes
5. **Use System Fonts**: Match platform native typography
6. **Maintain Consistent Spacing**: Use a grid system for alignment
7. **Provide Visual Feedback**: Indicate touch states clearly
8. **Test on Multiple Devices**: Verify design across screen sizes
9. **Optimize Image Assets**: Use vector graphics where possible
10. **Consider Accessibility**: Support Dynamic Type and VoiceOver/TalkBack
