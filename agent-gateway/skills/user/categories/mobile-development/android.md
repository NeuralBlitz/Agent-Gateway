---
name: Android
description: Google's mobile operating system and development platform using Kotlin and Java
license: MIT
compatibility: Android Studio, Kotlin 1.9+, Android API 24+
audience: Mobile developers building native Android applications
category: Mobile Development
---

# Android Development

## What I Do

I provide comprehensive guidance for developing native Android applications using Kotlin and Jetpack libraries. I cover Android Studio, Jetpack Compose, Android SDK, Gradle build system, and Google Play publishing.

## When to Use Me

- Building native Android applications from scratch
- Migrating Java codebases to Kotlin
- Implementing Material Design interfaces
- Integrating Google Play services
- Optimizing Android app performance

## Core Concepts

- **Kotlin Programming**: Modern, concise language for Android development
- **Jetpack Compose**: Declarative UI toolkit for building Android UIs
- **Activities and Fragments**: Managing screen components and navigation
- **ViewModel**: Managing UI-related data across configuration changes
- **Room Database**: Local SQLite abstraction for data persistence
- **WorkManager**: Background task scheduling for deferrable work
- **Navigation Component**: Managing app navigation graph
- **Gradle Build System**: Configuring and building Android projects
- **Android Manifest**: Declaring app components and permissions
- **Jetpack Libraries**: AndroidX components for common functionality

## Code Examples

### Jetpack Compose Basic Screen

```kotlin
@Composable
fun GreetingScreen(
    name: String,
    onGreet: () -> Unit
) {
    var text by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text("Enter your name") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = {
                name = text
                onGreet()
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Greet")
        }
    }
}
```

### ViewModel with LiveData

```kotlin
class UserViewModel(
    private val repository: UserRepository
) : ViewModel() {
    
    private val _userState = MutableLiveData<UserState>()
    val userState: LiveData<UserState> = _userState
    
    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading
    
    fun loadUser(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val user = repository.getUser(userId)
                _userState.value = UserState.Success(user)
            } catch (e: Exception) {
                _userState.value = UserState.Error(e.message ?: "Unknown error")
            } finally {
                _isLoading.value = false
            }
        }
    }
}

sealed class UserState {
    data class Success(val user: User) : UserState()
    data class Error(val message: String) : UserState()
}
```

### Room Database

```kotlin
@Entity(tableName = "users")
data class User(
    @PrimaryKey val id: Long,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "email") val email: String,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis()
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>
    
    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: Long): User?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)
    
    @Delete
    suspend fun deleteUser(user: User)
    
    @Query("DELETE FROM users")
    suspend fun deleteAllUsers()
}

@Database(
    entities = [User::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

### WorkManager Background Task

```kotlin
class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {
    
    override suspend fun doWork(): Result {
        return try {
            syncData()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
    
    private suspend fun syncData() {
        // Perform sync operation
    }
    
    companion object {
        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
                6, TimeUnit.HOURS,
                30, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .build()
            
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    "sync_work",
                    ExistingPeriodicWorkPolicy.KEEP,
                    syncRequest
                )
        }
    }
}
```

## Best Practices

1. **Use Jetpack Compose**: Modern declarative UI reduces boilerplate and bugs
2. **Follow Material Design 3**: Implement modern design patterns and theming
3. **Use Hilt for Dependency Injection**: Standard solution for Android DI
4. **Implement Clean Architecture**: Separate UI, domain, and data layers
5. **Use Kotlin Coroutines**: Proper async handling without callback hell
6. **Optimize for Different Screens**: Support various screen sizes and densities
7. **Implement ProGuard/R8**: Minimize and obfuscate release builds
8. **Use LeakCanary**: Detect memory leaks during development
9. **Write UI Tests**: Use Espresso for instrumented tests
10. **Configure Build Variants**: Support free/paid and debug/release builds
