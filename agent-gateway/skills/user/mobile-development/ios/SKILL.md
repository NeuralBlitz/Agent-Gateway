---
name: ios
description: Apple's mobile operating system and development platform
tags: [ios, iphone, ipad, swift, xcode, apple]
---

# iOS Development

## What I do

I provide comprehensive guidance for developing applications for Apple's iOS platform, including iPhone and iPad devices. I cover Swift and Objective-C programming, Xcode IDE, UIKit and SwiftUI frameworks, App Store submission, and platform-specific patterns and best practices.

## When to use me

Use me when building native iOS applications, optimizing for iPhone and iPad, integrating Apple frameworks (ARKit, CoreML, SwiftUI), submitting to the App Store, or adopting iOS-specific design patterns like MVVM and coordinator pattern.

## Core Concepts

Swift programming language fundamentals and advanced features including protocols, generics, and property wrappers. UIKit view controller lifecycle and navigation patterns. SwiftUI declarative UI development. Auto Layout and modern layout techniques using SwiftUI and UIKit. Grand Central Dispatch for concurrency. Core Data for local persistence. Network requests using URLSession and Combine framework.

## Code Examples

SwiftUI view with state management:

```swift
import SwiftUI

struct ContentView: View {
    @State private var count = 0
    @EnvironmentObject var userSession: UserSession
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Count: \(count)")
                    .font(.largeTitle)
                
                Button(action: { count += 1 }) {
                    Text("Increment")
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                
                if userSession.isAuthenticated {
                    Text("Welcome, \(userSession.username)")
                        .foregroundColor(.green)
                }
            }
            .navigationTitle("Counter")
        }
    }
}
```

Network layer with async/await:

```swift
import Foundation

actor NetworkService {
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    func fetch<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
}

enum NetworkError: Error {
    case invalidResponse
    case decodingError(Error)
}
```

## Best Practices

Use SwiftUI for new projects and adopt it incrementally in UIKit apps. Implement proper memory management with ARC and avoid retain cycles using weak references. Structure apps using MVVM with dependency injection for testability. Handle async operations with async/await or Combine publishers. Optimize app launch time by deferring non-essential initialization. Implement proper error handling and logging for production apps. Use App Groups for data sharing between apps and extensions.

## Common Patterns

Coordinator pattern for navigation decoupling from view controllers. Repository pattern for data layer abstraction. Dependency injection using protocols for testability. MVVM architecture with Combine or async/await for reactive bindings. Strategy pattern for runtime behavior changes. Observer pattern with NotificationCenter or Combine for cross-component communication.
