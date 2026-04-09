---
name: android
description: Google's mobile operating system and development platform
category: mobile-development
difficulty: advanced
tags: [google, mobile, kotlin, java]
author: Google
version: 14
last_updated: 2024-01-15
---

# Android Development

## What I Do

I am Android, Google's open-source mobile operating system powering billions of devices worldwide. I represent the complete ecosystem for building native mobile applications using Kotlin and Jetpack Compose or XML layouts. I provide a Linux-based foundation with Java APIs for accessing device hardware, sensors, and system services. My development toolkit includes Android Studio, the official IDE with advanced debugging, profiling, and emulators. I emphasize backward compatibility through the AndroidX libraries, ensuring apps work across the vast Android device landscape. Modern Android development uses Kotlin as the preferred language, Jetpack Compose for declarative UIs, and MVVM architecture for clean separation of concerns. I support diverse form factors from phones to tablets to foldables, with responsive layouts adapting to each screen size.

## When to Use Me

- Building native Android applications
- Cross-platform targeting with Kotlin Multiplatform
- Apps requiring deep integration with Google services
- IoT and embedded Android devices
- Enterprise mobility solutions
- Media and entertainment applications
- Health and fitness apps with sensor access
- Location-based services
- Apps requiring Google Play Store distribution

## Core Concepts

**Kotlin**: Modern, concise programming language fully supported for Android development with coroutines for async operations.

**Jetpack Compose**: Declarative UI toolkit for building native Android interfaces with less code and intuitive APIs.

**Activities & Fragments**: Core components representing screens and reusable UI portions with their own lifecycles.

**ViewModel & LiveData**: Architecture components for storing UI-related data and observing changes across configuration changes.

**Coroutines**: Lightweight threads for asynchronous programming, simplifying background operations and threading.

**Room Database**: SQLite abstraction layer with compile-time checks for local data persistence.

**Navigation Component**: Framework for consistent navigation patterns across app screens and destinations.

**AndroidX**: Support library suite providing backward-compatible components for modern Android features.

## Code Examples

### Example 1: Jetpack Compose UI with ViewModel
```kotlin
// UserListScreen.kt
@Composable
fun UserListScreen(
    viewModel: UserListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Users") },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { /* Add user */ }) {
                Icon(Icons.Default.Add, contentDescription = "Add User")
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.error != null -> {
                    ErrorMessage(
                        message = uiState.error!!.localizedMessage!!,
                        onRetry = { viewModel.refresh() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.users.isEmpty() -> {
                    EmptyState(
                        message = "No users found",
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.users) { user ->
                            UserCard(
                                user = user,
                                onClick = { /* Navigate to detail */ }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UserCard(
    user: User,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = user.avatarUrl,
                contentDescription = "Avatar",
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    text = user.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
```

### Example 2: ViewModel with StateFlow
```kotlin
// UserListViewModel.kt
@HiltViewModel
class UserListViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(UserListUiState())
    val uiState: StateFlow<UserListUiState> = _uiState.asStateFlow()
    
    init {
        loadUsers()
    }
    
    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val users = userRepository.getUsers()
                _uiState.update { 
                    it.copy(
                        users = users,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e
                    )
                }
            }
        }
    }
    
    fun deleteUser(userId: String) {
        viewModelScope.launch {
            try {
                userRepository.deleteUser(userId)
                _uiState.update { state ->
                    state.copy(
                        users = state.users.filter { it.id != userId }
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e) }
            }
        }
    }
}

data class UserListUiState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val error: Throwable? = null
) {
    val isEmpty: Boolean get() = users.isEmpty() && !isLoading
}
```

### Example 3: Room Database with Coroutines
```kotlin
// UserDao.kt
@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY name ASC")
    fun getAllUsers(): Flow<List<User>>
    
    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: String): User?
    
    @Query("SELECT * FROM users WHERE email = :email")
    suspend fun getUserByEmail(email: String): User?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<User>)
    
    @Update
    suspend fun updateUser(user: User)
    
    @Delete
    suspend fun deleteUser(user: User)
    
    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteUserById(userId: String)
    
    @Query("SELECT COUNT(*) FROM users")
    suspend fun getUserCount(): Int
    
    @Query("SELECT * FROM users WHERE name LIKE '%' || :query || '%' OR email LIKE '%' || :query || '%'")
    fun searchUsers(query: String): Flow<List<User>>
}

// UserDatabase.kt
@Database(
    entities = [User::class, Post::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(DateConverter::class)
abstract class UserDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun postDao(): PostDao
    
    companion object {
        @Volatile
        private var INSTANCE: UserDatabase? = null
        
        fun getDatabase(context: Context): UserDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    UserDatabase::class.java,
                    "user_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// UserRepositoryImpl.kt
class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) : UserRepository {
    
    override fun getAllUsers(): Flow<List<User>> {
        return userDao.getAllUsers()
    }
    
    override suspend fun refreshUsers() {
        val usersFromApi = apiService.getUsers()
        userDao.insertUsers(usersFromApi)
    }
    
    override fun searchUsers(query: String): Flow<List<User>> {
        return userDao.searchUsers(query)
    }
}
```

### Example 4: Navigation with Jetpack Navigation
```kotlin
// Navigation.kt
@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") },
                    selected = currentRoute == Screen.Home.route,
                    onClick = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") },
                    selected = currentRoute == Screen.Profile.route,
                    onClick = {
                        navController.navigate(Screen.Profile.route) {
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToDetail = { userId ->
                        navController.navigate(Screen.UserDetail.createRoute(userId))
                    }
                )
            }
            composable(Screen.Profile.route) {
                ProfileScreen()
            }
            composable(
                route = Screen.UserDetail.routeWithArgs,
                arguments = listOf(
                    navArgument("userId") { type = NavType.StringType }
                )
            ) { backStackEntry ->
                val userId = backStackEntry.arguments?.getString("userId")
                UserDetailScreen(userId = userId!!)
            }
        }
    }
}

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Profile : Screen("profile")
    data object UserDetail : Screen("user_detail/{userId}") {
        fun createRoute(userId: String) = "user_detail/$userId"
        val routeWithArgs = "user_detail/{userId}"
    }
}
```

### Example 5: Dependency Injection with Hilt
```kotlin
// AppModule.kt
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .addInterceptor { chain ->
                val original = chain.request()
                val request = original.newBuilder()
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .method(original.method, original.body)
                    .build()
                chain.proceed(request)
            }
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.example.com/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

// RepositoryModule.kt
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    
    @Provides
    @Singleton
    fun provideUserRepository(
        userDao: UserDao,
        apiService: ApiService
    ): UserRepository {
        return UserRepositoryImpl(userDao, apiService)
    }
}

// Application.kt
@HiltAndroidApp
class MyApplication : Application()
```

## Best Practices

- Use Kotlin as the primary language for all new Android projects
- Adopt Jetpack Compose for UI development on modern projects
- Implement MVVM or MVI architecture with clean separation of concerns
- Use Hilt for dependency injection across the app
- Leverage Kotlin coroutines and Flow for asynchronous operations
- Implement Room for local data persistence with type safety
- Follow Material Design guidelines for consistent UX
- Use AndroidX libraries for backward compatibility
- Optimize for performance with proper lifecycle management
- Write unit tests with JUnit, Mockito, and Turbine
- Use lint checks and Compose lint rules for code quality

## Core Competencies

- Kotlin programming language
- Jetpack Compose declarative UI
- Activities and Fragments lifecycle management
- ViewModel and StateFlow state management
- Room database with Kotlin coroutines
- Navigation Component for screen navigation
- Hilt dependency injection
- Retrofit for networking
- WorkManager for background tasks
- Paging 3 for efficient data loading
- Android security best practices
- Performance optimization and profiling
- Google Play Store publishing
