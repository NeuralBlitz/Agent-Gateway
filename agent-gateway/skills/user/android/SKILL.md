---
name: android
description: Android mobile development
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Develop native Android applications using Kotlin and Java
- Implement Android UI with Jetpack Compose and XML layouts
- Work with Android APIs, SDKs, and platform services
- Optimize app performance and memory usage
- Handle device compatibility and fragmentation
- Implement Android security best practices
- Work with Android Jetpack libraries and architecture components

## When to use me

Use me when:
- Building native Android applications
- Migrating iOS apps to Android
- Optimizing existing Android apps for performance
- Implementing Android-specific features (widgets, notifications, background services)
- Working with Android device hardware (camera, sensors, GPS)
- Preparing apps for Google Play Store deployment

## Key Concepts

### Android Architecture
Android follows a component-based architecture with Activities, Fragments, Services, and Broadcast Receivers. Modern Android development uses MVVM with Jetpack components.

```kotlin
// ViewModel with StateFlow
class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState
    
    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val data = repository.getData()
            _uiState.update { it.copy(data = data, isLoading = false) }
        }
    }
}
```

### Jetpack Compose
Declarative UI framework for building Android interfaces:
- Composable functions describe UI
- State management with remember and StateFlow
- Material Design 3 components

### Android SDK Components
- Activities: Single screen entry points
- Fragments: Reusable UI components
- Services: Background processing
- WorkManager: Deferred background tasks
- Room: Local database
- Hilt: Dependency injection

### Performance Considerations
- RecyclerView for efficient list rendering
- Kotlin coroutines for async operations
- ProGuard/R8 for code shrinking
- Baseline profiles for startup optimization
