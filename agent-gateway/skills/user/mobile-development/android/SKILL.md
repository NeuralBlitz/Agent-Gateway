---
name: android
description: Google's mobile operating system and development platform
tags: [android, java, kotlin, gradle, jetpack, google-play]
---

# Android Development

## What I do

I provide comprehensive guidance for developing applications for Google's Android platform. I cover Kotlin and Java programming, Android Studio IDE, Jetpack libraries, Material Design components, Jetpack Compose for declarative UI, and Google Play Store publishing.

## When to use me

Use me when building native Android applications, developing for diverse device configurations, integrating Google services (Firebase, Maps, ML Kit), optimizing for performance and battery life, or publishing to the Google Play Store.

## Core Concepts

Kotlin programming language fundamentals including coroutines, flow, and extension functions. Android activity and fragment lifecycle management. Jetpack ViewModel and LiveData for state management. Room database for local persistence. Hilt or Koin for dependency injection. Jetpack Compose for modern declarative UI. Android Gradle plugin configuration and build optimization.

## Code Examples

Jetpack Compose UI with ViewModel:

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class UiState(val count: Int = 0, val isLoading: Boolean = false)

class CounterViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState
    
    fun increment() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            delay(100) // Simulate work
            _uiState.value = _uiState.value.copy(
                count = _uiState.value.count + 1,
                isLoading = false
            )
        }
    }
}

@Composable
fun CounterScreen(viewModel: CounterViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Count: ${state.count}",
            style = MaterialTheme.typography.headlineMedium
        )
        
        Button(
            onClick = { viewModel.increment() },
            enabled = !state.isLoading
        ) {
            Text("Increment")
        }
    }
}
```

Repository pattern with Room:

```kotlin
@Entity(tableName = "users")
data class User(
    @PrimaryKey val id: Long,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "email") val email: String
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)
    
    @Delete
    suspend fun deleteUser(user: User)
}

class UserRepository(private val userDao: UserDao) {
    val allUsers: Flow<List<User>> = userDao.getAllUsers()
    
    suspend fun insert(user: User) {
        userDao.insertUser(user)
    }
    
    suspend fun delete(user: User) {
        userDao.deleteUser(user)
    }
}
```

## Best Practices

Adopt Kotlin as the primary language for new Android projects. Use Jetpack Compose for new UI development while supporting existing View-based code. Implement Clean Architecture with clear separation of concerns. Use Hilt for dependency injection across the application. Write unit tests with JUnit and Mockito, instrumented tests with Espresso. Optimize APK size using R8 code shrinking and resource optimization. Handle runtime permissions properly with the permissions API.

## Common Patterns

MVVM architecture with LiveData and StateFlow for reactive UI updates. Repository pattern abstracting data sources (local Room database, remote API). Use case pattern encapsulating business logic. Dependency injection using Hilt modules. Singleton pattern for application-wide services. Builder pattern for complex object construction. Observer pattern with LiveData and Flow for reactive data streams.
