---
name: mobile-ui
description: Mobile user interface design and implementation patterns
tags: [mobile-ui, ux, design, widgets, components, layout]
---

# Mobile UI Development

## What I do

I provide guidance for designing and implementing mobile user interfaces across platforms. I cover responsive layouts, touch-friendly interactions, accessibility implementation, navigation patterns, animation principles, and platform-specific design guidelines (Material Design, Human Interface Guidelines).

## When to use me

Use me when designing mobile app interfaces, implementing complex UI components, optimizing touch interactions, ensuring accessibility compliance, creating smooth animations, or aligning with platform design guidelines.

## Core Concepts

Responsive layouts adapting to different screen sizes and orientations. Touch gesture handling (tap, swipe, pinch, drag) with appropriate affordances. Accessibility features including VoiceOver/TalkBack support, sufficient contrast ratios, and proper labeling. Navigation patterns (tab bars, navigation drawers, bottom sheets, breadcrumbs). Animation principles for feedback, transitions, and delight. Adaptive theming for light/dark mode and platform variations. Safe area handling and edge-to-edge displays.

## Code Examples

Responsive layout with constraint composition:

```swift
import UIKit

final class AdaptiveCardView: UIView {
    private let contentStack = UIStackView()
    private let imageView = UIImageView()
    private let titleLabel = UILabel()
    private let subtitleLabel = UILabel()
    private let actionButton = UIButton(type: .system)
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
        setupConstraints()
    }
    
    private func setupViews() {
        backgroundColor = .secondarySystemBackground
        layer.cornerRadius = 12
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 2)
        layer.shadowRadius = 8
        layer.shadowOpacity = 0.1
        
        contentStack.axis = .horizontal
        contentStack.spacing = 12
        contentStack.alignment = .center
        contentStack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(contentStack)
        
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 8
        contentStack.addArrangedSubview(imageView)
        
        let textStack = UIStackView()
        textStack.axis = .vertical
        textStack.spacing = 4
        textStack.addArrangedSubview(titleLabel)
        textStack.addArrangedSubview(subtitleLabel)
        contentStack.addArrangedSubview(textStack)
        
        let spacer = UIView()
        spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        contentStack.addArrangedSubview(spacer)
        
        actionButton.setTitle("Action", for: .normal)
        contentStack.addArrangedSubview(actionButton)
        
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        subtitleLabel.font = .preferredFont(forTextStyle: .subheadline)
        subtitleLabel.textColor = .secondaryLabel
    }
    
    private func setupConstraints() {
        NSLayoutConstraint.activate([
            contentStack.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            contentStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            contentStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            contentStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -16),
            
            imageView.widthAnchor.constraint(equalToConstant: 60),
            imageView.heightAnchor.constraint(equalToConstant: 60),
        ])
    }
    
    func configure(with item: CardItem) {
        titleLabel.text = item.title
        subtitleLabel.text = item.subtitle
        imageView.image = item.image
        actionButton.action = item.action
    }
}
```

Cross-platform responsive layout:

```dart
import 'package:flutter/material.dart';

class ResponsiveLayout extends StatelessWidget {
  final WidgetBuilder mobileBuilder;
  final WidgetBuilder tabletBuilder;
  final WidgetBuilder desktopBuilder;

  const ResponsiveLayout({
    super.key,
    required this.mobileBuilder,
    required this.tabletBuilder,
    required this.desktopBuilder,
  });

  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < 600;
  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= 600 &&
      MediaQuery.sizeOf(context).width < 1024;
  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= 1024;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return mobileBuilder(context);
        } else if (constraints.maxWidth < 1024) {
          return tabletBuilder(context);
        } else {
          return desktopBuilder(context);
        }
      },
    );
  }
}

class AdaptiveScaffold extends StatelessWidget {
  final Widget title;
  final List<Widget> actions;
  final Widget body;
  final Widget? drawer;
  final Widget? bottomNavigationBar;

  const AdaptiveScaffold({
    super.key,
    required this.title,
    this.actions = const [],
    required this.body,
    this.drawer,
    this.bottomNavigationBar,
  });

  @override
  Widget build(BuildContext context) {
    final isCompact = ResponsiveLayout.isMobile(context);

    if (isCompact) {
      return Scaffold(
        appBar: AppBar(title: title, actions: actions),
        drawer: drawer,
        bottomNavigationBar: bottomNavigationBar,
        body: body,
      );
    }

    return Scaffold(
      appBar: AppBar(title: title, actions: actions),
      body: Row(
        children: [
          if (drawer != null) SizedBox(width: 250, child: drawer),
          Expanded(child: body),
        ],
      ),
    );
  }
}
```

## Best Practices

Design for touch with minimum 44x44 point touch targets. Provide visual feedback for all touch interactions. Support both light and dark color schemes. Ensure text remains readable at all zoom levels. Use adaptive widgets that adjust to platform conventions. Implement proper accessibility labels and hints. Use semantic markup for screen readers. Test on actual devices across screen sizes. Animate purposeful changes, not gratuitous effects.

## Common Patterns

Adaptive widget pattern that changes behavior based on platform. Breakpoint-based layouts using MediaQuery. Responsive grid systems with flexible widgets. Card-based content containers. List-detail split views for tablet layouts. Bottom navigation for primary navigation on mobile, side navigation on tablet/desktop. Pull-to-refresh patterns for content updates.
