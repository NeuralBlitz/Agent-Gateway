---
name: Swift
description: General-purpose programming language developed by Apple for iOS, macOS, watchOS, tvOS, and server-side development.
license: Apache License 2.0
compatibility: Swift 5.7+
audience: iOS/macOS developers, server-side developers with Vapor
category: Programming Languages
---

# Swift

## What I do

I am a general-purpose programming language developed by Apple, first released in 2014. I was designed as a modern replacement for Objective-C, featuring safety, performance, and expressiveness. I am used for iOS, macOS, watchOS, and tvOS app development, with growing use for server-side development with Vapor and other frameworks. I feature optionals for safe null handling, protocol-oriented programming, value types (structs) by default, generics, and powerful error handling.

## When to use me

Use Swift when building iOS, macOS, watchOS, or tvOS applications, server-side applications with Vapor, when you need memory safety and modern language features, or when building applications that benefit from protocol-oriented design.

## Core Concepts

- **Optionals**: Types that may contain a value or nil, using ? for declaration and ! for unwrapping.
- **Value Semantics**: Structs and enums have value semantics, copied on assignment; classes have reference semantics.
- **Protocol-Oriented Programming**: Protocols define interfaces that types conform to, enabling composition.
- **Generics**: Generic functions and types that work with any type while maintaining type safety.
- **Type Inference**: Compiler infers types in most cases, reducing verbosity while maintaining safety.
- **Closures**: First-class functions with capture semantics, concise syntax for passing operations.
- **Error Handling**: Throwing, catching, and propagating errors using try, catch, and throws.
- **Access Control**: Public, internal, fileprivate, and private access levels for encapsulation.
- **Property Observers**: willSet and didSet for observing and responding to property changes.
- **Automatic Reference Counting (ARC)**: Memory management for class instances with strong/weak/unowned references.

## Code Examples

**Optionals and Safe Unwrapping:**
```swift
let name: String? = nil
let length = name?.count ?? 0
print("Length: \(length)")

let items: [String?] = ["hello", nil, "world"]

items.forEach { item in
    if let unwrapped = item {
        print("Item: \(unwrapped.uppercased())")
    } else {
        print("Nil item found")
    }
}

let numbers: [Int?] = [1, 2, nil, 4, 5]
let nonNilNumbers = numbers.compactMap { $0 }
print("Non-nil: \(nonNilNumbers)")

func printLength(_ str: String?) {
    guard let unwrapped = str else {
        print("String is nil")
        return
    }
    print("Length: \(unwrapped.count)")
}

printLength("Swift")
printLength(nil)

let value: Any = "Hello"

if let stringValue = value as? String {
    print("String: \(stringValue)")
}

switch value {
case let str as String:
    print("String: \(str)")
case let num as Int:
    print("Int: \(num)")
default:
    print("Unknown type")
}
```

**Structs, Classes, and Protocols:**
```swift
struct Point {
    var x: Int
    var y: Int
    
    var description: String {
        "Point(x: \(x), y: \(y))"
    }
    
    mutating func moveBy(x deltaX: Int, y deltaY: Int) {
        x += deltaX
        y += deltaY
    }
}

class Circle {
    var center: Point
    var radius: Double
    
    init(center: Point, radius: Double) {
        self.center = center
        self.radius = radius
    }
    
    var area: Double {
        Double.pi * radius * radius
    }
    
    func contains(_ point: Point) -> Bool {
        let dx = Double(point.x - center.x)
        let dy = Double(point.y - center.y)
        return sqrt(dx * dx + dy * dy) <= radius
    }
}

protocol Drawable {
    func draw()
    var color: String { get set }
}

struct Rectangle: Drawable {
    var width: Double
    var height: Double
    var color: String
    
    var area: Double {
        width * height
    }
    
    func draw() {
        print("Drawing rectangle \(color) with area \(area)")
    }
}

struct Triangle: Drawable {
    var side1: Double
    var side2: Double
    var side3: Double
    var color: String
    
    var color: String
    
    func draw() {
        print("Drawing triangle")
    }
}

let shapes: [Drawable] = [
    Rectangle(width: 10, height: 20, color: "red"),
    Triangle(side1: 3, side2: 4, side3: 5, color: "blue")
]

shapes.forEach { $0.draw() }
```

**Generics and Type Constraints:**
```swift
struct Stack<Element> {
    private var items: [Element] = []
    
    mutating func push(_ item: Element) {
        items.append(item)
    }
    
    mutating func pop() -> Element? {
        items.popLast()
    }
    
    var isEmpty: Bool {
        items.isEmpty
    }
    
    var top: Element? {
        items.last
    }
}

func swapValues<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}

func findFirst<T: Equatable>(_ array: [T], _ value: T) -> Int? {
    for (index, element) in array.enumerated() {
        if element == value {
            return index
        }
    }
    return nil
}

protocol Comparable {
    static func < (lhs: Self, rhs: Self) -> Bool
}

func findMin<T: Comparable>(_ array: [T]) -> T? {
    guard var min = array.first else { return nil }
    for element in array {
        if element < min {
            min = element
        }
    }
    return min
}

var stack = Stack<Int>()
stack.push(1)
stack.push(2)
stack.push(3)

while let top = stack.pop() {
    print("Popped: \(top)")
}

var a = 5
var b = 10
swapValues(&a, &b)
print("a: \(a), b: \(b)")

let numbers = [1, 2, 3, 4, 5]
if let index = findFirst(numbers, 3) {
    print("Found at index: \(index)")
}
```

**Error Handling:**
```swift
enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError
    case serverError(Int)
}

struct User: Decodable {
    let id: Int
    let name: String
    let email: String
}

func fetchUser(id: Int) async throws -> User {
    guard let url = URL(string: "https://api.example.com/users/\(id)") else {
        throw NetworkError.invalidURL
    }
    
    let (data, response) = try await URLSession.shared.data(from: url)
    
    guard let httpResponse = response as? HTTPURLResponse else {
        throw NetworkError.noData
    }
    
    guard (200...299).contains(httpResponse.statusCode) else {
        throw NetworkError.serverError(httpResponse.statusCode)
    }
    
    let decoder = JSONDecoder()
    guard let user = try? decoder.decode(User.self, from: data) else {
        throw NetworkError.decodingError
    }
    
    return user
}

func fetchMultipleUsers(ids: [Int]) async -> [User] {
    var users: [User] = []
    
    for id in ids {
        do {
            let user = try await fetchUser(id: id)
            users.append(user)
        } catch {
            print("Failed to fetch user \(id): \(error)")
        }
    }
    
    return users
}

Task {
    do {
        let user = try await fetchUser(id: 1)
        print("User: \(user.name)")
    } catch {
        print("Error: \(error)")
    }
}
```

## Best Practices

1. **Prefer Structs Over Classes**: Use structs with value semantics by default, classes only when inheritance is needed.
2. **Use Optionals Properly**: Never force unwrap (!) except in tests; use optional chaining and guard let.
3. **Use Protocol Extensions**: Extend protocols to provide default implementations for shared functionality.
4. **Use Access Control**: Mark internal implementation details as private or fileprivate.
5. **Use Type Inference**: Let compiler infer types when obvious; add explicit types for clarity.
6. **Use Property Observers**: Use willSet/didSet for side effects on property changes.
7. **Use @State/@ObservedObject for SwiftUI**: Use appropriate property wrappers for SwiftUI state management.
8. **Use Async/Await for Concurrency**: Prefer async/await over completion handlers for asynchronous code.
9. **Follow Swift Naming Guidelines**: Use camelCase, descriptive names, and follow API Design Guidelines.
10. **Use SwiftLint**: Run SwiftLint to enforce code style and catch common mistakes.
