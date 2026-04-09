---
name: Swift
description: Apple's powerful and intuitive programming language for iOS, macOS, and beyond
license: MIT
compatibility: Swift 5.9+, macOS 12+, iOS 15.0+
audience: Developers building Apple platform applications
category: Mobile Development
---

# Swift Programming

## What I Do

I provide comprehensive guidance for writing Swift code for Apple platforms. I cover Swift syntax, protocols, generics, concurrency, and memory management patterns essential for iOS and macOS development.

## When to Use Me

- Learning Swift fundamentals
- Writing type-safe iOS/macOS applications
- Implementing protocol-oriented design
- Working with modern Swift concurrency
- Optimizing Swift performance

## Core Concepts

- **Type Inference**: Automatic type deduction with strong typing
- **Protocols**: Defining contracts for types
- **Generics**: Writing flexible, reusable code
- **Structs and Classes**: Value vs reference semantics
- **Enums with Associated Values**: Pattern matching and state modeling
- **Closures**: First-class functions and completion handlers
- **Error Handling**: Throwing, catching, and propagating errors
- **Access Control**: public, private, internal, fileprivate
- **Property Observers**: willSet and didSet for property monitoring
- **Concurrency**: async/await, actors, and task groups

## Code Examples

### Protocol-Oriented Design

```swift
protocol Identifiable {
    var id: String { get }
}

protocol Loggable {
    func log(message: String)
}

extension Loggable {
    func log(message: String) {
        print("[\(Date())] \(message)")
    }
}

struct User: Identifiable, Loggable {
    let id: String
    var name: String
    var email: String
    
    init(id: String = UUID().uuidString, name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
    }
}

protocol Storageable: Identifiable {
    associatedtype Item
    func save(_ item: Item) throws
    func load(by id: String) throws -> Item
}

class UserStorage: Storageable {
    private var storage: [String: User] = [:]
    
    func save(_ user: User) throws {
        storage[user.id] = user
    }
    
    func load(by id: String) throws -> User {
        guard let user = storage[id] else {
            throw StorageError.userNotFound
        }
        return user
    }
}

enum StorageError: Error {
    case userNotFound
    case encodingFailed
}
```

### Generics with Constraints

```swift
struct Stack<Element> {
    private var items: [Element] = []
    
    mutating func push(_ item: Element) {
        items.append(item)
    }
    
    mutating func pop() -> Element? {
        items.popLast()
    }
    
    var isEmpty: Bool { items.isEmpty }
    
    var count: Int { items.count }
    
    func peek() -> Element? {
        items.last
    }
}

extension Stack: ExpressibleByArrayLiteral {
    init(arrayLiteral elements: Element...) {
        items = elements
    }
}

struct Pair<T: Comparable> {
    let first: T
    let second: T
    
    var max: T { max(first, second) }
    var min: T { min(first, second) }
    
    func sorted() -> [T] {
        [first, second].sorted()
    }
}
```

### Modern Concurrency with Actors

```swift
actor UserStore {
    private var users: [String: User] = [:]
    private let logger: Logger
    
    init(logger: Logger = .init()) {
        self.logger = logger
    }
    
    nonisolated func userCount() -> Int {
        users.count
    }
    
    func addUser(_ user: User) async throws {
        guard !users.keys.contains(user.id) else {
            throw UserError.duplicateUser
        }
        users[user.id] = user
        await logger.log("Added user: \(user.id)")
    }
    
    func getUser(id: String) async throws -> User {
        guard let user = users[id] else {
            throw UserError.notFound
        }
        return user
    }
    
    func updateUser(_ user: User) async throws {
        guard users.keys.contains(user.id) else {
            throw UserError.notFound
        }
        users[user.id] = user
    }
    
    func deleteUser(id: String) async throws {
        guard users.removeValue(forKey: id) != nil else {
            throw UserError.notFound
        }
    }
}

enum UserError: Error, LocalizedError {
    case notFound
    case duplicateUser
    case invalidData
    
    var errorDescription: String? {
        switch self {
        case .notFound: return "User not found"
        case .duplicateUser: return "User already exists"
        case .invalidData: return "Invalid user data"
        }
    }
}
```

### Result Builders for DSLs

```swift
@resultBuilder
struct ViewBuilder {
    static func buildBlock(_ components: any View...) -> some View {
        VStack(alignment: .leading) {
            for component in components {
                component
            }
        }
    }
    
    static func buildOptional(_ component: (any View)?) -> some View {
        if let component = component {
            return component
        }
        return EmptyView()
    }
    
    static func buildEither(first component: some View) -> some View {
        component
    }
    
    static func buildEither(second component: some View) -> some View {
        component
    }
}

struct Card<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            content
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}
```

## Best Practices

1. **Prefer Structs Over Classes**: Value semantics prevent unexpected mutations
2. **Use Protocol Extensions**: Provide default implementations for protocols
3. **Mark Properties as Private**: Encapsulate implementation details
4. **Use Final for Performance**: Enable compiler optimizations
5. **Avoid Implicitly Unwrapped Optionals**: Be explicit about optionality
6. **Use Typealias for Clarity**: Improve code readability
7. **Leverage Property Wrappers**: Encapsulate common property patterns
8. **Use SwiftLint**: Enforce style guidelines
9. **Optimize Hot Paths**: Mark performance-critical code with @inline(__always)
10. **Write Documentation Comments**: Use markup for API documentation
