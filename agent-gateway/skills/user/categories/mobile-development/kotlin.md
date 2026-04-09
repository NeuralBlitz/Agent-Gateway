---
name: Kotlin
description: Modern, statically typed programming language for Android and beyond
license: Apache 2.0
compatibility: Kotlin 1.9+, JVM 11+, Android API 24+
audience: Android developers and backend engineers
category: Mobile Development
---

# Kotlin Programming

## What I Do

I provide guidance for writing idiomatic Kotlin code for Android and JVM applications. I cover Kotlin syntax, coroutines, extension functions, data classes, and Kotlin-specific patterns.

## When to Use Me

- Building Android applications
- Writing server-side code with Ktor or Spring
- Migrating Java codebases to Kotlin
- Implementing coroutines-based concurrency
- Creating domain-specific languages

## Core Concepts

- **Null Safety**: Types that can or cannot hold null values
- **Data Classes**: Auto-generated equals, hashCode, toString
- **Extension Functions**: Adding methods to existing classes
- **Coroutines**: Asynchronous programming without callbacks
- **Higher-Order Functions**: Functions that take functions as parameters
- **Sealed Classes**: Restricted class hierarchies for state modeling
- **Inline Functions**: Reducing runtime overhead of lambdas
- **Delegation**: Implementing delegation patterns
- **Type Aliases**: Creating alternative names for types
- **Scope Functions**: let, run, with, apply, also

## Code Examples

### Data Classes and Sealed Classes

```kotlin
data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: Role = Role.USER
) {
    fun isAdmin(): Boolean = role == Role.ADMIN
}

enum class Role {
    USER, ADMIN, MODERATOR
}

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    data object Loading : Result<Nothing>()
    
    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    
    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }
    
    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> Error(exception)
        is Loading -> Loading
    }
    
    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }
    
    inline fun onError(action: (Throwable) -> Unit): Result<T> {
        if (this is Error) action(exception)
        return this
    }
}
```

### Coroutines with Flow

```kotlin
class UserRepository(
    private val api: UserApi,
    private val localDb: UserDao
) {
    fun getUsers(): Flow<Result<List<User>>> = flow {
        emit(Result.Loading)
        try {
            val cached = localDb.getAllUsers()
            if (cached.isNotEmpty()) {
                emit(Result.Success(cached))
            }
            
            val fresh = api.fetchUsers()
            localDb.insertUsers(fresh)
            emit(Result.Success(fresh))
        } catch (e: Exception) {
            emit(Result.Error(e))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun getUserById(id: String): Result<User> {
        return try {
            val local = localDb.getUserById(id)
            if (local != null) {
                Result.Success(local)
            } else {
                val remote = api.fetchUser(id)
                localDb.insertUser(remote)
                Result.Success(remote)
            }
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}

class UserViewModel(
    private val repository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(UserUiState())
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    init { loadUsers() }
    
    private fun loadUsers() {
        viewModelScope.launch {
            repository.getUsers().collect { result ->
                _uiState.update { it.copy(
                    isLoading = result is Result.Loading,
                    users = (result as? Result.Success)?.data ?: it.users,
                    error = (result as? Result.Error)?.exception?.message
                )}
            }
        }
    }
}
```

### Extension Functions and DSLs

```kotlin
fun String.isValidEmail(): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
}

inline fun <T, R> T.runIf(condition: Boolean, block: (T) -> R): R? {
    return if (condition) block(this) else null
}

fun ViewGroup.inflate(
    layoutRes: Int,
    attachToParent: Boolean = false
): View {
    return LayoutInflater.from(context)
        .inflate(layoutRes, this, attachToParent)
}

class HttpClientDsl {
    private val headers = mutableMapOf<String, String>()
    private var timeout: Int = 30_000
    
    fun header(key: String, value: String) {
        headers[key] = value
    }
    
    fun timeout(millis: Int) {
        timeout = millis
    }
    
    fun build(): HttpClientConfig {
        return HttpClientConfig(headers, timeout)
    }
}

fun httpClient(block: HttpClientDsl.() -> Unit): HttpClientConfig {
    return HttpClientDsl().apply(block).build()
}

val clientConfig = httpClient {
    header("Authorization", "Bearer token")
    header("Accept", "application/json")
    timeout(60_000)
}
```

## Best Practices

1. **Use Data Classes**: Reduce boilerplate for DTOs and models
2. **Leverage Coroutines**: Simplify async code with structured concurrency
3. **Use Flow for Streams**: Reactive programming with proper lifecycle handling
4. **Prefer Immutable Collections**: Use listOf, setOf, mapOf
5. **Use Named Arguments**: Improve code readability
6. **Apply Typealiases**: Simplify complex generic types
7. **Use Inline Classes**: Wrap types with validation at compile time
8. **Avoid !! Operator**: Use safe calls or let blocks
9. **Use Scope Functions Appropriately**: let for null checks, apply for configuration
10. **Write Unit Tests**: Use JUnit5 and MockK for testing
