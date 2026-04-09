---
name: swift
description: Apple's powerful and intuitive programming language
tags: [swift, ios, macos, apple, programming-language, xcode]
---

# Swift Programming

## What I do

I provide guidance for programming in Swift, Apple's modern programming language. I cover language fundamentals, advanced features (generics, protocols, result builders), memory management, concurrency with async/await and actors, and Swift Package Manager for dependency management.

## When to use me

Use me when developing iOS, macOS, watchOS, or tvOS applications in Swift, writing performant and safe code leveraging Swift-specific features, or integrating Swift packages into Apple platform projects.

## Core Concepts

Swift type system with value types (structs, enums) and reference types (classes). Protocol-oriented programming with protocol extensions and associated types. Generics with type constraints and where clauses. Property wrappers for reusable property logic. Result builders for DSL-like syntax. Structured concurrency with async/await and Task groups. Actor isolation for thread-safe state access. Memory management with ARC and weak/unowned references.

## Code Examples

Protocol-oriented design with generics:

```swift
import Foundation

protocol Identifiable {
    associatedtype ID: Hashable
    var id: ID { get }
}

struct User: Identifiable, Hashable {
    let id: UUID
    let name: String
    let email: String
}

struct Product: Identifiable, Hashable {
    let id: String
    let name: String
    let price: Decimal
}

final class Cache<T: Identifiable> where T.ID == UUID {
    private var storage: [UUID: T] = [:]
    private let lock = NSLock()
    
    func insert(_ item: T) {
        lock.lock()
        defer { lock.unlock() }
        storage[item.id] = item
    }
    
    func retrieve(id: UUID) -> T? {
        lock.lock()
        defer { lock.unlock() }
        return storage[id]
    }
    
    func allItems() -> [T] {
        lock.lock()
        defer { lock.unlock() }
        return Array(storage.values)
    }
}

extension Cache: Sequence where T: Identifiable, T.ID == UUID {
    func makeIterator() -> AnyIterator<T> {
        let items = allItems()
        var index = 0
        return AnyIterator {
            defer { index += 1 }
            return index < items.count ? items[index] : nil
        }
    }
}
```

Async/await with actors:

```swift
import Foundation

actor ImageProcessor {
    private var cache: [URL: Data] = [:]
    private let networkManager: NetworkManager
    
    init(networkManager: NetworkManager = .shared) {
        self.networkManager = networkManager
    }
    
    func processImage(from url: URL) async throws -> UIImage {
        if let cached = cache[url] {
            return try await decodeImage(from: cached)
        }
        
        let data = try await networkManager.download(from: url)
        cache[url] = data
        
        let image = try await decodeImage(from: data)
        return image
    }
    
    private func decodeImage(from data: Data) async throws -> UIImage {
        try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                guard let image = UIImage(data: data) else {
                    continuation.resume(throwing: ImageError.decodingFailed)
                    return
                }
                continuation.resume(returning: image)
            }
        }
    }
}

enum ImageError: Error {
    case decodingFailed
    case invalidData
}

struct NetworkManager {
    static let shared = NetworkManager()
    
    func download(from url: URL) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        return data
    }
}
```

## Best Practices

Prefer structs and protocols over classes for value semantics and safer code. Use final classes only when inheritance is truly needed. Leverage protocol extensions for default implementations. Use Result type for error handling in completion handlers. Adopt async/await for asynchronous code. Use actors for protecting mutable state across threads. Utilize generics for type-safe, reusable code. Use @MainActor to ensure UI updates happen on the main thread.

## Common Patterns

Protocol-oriented programming with protocol extensions for default implementations. Builder pattern using memberwise initializers and default parameters. Factory pattern with static factory methods. Strategy pattern with closures or protocol implementations. Observer pattern with Combine publishers or NotificationCenter. Singleton pattern with static constants. Decorator pattern with protocol composition.
