---
name: iOS
description: Apple's mobile operating system and development platform using Swift and Objective-C
license: MIT
compatibility: macOS with Xcode, iOS 15.0+
audience: Mobile developers building native iOS applications
category: Mobile Development
---

# iOS Development

## What I Do

I provide comprehensive guidance for developing native iOS applications using Apple's frameworks and tools. I cover Swift programming, UIKit and SwiftUI frameworks, Xcode IDE, App Store submission, and iOS-specific patterns and best practices.

## When to Use Me

- Building native iOS applications from scratch
- Migrating existing apps to newer iOS versions
- Implementing iOS-specific features like Siri, Face ID, or ARKit
- Optimizing app performance for Apple devices
- Preparing apps for App Store distribution

## Core Concepts

- **Swift Programming**: Modern, type-safe language for iOS development
- **UIKit**: Legacy but powerful framework for building iOS user interfaces
- **SwiftUI**: Declarative framework for building modern iOS UIs
- **Xcode IDE**: Apple's integrated development environment
- **View Controllers**: Managing screen content and navigation
- **Auto Layout**: Building adaptive interfaces for different screen sizes
- **Core Data**: Local data persistence framework
- **Networking**: URLSession and async/await patterns
- **App Lifecycle**: Managing app states and transitions
- **Code Signing**: Preparing apps for device testing and distribution

## Code Examples

### SwiftUI Basic View

```swift
import SwiftUI

struct ContentView: View {
    @State private var name = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Personal Info")) {
                    TextField("Enter your name", text: $name)
                }
                Section {
                    Button(action: greetUser) {
                        Text("Greet")
                    }
                }
            }
            .navigationTitle("Hello")
        }
    }
    
    private func greetUser() {
        print("Hello, \(name)!")
    }
}
```

### Networking with Async/Await

```swift
import Foundation

struct User: Codable {
    let id: Int
    let name: String
    let email: String
}

actor UserService {
    private let baseURL = "https://api.example.com"
    
    func fetchUser(id: Int) async throws -> User {
        let url = URL(string: "\(baseURL)/users/\(id)")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(User.self, from: data)
    }
}
```

### Core Data Model

```swift
import CoreData

@objc(Person)
public class Person: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var age: Int32
    @NSManaged public var createdAt: Date
}

extension Person {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Person> {
        return NSFetchRequest<Person>(entityName: "Person")
    }
    
    static func create(in context: NSManagedObjectContext, name: String, age: Int32) {
        let person = Person(context: context)
        person.id = UUID()
        person.name = name
        person.age = age
        person.createdAt = Date()
        
        try? context.save()
    }
}
```

### App Lifecycle Management

```swift
import UIKit

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        configureAppearance()
        setupNotifications()
        return true
    }
    
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
    
    private func configureAppearance() {
        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = .systemBlue
        UINavigationBar.appearance().standardAppearance = navBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navBarAppearance
    }
    
    private func setupNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }
}
```

## Best Practices

1. **Use SwiftUI for New Projects**: Declarative UI leads to fewer bugs and easier state management
2. **Adopt Async/Await**: Modern concurrency patterns replace completion handlers
3. **Support Dark Mode**: Ensure all colors and assets work in both light and dark appearances
4. **Implement Proper Memory Management**: Use weak/unowned references to prevent retain cycles
5. **Follow Human Interface Guidelines**: Apple's design guidelines ensure consistent user experience
6. **Use TestFlight for Beta Testing**: Gather feedback before App Store release
7. **Optimize App Launch Time**: Lazy load resources and minimize main thread work
8. **Implement Proper Error Handling**: Provide meaningful error messages to users
9. **Use Xcode Cloud or Fastlane**: Automate builds and testing pipelines
10. **Monitor App Performance**: Use Instruments to identify memory leaks and performance bottlenecks
