---
name: kotlin
description: Modern, statically typed programming language for Android and beyond
category: mobile-development
difficulty: intermediate
tags: [android, jetbrains, jvm, language]
author: JetBrains
version: 1.9
last_updated: 2024-01-15
---

# Kotlin

## What I Do

I am Kotlin, a modern, statically typed programming language developed by JetBrains that runs on the Java Virtual Machine and can be compiled to JavaScript and native code. I was designed to be fully interoperable with Java while offering more expressive syntax, null safety, and functional programming features. Google announced me as a first-class language for Android development in 2017. I reduce boilerplate through features like data classes, smart casts, and type inference. My coroutines simplify asynchronous programming, replacing callback hell with sequential code. I support multi-paradigm programming including object-oriented and functional styles. My extension functions allow adding functionality to existing classes without inheritance. I compile to multiple targets including JVM, Android, JavaScript, Native (iOS, Linux, Windows), and WebAssembly.

## When to Use Me

- Android application development (primary language)
- Server-side development with Ktor, Spring Boot
- Multiplatform projects (shared code between platforms)
- Desktop applications with JavaFX or TornadoFX
- Gradle build script development
- Microservices architecture
- Legacy Java modernization
- Teams wanting Java interoperability with modern language features

## Core Concepts

**Null Safety**: Type system that prevents null pointer exceptions through nullable types and safe calls.

**Data Classes**: Auto-generated equals(), hashCode(), toString(), and copy() methods.

**Coroutines**: Lightweight threads for asynchronous and non-blocking programming.

**Extension Functions**: Add methods to existing classes without modifying their source.

**Higher-Order Functions**: Functions that take other functions as parameters or return them.

**Sealed Classes**: Restricted class hierarchies representing constrained sets of subtypes.

**Delegation**: Composition over inheritance pattern supported natively.

**Type Inference**: Compiler deduces types in most contexts reducing explicit annotations.

## Code Examples

### Example 1: Data Classes and Null Safety
```kotlin
// Data class with null safety
data class User(
    val id: String,
    val name: String,
    val email: String,
    val age: Int? = null, // Nullable type
    val profileImageUrl: String? = null
) {
    val displayName: String
        get() = name.ifBlank { "Anonymous" }
    
    val isAdult: Boolean?
        get() = age?.let { it >= 18 }
    
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "name" to name,
        "email" to email,
        "age" to age,
        "profileImageUrl" to profileImageUrl
    )
}

// Extension function
fun User.formatForDisplay(): String {
    return buildString {
        append(displayName)
        age?.let { append(" ($it years old)") }
        append("\n$email")
    }
}

// Safe call and Elvis operator
fun processUser(user: User?) {
    // Safe call - only executes if user is not null
    val emailLength = user?.email?.length ?: 0
    
    // Elvis operator - provides default value
    val displayName = user?.displayName ?: "Guest User"
    
    // Smart cast - Kotlin knows user is not null inside if
    if (user != null) {
        println(user.id) // No safe call needed
    }
    
    // Let scope function
    user?.let { u ->
        println("User: ${u.name}")
    }
    
    // Also not null assertion (use sparingly!)
    val guaranteed = user!! // Throws exception if null
}

// Destructuring declaration
fun printUserComponents(user: User) {
    val (id, name, email, age, _) = user
    println("ID: $id, Name: $name, Email: $email, Age: ${age ?: "N/A"}")
}
```

### Example 2: Coroutines for Async Programming
```kotlin
// Coroutine basics
suspend fun fetchUser(id: String): User {
    // Suspending function - can pause execution
    return withContext(Dispatchers.IO) {
        // Switch to IO dispatcher for blocking operations
        apiService.getUser(id)
    }
}

// Concurrent operations with async
suspend fun fetchUsersAndPosts(userId: String): Pair<List<Post>, List<User>> {
    // Both operations run concurrently
    val postsDeferred = async { apiService.getPosts(userId) }
    val usersDeferred = async { apiService.getFollowers(userId) }
    
    val posts = postsDeferred.await()
    val users = usersDeferred.await()
    
    return Pair(posts, users)
}

// Parallel decomposition
suspend fun fetchAllUsers(): List<List<User>> = coroutineScope {
    val userIds = listOf("1", "2", "3", "4")
    
    userIds.map { id ->
        async {
            apiService.getUser(id)
        }
    }.awaitAll()
}

// Retry with exponential backoff
suspend fun <T> retryWithBackoff(
    maxAttempts: Int = 3,
    initialDelay: Long = 1000,
    factor: Double = 2.0,
    block: suspend () -> T
): T {
    var currentDelay = initialDelay
    repeat(maxAttempts) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            if (attempt == maxAttempts - 1) throw e
            delay(currentDelay)
            currentDelay = (currentDelay * factor).toLong()
        }
    }
    throw IllegalStateException("Should not reach here")
}

// Flow for reactive streams
fun User.asFlow(): Flow<UserDto> = flow {
    emit(user.toDto())
    // Emit updates as they happen
    for (update in channel) {
        emit(update.toDto())
    }
}.flowOn(Dispatchers.IO)

// Collecting flow with lifecycle awareness
@Composable
fun UserList(viewModel: UserViewModel) {
    val users by viewModel.users.collectAsState(initial = emptyList())
    
    LazyColumn {
        items(users) { user ->
            UserCard(user = user)
        }
    }
}
```

### Example 3: Sealed Classes and Pattern Matching
```kotlin
// Sealed class for state representation
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    data object Loading : Result<Nothing>()
    
    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    val isLoading: Boolean get() = this is Loading
    
    fun getOrNull(): T? = (this as? Success)?.data
    
    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw exception
        is Loading -> throw IllegalStateException("Result is still loading")
    }
    
    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        is Loading -> Loading
    }
    
    inline fun <R> flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
        is Success -> transform(data)
        is Error -> this
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

// Usage with when expression
fun handleResult(result: Result<String>) {
    val message = when (result) {
        is Result.Success -> "Got data: ${result.data}"
        is Result.Error -> "Error: ${result.exception.message}"
        is Result.Loading -> "Loading..."
    }
    println(message)
}

// Navigation events with sealed classes
sealed class NavigationEvent {
    data object NavigateBack : NavigationEvent()
    data class NavigateToDetail(val userId: String) : NavigationEvent()
    data class ShowSnackbar(val message: String) : NavigationEvent()
    data class NavigateWithParams(val route: String, val args: Bundle) : NavigationEvent()
}

// ViewModel handling navigation
class UserViewModel : ViewModel() {
    private val _navigationEvents = MutableSharedFlow<NavigationEvent>()
    val navigationEvents: SharedFlow<NavigationEvent> = _navigationEvents
    
    fun onUserClicked(userId: String) {
        viewModelScope.launch {
            _navigationEvents.emit(NavigationEvent.NavigateToDetail(userId))
        }
    }
    
    fun onError(message: String) {
        viewModelScope.launch {
            _navigationEvents.emit(NavigationEvent.ShowSnackbar(message))
        }
    }
}
```

### Example 4: Delegation and Composition
```kotlin
// Interface for delegation
interface Repository<T> {
    suspend fun getById(id: String): T?
    suspend fun getAll(): List<T>
    suspend fun save(entity: T)
    suspend fun delete(id: String)
}

// Base repository implementation
class RepositoryImpl<T>(
    private val localDataSource: LocalDataSource<T>,
    private val remoteDataSource: RemoteDataSource<T>
) : Repository<T> {
    override suspend fun getById(id: String): T? {
        return localDataSource.getById(id) ?: remoteDataSource.getById(id)?.also {
            localDataSource.save(it)
        }
    }
    
    override suspend fun getAll(): List<T> {
        return try {
            val remote = remoteDataSource.getAll()
            localDataSource.clearAndSaveAll(remote)
            remote
        } catch (e: Exception) {
            localDataSource.getAll()
        }
    }
    
    override suspend fun save(entity: T) {
        localDataSource.save(entity)
        try {
            remoteDataSource.save(entity)
        } catch (e: Exception) {
            // Handle sync failure
        }
    }
    
    override suspend fun delete(id: String) {
        localDataSource.delete(id)
        try {
            remoteDataSource.delete(id)
        } catch (e: Exception) {
            // Handle sync failure
        }
    }
}

// Delegated properties
class UserManager(private val repository: Repository<User>) {
    private var currentUser: User? by Delegates.observable(null) { _, old, new ->
        println("User changed from ${old?.name} to ${new?.name}")
    }
    
    private val _userPreferences by lazy {
        // Lazy initialization
        loadPreferences()
    }
    
    private var userId: String? by SharedPreferencesDelegate("user_id")
    
    fun loadUser() {
        userId?.let { id ->
            viewModelScope.launch {
                currentUser = repository.getById(id)
            }
        }
    }
}

// Custom delegates
class SharedPreferencesDelegate(
    private val key: String,
    private val defaultValue: String? = null
) : ReadWriteProperty<Any?, String?> {
    private val prefs: SharedPreferences by lazy {
        MyApplication.prefs
    }
    
    override fun getValue(thisRef: Any?, property: KProperty<*>): String? {
        return prefs.getString(key, defaultValue)
    }
    
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: String?) {
        prefs.edit().putString(key, value).apply()
    }
}

// Map-backed properties
class Configuration(properties: Map<String, Any?>) {
    val databaseUrl: String by properties
    val maxConnections: Int by properties
    val timeout: Long by properties
}
```

### Example 5: Generics with Constraints
```kotlin
// Generic repository pattern
interface Repository<T : Identifiable> {
    suspend fun findById(id: String): T?
    suspend fun findAll(): List<T>
    suspend fun save(entity: T)
    suspend fun delete(id: String)
    suspend fun count(): Int
}

// Type constraints with where clauses
class InMemoryRepository<T : Identifiable>(
    private val comparator: Comparator<T> = compareBy { it.id }
) : Repository<T> {
    private val storage = mutableMapOf<String, T>()
    private val lock = ReentrantLock()
    
    override suspend fun findById(id: String): T? = lock.withLock {
        storage[id]
    }
    
    override suspend fun findAll(): List<T> = lock.withLock {
        storage.values.sortedWith(comparator)
    }
    
    override suspend fun save(entity: T) = lock.withLock {
        storage[entity.id] = entity
    }
    
    override suspend fun delete(id: String) = lock.withLock {
        storage.remove(id)
    }
    
    override suspend fun count(): Int = lock.withLock {
        storage.size
    }
}

// Generic extension functions
fun <T : Comparable<T>> List<T>.median(): T? {
    if (isEmpty()) return null
    return sorted()[size / 2]
}

fun <T, R : Comparable<R>> List<T>.maxBy(selector: (T) -> R): T? {
    return if (isEmpty()) null
    else this.maxOfOrNull { selector(it) }?.let { maxValue ->
        this.first { selector(it) == maxValue }
    }
}

inline fun <T> Iterable<T>.groupByMap(
    crossinline keySelector: (T) -> K
): Map<K, List<T>> where K : Comparable<K> {
    return groupBy(keySelector).toSortedMap()
}

// Generic result builder
class ResultBuilder<T> {
    private val results = mutableListOf<T>()
    private var onComplete: ((List<T>) -> Unit)? = null
    
    fun add(item: T) {
        results.add(item)
    }
    
    fun onComplete(action: (List<T>) -> Unit) {
        onComplete = action
    }
    
    fun build(): List<T> {
        onComplete?.invoke(results)
        return results.toList()
    }
}

inline fun <T> buildResults(builder: ResultBuilder<T>.() -> Unit): List<T> {
    return ResultBuilder<T>().apply(builder).build()
}

// Usage
val items = buildResults<String> {
    add("First")
    add("Second")
    onComplete { list ->
        println("Built ${list.size} items")
    }
}
```

## Best Practices

- Prefer immutable `val` over mutable `var`
- Use null safety features; avoid `!!` except in rare cases
- Leverage data classes for DTOs and simple value objects
- Use coroutines with structured concurrency for async operations
- Follow Kotlin naming conventions (camelCase, PascalCase for classes)
- Use extension functions for cleaner API design
- Leverage default arguments instead of function overloading
- Use sealed classes for state machines and restricted hierarchies
- Profile with Android Studio Profiler or JVM tools
- Write unit tests with JUnit 5 and MockK

## Core Competencies

- Null safety and nullable types
- Data classes and destructuring
- Coroutines and structured concurrency
- Extension functions and properties
- Higher-order functions and lambdas
- Sealed classes and pattern matching
- Generics with constraints
- Delegation and delegated properties
- Inline functions and reified types
- Interoperability with Java
- Kotlin Multiplatform
- Android development with KTX
- Build script DSLs
- Testing with JUnit and MockK
- Collections and sequences
