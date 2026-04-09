---
name: mobile-ui
description: Mobile UI design and implementation
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Design intuitive mobile user interfaces
- Implement responsive layouts for various screen sizes
- Create consistent navigation patterns
- Build accessible mobile experiences
- Optimize UI performance
- Design for different platform conventions (iOS vs Android)
- Implement animations and transitions

## When to use me

Use me when:
- Designing new mobile app screens
- Improving existing app usability
- Implementing platform-specific UI patterns
- Creating accessible mobile experiences
- Building custom UI components
- Optimizing UI rendering performance

## Key Concepts

### Platform Design Guidelines
- **iOS**: Apple Human Interface Guidelines (HUD, gesture-driven, depth)
- **Android**: Material Design 3 (material surfaces, motion, theming)
- **Cross-platform**: Balance consistency with platform expectations

### Responsive Layout Principles
```kotlin
// Android ConstraintLayout
<androidx.constraintlayout.widget.ConstraintLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    
    <TextView
        android:id="@+id/title"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintWidth_max="600dp" />
        
    <Button
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />
</androidx.constraintlayout.widget.ConstraintLayout>
```

### Navigation Patterns
- **Tab-based**: Bottom navigation for equal priorities
- **Stack**: Drill-down navigation
- **Drawer**: Side navigation for many items
- **Modal**: Focused tasks, forms

### Accessibility (a11y)
- Minimum touch targets: 48x48dp
- Color contrast ratios (4.5:1 minimum)
- Screen reader support (TalkBack, VoiceOver)
- Content descriptions for images
- Focus management for navigation

### Animation Principles
- Duration: 200-300ms for most transitions
- Easing: Accelerate/decelerate curves
- Respect motion preferences (reduce motion setting)
- 60fps target for smooth experience
