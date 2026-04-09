---
name: swift
description: Apple's powerful and intuitive programming language
category: mobile-development
difficulty: intermediate
tags: [apple, language, ios, macos]
author: Apple Inc.
version: 5.9
last_updated: 2024-01-15
---

# Swift

## What I Do

I am Swift, Apple's modern programming language designed for safety, performance, and expressiveness. I was introduced in 2014 as a replacement for Objective-C, offering memory safety by default, automatic memory management through ARC, and a clean syntax that reduces common programming errors. I combine the best in procedural and object-oriented programming with functional programming patterns. My optional types and type inference help prevent null pointer exceptions while maintaining flexibility. I support protocol-oriented programming for designing flexible abstractions. I interoperate seamlessly with Objective-C and C codebases. My open-source nature enables community contributions and server-side development with Vapor. I'm the primary language for all Apple platform development including iOS, macOS, watchOS, and tvOS.

## When to Use Me

- Building native iOS, macOS, watchOS, and tvOS applications
- Writing high-performance systems code
- Projects requiring memory safety guarantees
- Protocol-oriented software design
- Server-side development with Vapor
- Apple platform game development with SpriteKit and SceneKit
- Bridging native iOS/macOS with JavaScript via JavaScriptCore
- Machine learning with Swift for TensorFlow

## Core Concepts

**Optionals**: Type system extension representing a value that may or may not exist using `?` and `!`.

**Protocols**: Contracts defining requirements that types must implement, enabling protocol-oriented programming.

**Generics**: Write flexible, reusable functions and types that work with any type.

**Value Semantics**: Structs and enums copy on assignment, preventing unintended mutations.

**Closures**: Self-contained blocks of functionality that can capture and store references.

**Error Handling**: Do-catch-throw pattern for handling recoverable errors.

**Property Observers**: `willSet` and `didSet` for reacting to property value changes.

**Access Control**: `open`, `public`, `internal`, `fileprivate`, `private` visibility levels.

## Code Examples

### Example 1: Protocol-Oriented Design with Generics
```swift
// Protocol definitions
protocol Identifiable {
    var id: String { get }
}

protocol Persistable: Identifiable {
    associatedtype T
    func save() throws
    static func load(byId id: String) throws -> T
    func delete() throws
}

protocol Validatable {
    var isValid: Bool { get }
    func validate() throws
}

// Default implementations via protocol extensions
extension Validatable {
    func validate() throws {
        guard isValid else {
            throw ValidationError.invalidState
        }
    }
}

enum ValidationError: LocalizedError {
    case invalidState
    case missingRequired(String)
    case outOfRange(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidState:
            return "The current state is invalid"
        case .missingRequired(let field):
            return "Required field is missing: \(field)"
        case .outOfRange(let field):
            return "Value out of range for: \(field)"
        }
    }
}

// Generic repository
final class Repository<T: Persistable> {
    private let storage: StorageService
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    init(storage: StorageService) {
        self.storage = storage
    }
    
    func save(_ item: T) throws {
        let data = try encoder.encode(item)
        try storage.save(data, key: item.id)
    }
    
    func load(byId id: String) throws -> T {
        let data = try storage.load(key: id)
        return try decoder.decode(T.self, from: data)
    }
    
    func delete(byId id: String) throws {
        try storage.delete(key: id)
    }
    
    func loadAll() throws -> [T] {
        let keys = try storage.allKeys()
        return try keys.compactMap { key in
            try? load(byId: key)
        }
    }
}

// User model conforming to protocols
struct User: Identifiable, Persistable, Validatable {
    let id: String
    var name: String
    var email: String
    var age: Int
    
    var isValid: Bool {
        !name.isEmpty && email.contains("@") && (18...120).contains(age)
    }
    
    init(id: String = UUID().uuidString, name: String, email: String, age: Int) {
        self.id = id
        self.name = name
        self.email = email
        self.age = age
    }
}
```

### Example 2: Error Handling with Result Type
```swift
// Error definitions
enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)
    case networkError(Error)
    case unauthorized
    case rateLimited(retryAfter: TimeInterval)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "Authentication required"
        case .rateLimited(let retryAfter):
            return "Rate limited. Retry after \(Int(retryAfter)) seconds"
        }
    }
}

// Result-based API client
final class APIClient {
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        let url = try endpoint.url()
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError(error)
            }
        case 401:
            throw APIError.unauthorized
        case 429:
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After").flatMap(TimeInterval.init) ?? 60
            throw APIError.rateLimited(retryAfter: retryAfter)
        default:
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
    }
}

// Endpoint configuration
struct Endpoint {
    let path: String
    let method: HTTPMethod
    let queryItems: [URLQueryItem]?
    let body: Data?
    
    enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case delete = "DELETE"
    }
    
    func url() throws -> URL {
        guard var components = URLComponents(string: "https://api.example.com\(path)") else {
            throw APIError.invalidURL
        }
        components.queryItems = queryItems
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        return url
    }
}

// Usage
struct User: Codable {
    let id: String
    let name: String
    let email: String
}

func fetchUsers() async throws -> [User] {
    let endpoint = Endpoint(
        path: "/users",
        method: .get,
        queryItems: nil,
        body: nil
    )
    return try await APIClient().request(endpoint)
}

Task {
    do {
        let users = try await fetchUsers()
        print("Loaded \(users.count) users")
    } catch {
        print("Failed to fetch users: \(error.localizedDescription)")
    }
}
```

### Example 3: Property Wrappers for Validation
```swift
// Property wrapper for validation
@propertyWrapper
struct Validated<Value> {
    private var value: Value
    private let validator: (Value) -> Result<Value, Error>
    
    var wrappedValue: Value {
        get { value }
        set {
            value = newValue
        }
    }
    
    init(wrappedValue: Value, validator: @escaping (Value) -> Result<Value, Error>) {
        self.value = wrappedValue
        self.validator = validator
    }
    
    mutating func validate() throws {
        value = try validator(value).get()
    }
}

// Common validators
struct Validators {
    static func email(_ value: String) -> Result<String, Error> {
        let pattern = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        guard value.range(of: pattern, options: .regularExpression) != nil else {
            throw ValidationError.invalidEmail
        }
        return .success(value)
    }
    
    static func range<T: Comparable>(_ range: ClosedRange<T>) -> (T) -> Result<T, Error> {
        { value in
            guard range.contains(value) else {
                throw ValidationError.outOfRange("Value must be between \(range.lowerBound) and \(range.upperBound)")
            }
            return .success(value)
        }
    }
    
    static func nonEmpty(_ value: String) -> Result<String, Error> {
        guard !value.trimmingCharacters(in: .whitespaces).isEmpty else {
            throw ValidationError.emptyString
        }
        return .success(value)
    }
}

enum ValidationError: Error, LocalizedError {
    case invalidEmail
    case outOfRange(String)
    case emptyString
    
    var errorDescription: String? {
        switch self {
        case .invalidEmail:
            return "Invalid email format"
        case .outOfRange(let message):
            return message
        case .emptyString:
            return "String cannot be empty"
        }
    }
}

// Using the property wrapper
struct UserRegistration {
    @Validated(validator: Validators.nonEmpty) var name: String = ""
    @Validated(validator: Validators.email) var email: String = ""
    @Validated(validator: Validators.range(18...120)) var age: Int = 18
    
    func validate() throws {
        try $name.validate()
        try $email.validate()
        try $age.validate()
    }
}
```

### Example 4: Functional Programming with Result Builders
```swift
// Result builder for network operations
@resultBuilder
struct NetworkTaskBuilder {
    static func buildBlock(_ components: NetworkTask...) -> [NetworkTask] {
        components
    }
    
    static func buildOptional(_ component: NetworkTask?) -> NetworkTask {
        component ?? EmptyTask()
    }
    
    static func buildEither(first component: NetworkTask) -> NetworkTask {
        component
    }
    
    static func buildEither(second component: NetworkTask) -> NetworkTask {
        component
    }
}

// Network task protocol
protocol NetworkTask {
    func execute() async throws -> [User]
}

struct EmptyTask: NetworkTask {
    func execute() async throws -> [User] { [] }
}

struct FetchUsersTask: NetworkTask {
    let filter: UserFilter?
    
    func execute() async throws -> [User] {
        // Fetch users implementation
        []
    }
}

class UserService {
    @NetworkTaskBuilder
    func fetchAllTasks() -> [NetworkTask] {
        FetchUsersTask(filter: nil)
        FetchUsersTask(filter: .active)
    }
    
    func executeAll() async throws -> [[User]] {
        let tasks = fetchAllTasks()
        return try await withThrowingTaskGroup(of: [User].self) { group in
            for task in tasks {
                group.addTask {
                    try await task.execute()
                }
            }
            
            var results: [[User]] = []
            for try await result in group {
                results.append(result)
            }
            return results
        }
    }
}

// Async sequence for pagination
struct PaginatedUsers: AsyncSequence {
    let pageSize: Int
    let api: UserAPI
    
    struct AsyncIterator: AsyncIteratorProtocol {
        var currentPage = 0
        let pageSize: Int
        let api: UserAPI
        var hasMore = true
        
        mutating func next() async throws -> [User]? {
            guard hasMore else { return nil }
            
            let users = try await api.fetchUsers(page: currentPage, size: pageSize)
            hasMore = users.count == pageSize
            currentPage += 1
            return users
        }
    }
    
    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(pageSize: pageSize, api: api)
    }
}

// Usage
for try await users in PaginatedUsers(pageSize: 20, api: api) {
    print("Received \(users.count) users")
}
```

### Example 5: Concurrency with Actors and Sendable
```swift
// Actor for thread-safe state
actor UserStore {
    private var users: [String: User] = [:]
    private var cache: [String: CacheEntry<User>]
    
    struct CacheEntry<T> {
        let value: T
        let timestamp: Date
        
        var isExpired: Bool {
            Date().timeIntervalSince(timestamp) > 300 // 5 minutes
        }
    }
    
    nonisolated let identifier = "UserStore"
    
    init() {
        self.cache = [:]
    }
    
    func add(_ user: User) {
        users[user.id] = user
        cache[user.id] = CacheEntry(value: user, timestamp: Date())
    }
    
    func get(byId id: String) -> User? {
        users[id]
    }
    
    func update(_ user: User) throws {
        guard users[user.id] != nil else {
            throw UserStoreError.userNotFound
        }
        users[user.id] = user
    }
    
    func delete(byId id: String) throws {
        guard users[id] != nil else {
            throw UserStoreError.userNotFound
        }
        users.removeValue(forKey: id)
        cache.removeValue(forKey: id)
    }
    
    func getCached(byId id: String) -> User? {
        guard let entry = cache[id], !entry.isExpired else { return nil }
        return entry.value
    }
    
    var userCount: Int {
        users.count
    }
    
    var allUsers: [User] {
        Array(users.values)
    }
}

enum UserStoreError: Error, LocalizedError {
    case userNotFound
    case concurrencyConflict
    
    var errorDescription: String? {
        switch self {
        case .userNotFound:
            return "User not found"
        case .concurrencyConflict:
            return "Concurrent modification detected"
        }
    }
}

// Sendable types for concurrent contexts
struct User: Sendable, Codable {
    let id: String
    let name: String
    let email: String
}

final class UserService: @unchecked Sendable {
    private let store: UserStore
    private let api: APIClient
    
    init(store: UserStore, api: APIClient) {
        self.store = store
        self.api = api
    }
    
    func refreshUsers() async throws {
        let users = try await api.fetchUsers()
        await store.add(contentsOf: users)
    }
}

// Usage in Swift concurrency
Task {
    let store = UserStore()
    let service = UserService(store: store, api: APIClient())
    
    await service.refreshUsers()
    let count = await store.userCount
    print("Store has \(count) users")
}
```

## Best Practices

- Use `let` over `var` for immutability when possible
- Prefer value types (structs, enums) over reference types (classes)
- Use protocols for abstraction, not inheritance
- Handle optionals safely with `if let`, `guard let`, and optional chaining
- Write tests using XCTest with async/await support
- Use access control to encapsulate implementation details
- Leverage property wrappers for reusable cross-cutting concerns
- Profile with Instruments for memory and performance optimization
- Use Swift Package Manager for dependency management
- Enable strict concurrency checking with Complete concurrency model

## Core Competencies

- Optionals and optional chaining
- Protocol-oriented programming
- Generics and associated types
- Closures and functional patterns
- Error handling with Result and throws
- Property wrappers
- Result builders
- Actors and Sendable for concurrency
- Access control and encapsulation
- Memory management with ARC
- Interoperability with Objective-C
- Type inference and inference reduction
- Swift Package Manager
- Testing with XCTest
- Performance profiling with Instruments
